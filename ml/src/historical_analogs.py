"""
historical_analogs.py

Leakage-safe historical analog engine for Quantara.

For a given symbol's current feature vector (as of date D), finds the K most
similar historical setups using Euclidean distance on a standardized core
feature subset, computed ONLY against data strictly before D.

Critical leakage prevention:
  1. Only rows with dates strictly before D are searched.
  2. Standardization (mean/std) is fit only on data strictly before D.
  3. Forward returns are computed from the raw Close series, not from any
     column that was itself computed using future data.

The output is a descriptive historical statistic — never a prediction.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

logger = logging.getLogger("quantara-ml-analogs")

# Core feature subset for distance computation.
# These are interpretable, scale-independent-ish technical indicators that
# characterize the "setup" a stock is in on a given day.
ANALOG_FEATURES = [
    "rsi",
    "macd_hist",
    "atr_percentile",
    "relative_volume",
    "trend_persistence_5d",
    "historical_volatility",
    "drawdown_percentile",
    "adx",
]

FORWARD_DAYS = 5  # Must match the label horizon used in training scripts


def _compute_forward_returns(close: pd.Series, n_days: int = FORWARD_DAYS) -> pd.Series:
    """Compute n-day forward close-to-close percent return."""
    return (close.shift(-n_days) - close) / close * 100


def bootstrap_return_ci(
    returns: np.ndarray,
    n_iter: int = 1000,
    alpha: float = 0.05,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Bootstrap confidence interval on median return and hit rate from a small
    sample of analog returns. Reports honestly wide intervals for small K.
    """
    rng = np.random.RandomState(random_state)
    n = len(returns)
    if n == 0:
        return {
            "median_return_pct": None,
            "hit_rate_pct": None,
            "ci_lower_median": None,
            "ci_upper_median": None,
            "ci_lower_hit_rate": None,
            "ci_upper_hit_rate": None,
            "n_analogs": 0,
            "caveat": "No analogs found.",
        }

    boot_medians = np.empty(n_iter)
    boot_hit_rates = np.empty(n_iter)
    for i in range(n_iter):
        sample = rng.choice(returns, size=n, replace=True)
        boot_medians[i] = np.median(sample)
        boot_hit_rates[i] = (sample > 0).mean() * 100

    lo = alpha / 2
    hi = 1 - alpha / 2
    return {
        "median_return_pct": round(float(np.median(returns)), 2),
        "hit_rate_pct": round(float((returns > 0).mean() * 100), 1),
        "ci_lower_median": round(float(np.percentile(boot_medians, lo * 100)), 2),
        "ci_upper_median": round(float(np.percentile(boot_medians, hi * 100)), 2),
        "ci_lower_hit_rate": round(float(np.percentile(boot_hit_rates, lo * 100)), 1),
        "ci_upper_hit_rate": round(float(np.percentile(boot_hit_rates, hi * 100)), 1),
        "n_analogs": n,
        "caveat": (
            f"Based on {n} similar historical setups. "
            f"This is a descriptive statistic, not a prediction. "
            f"Small sample — confidence intervals are wide."
            if n < 30
            else f"Based on {n} similar historical setups. "
            f"This is a descriptive statistic, not a prediction."
        ),
    }


def find_analogs(
    df: pd.DataFrame,
    as_of_date: pd.Timestamp,
    features: List[str] = None,
    k: int = 15,
    min_gap_days: int = FORWARD_DAYS,
) -> Dict[str, Any]:
    """
    Find the K most similar historical setups for the row at as_of_date.

    Leakage safety:
      - Only searches rows with dates strictly before (as_of_date - min_gap_days)
        to ensure all analog candidates have fully realized forward returns.
      - Standardization (z-score) is fit exclusively on the history window.

    Args:
        df: Full feature DataFrame for one stock, DatetimeIndex, must contain
            columns in `features` plus 'Close'.
        as_of_date: The date for which we want analogs. Must exist in df.index.
        features: Feature columns for distance computation. Defaults to ANALOG_FEATURES.
        k: Number of analogs to return.
        min_gap_days: Calendar-day buffer before as_of_date to ensure forward
            returns are fully realized for all candidates.

    Returns:
        Dict with analog matches, aggregated statistics, and bootstrap CI.
    """
    features = features or ANALOG_FEATURES
    as_of_date = pd.Timestamp(as_of_date)

    # Validate as_of_date exists
    if as_of_date not in df.index:
        # Find nearest date on or before as_of_date
        valid_dates = df.index[df.index <= as_of_date]
        if len(valid_dates) == 0:
            return {"error": f"No data on or before {as_of_date}", "analogs": [], "summary": {}}
        as_of_date = valid_dates[-1]

    # ── Leakage-safe split ────────────────────────────────────────────────
    # History window: strictly before as_of_date, with enough room for
    # forward returns to be fully realized.
    cutoff = as_of_date - pd.Timedelta(days=min_gap_days)
    history = df[df.index < cutoff].copy()

    if len(history) < k:
        return {
            "error": f"Insufficient history ({len(history)} rows) before {as_of_date}",
            "analogs": [],
            "summary": {},
        }

    # Check that required features exist
    available_features = [f for f in features if f in df.columns]
    if len(available_features) < 3:
        return {
            "error": f"Only {len(available_features)} of {len(features)} analog features available",
            "analogs": [],
            "summary": {},
        }

    # Drop rows with NaN in the feature subset
    history_clean = history.dropna(subset=available_features)
    if len(history_clean) < k:
        return {
            "error": f"Only {len(history_clean)} valid rows after dropping NaNs",
            "analogs": [],
            "summary": {},
        }

    # ── Leakage-safe standardization ──────────────────────────────────────
    # Fit mean/std ONLY on history (data strictly before as_of_date)
    history_features = history_clean[available_features]
    hist_mean = history_features.mean()
    hist_std = history_features.std().replace(0, 1)  # Avoid division by zero

    # Standardize history
    history_z = (history_features - hist_mean) / hist_std

    # Standardize the query row using the SAME history-only statistics
    query_row = df.loc[[as_of_date], available_features]
    if query_row.isna().any(axis=1).iloc[0]:
        return {
            "error": f"Query row at {as_of_date} has NaN features",
            "analogs": [],
            "summary": {},
        }
    query_z = (query_row.values - hist_mean.values) / hist_std.values

    # ── Euclidean distance ────────────────────────────────────────────────
    distances = np.sqrt(((history_z.values - query_z) ** 2).sum(axis=1))

    # Get the K nearest
    k_actual = min(k, len(distances))
    nearest_idx = np.argpartition(distances, k_actual)[:k_actual]
    nearest_idx = nearest_idx[np.argsort(distances[nearest_idx])]

    analog_dates = history_clean.index[nearest_idx]
    analog_distances = distances[nearest_idx]

    # ── Forward returns for each analog ───────────────────────────────────
    # Compute from raw Close, not from any pre-computed column
    fwd_returns = _compute_forward_returns(df['Close'], FORWARD_DAYS)

    analogs = []
    valid_returns = []
    for i, (adate, dist) in enumerate(zip(analog_dates, analog_distances)):
        fwd_ret = fwd_returns.get(adate, np.nan)
        analog_entry = {
            "rank": i + 1,
            "date": str(adate.date()),
            "distance": round(float(dist), 4),
            "forward_return_5d_pct": round(float(fwd_ret), 2) if not np.isnan(fwd_ret) else None,
            "features": {f: round(float(df.loc[adate, f]), 4) for f in available_features},
        }
        analogs.append(analog_entry)
        if not np.isnan(fwd_ret):
            valid_returns.append(fwd_ret)

    # ── Aggregated summary with bootstrap CI ──────────────────────────────
    valid_returns_arr = np.array(valid_returns)
    summary = bootstrap_return_ci(valid_returns_arr)

    # Store standardization stats for leakage verification
    summary["standardization_stats"] = {
        "history_end_date": str(history_clean.index[-1].date()),
        "n_rows_used_for_stats": len(history_clean),
        "feature_means": {f: round(float(hist_mean[f]), 4) for f in available_features},
        "feature_stds": {f: round(float(hist_std[f]), 4) for f in available_features},
    }

    return {
        "as_of_date": str(as_of_date.date()),
        "query_features": {f: round(float(df.loc[as_of_date, f]), 4) for f in available_features},
        "analogs": analogs,
        "summary": summary,
    }


def find_analogs_for_symbol(
    symbol: str,
    workspace_root: str,
    as_of_date: Optional[str] = None,
    k: int = 15,
    search_universe: bool = False,
) -> Dict[str, Any]:
    """
    High-level entry point: load a symbol's engineered data and find analogs.

    Args:
        symbol: Ticker symbol (e.g., "RELIANCE").
        workspace_root: Path to the Quantara project root.
        as_of_date: ISO date string. Defaults to the most recent date in the data.
        k: Number of analogs.
        search_universe: If True, search across all 65 stocks (not just own history).

    Returns:
        Analog result dict suitable for inclusion in the /predict response.
    """
    import os
    try:
        from .features_engine import compute_market_returns, load_and_engineer
    except ImportError:
        from features_engine import compute_market_returns, load_and_engineer

    clean_symbol = symbol.replace(".NS", "")
    datasets_dir = os.path.join(workspace_root, "ml", "datasets")
    market_returns = compute_market_returns(datasets_dir)

    if search_universe:
        # Search across the full universe
        import glob
        parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
        combined = []
        for file in parquet_files:
            ticker = os.path.basename(file).replace(".parquet", "")
            try:
                df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
                df['_ticker'] = ticker
                combined.append(df)
            except Exception:
                continue
        full_df = pd.concat(combined)
    else:
        full_df = load_and_engineer(clean_symbol, datasets_dir, market_returns, workspace_root=workspace_root)

    full_df = full_df.ffill().bfill()

    if as_of_date is None:
        as_of_ts = full_df.index[-1]
    else:
        as_of_ts = pd.Timestamp(as_of_date)

    result = find_analogs(full_df, as_of_ts, k=k)
    result["symbol"] = clean_symbol
    result["label"] = (
        "Descriptive historical statistic — this shows what happened after "
        "similar technical setups in the past. It is NOT a prediction of future returns."
    )
    return result
