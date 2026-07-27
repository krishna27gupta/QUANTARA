"""
track_record.py

Track record and calibration engine for Quantara's models.

Computes honest historical accuracy from the actual validation logs produced
by autonomous_validation.py and paper_trading.py. Degrades gracefully when
data is insufficient — reports "not enough data" rather than misleading
percentages from tiny samples.

Data sources:
  - paper_trading/closed_positions.csv (autonomous_validation.py output)
  - ml/paper_portfolio/closed_trades.csv (paper_trading.py output)
  - models/*_feature_metadata.json (backtest metrics for context)
"""
import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

logger = logging.getLogger("quantara-track-record")

# Minimum sample sizes for reliable reporting
MIN_SAMPLE_CONFIDENT = 30   # Below this, show explicit "small sample" caveat
MIN_SAMPLE_DISPLAY = 5      # Below this, refuse to show any statistic


def _wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple:
    """Wilson score interval for a proportion — better than normal approx for small n."""
    if n == 0:
        return (0.0, 0.0)
    p_hat = successes / n
    denom = 1 + z**2 / n
    center = (p_hat + z**2 / (2 * n)) / denom
    margin = z * np.sqrt((p_hat * (1 - p_hat) + z**2 / (4 * n)) / n) / denom
    return (max(0.0, center - margin), min(1.0, center + margin))


def _load_trade_logs(workspace_root: str) -> pd.DataFrame:
    """
    Load and deduplicate closed trade logs from both validation sources.

    Returns a unified DataFrame with columns:
        trade_id, date, symbol, pnl_pct, holding_days, exit_reason, confidence
    """
    frames = []

    # Source 1: autonomous_validation.py logs
    path_av = os.path.join(workspace_root, "paper_trading", "closed_positions.csv")
    if os.path.exists(path_av):
        try:
            df = pd.read_csv(path_av)
            frames.append(pd.DataFrame({
                "trade_id": df["trade_id"],
                "date": pd.to_datetime(df["date"]),
                "symbol": df["symbol"],
                "pnl_pct": df["pnl_percent"],
                "holding_days": df["holding_days"],
                "exit_reason": df["status"],
                "confidence": df["confidence"],
                "source": "autonomous_validation",
            }))
        except Exception as e:
            logger.warning(f"Failed to load autonomous validation logs: {e}")

    # Source 2: paper_trading.py logs
    path_pt = os.path.join(workspace_root, "ml", "paper_portfolio", "closed_trades.csv")
    if os.path.exists(path_pt):
        try:
            df = pd.read_csv(path_pt)
            frames.append(pd.DataFrame({
                "trade_id": df["trade_id"],
                "date": pd.to_datetime(df["date"]),
                "symbol": df["symbol"],
                "pnl_pct": df["pnl_pct"],
                "holding_days": df["holding_period"],
                "exit_reason": df["reason"],
                "confidence": df["confidence"],
                "source": "paper_trading",
            }))
        except Exception as e:
            logger.warning(f"Failed to load paper trading logs: {e}")

    if not frames:
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)

    # Deduplicate by trade_id
    combined = combined.drop_duplicates(subset=["trade_id"], keep="first")
    combined = combined.sort_values("date").reset_index(drop=True)
    return combined


def _load_backtest_metrics(workspace_root: str) -> Dict[str, Any]:
    """Load backtest metrics from model metadata JSONs for context comparison."""
    models_dir = os.path.join(workspace_root, "models")
    metrics = {}

    for name, filename in [
        ("risk", "risk_feature_metadata.json"),
        ("trend", "feature_metadata.json"),
        ("profit", "profit_feature_metadata.json"),
        ("expected_return", "return_feature_metadata.json"),
    ]:
        path = os.path.join(models_dir, filename)
        if os.path.exists(path):
            with open(path) as f:
                metrics[name] = json.load(f).get("metrics", {})

    return metrics


def _sample_caveat(n: int, model_name: str) -> Optional[str]:
    """Generate appropriate sample-size caveat."""
    if n < MIN_SAMPLE_DISPLAY:
        return (
            f"Not enough data yet for a reliable {model_name} track record "
            f"(N={n} trade{'s' if n != 1 else ''} so far). "
            f"At least {MIN_SAMPLE_CONFIDENT} closed trades are needed for meaningful statistics."
        )
    if n < MIN_SAMPLE_CONFIDENT:
        return (
            f"Small sample warning: {model_name} statistics are based on only "
            f"N={n} trade{'s' if n != 1 else ''}. "
            f"Confidence intervals are wide — treat these numbers as preliminary, not conclusive."
        )
    return None


def compute_trend_track_record(trades: pd.DataFrame, backtest: Dict) -> Dict[str, Any]:
    """
    Compute realized track record for the trend/profit signal.

    The trend model's output is used as the entry signal. A "win" is defined
    as a trade that closed with positive PnL.
    """
    n = len(trades)
    caveat = _sample_caveat(n, "trend/profit signal")

    if n < MIN_SAMPLE_DISPLAY:
        return {
            "status": "insufficient_data",
            "sample_size": n,
            "caveat": caveat,
        }

    wins = (trades["pnl_pct"] > 0).sum()
    win_rate = wins / n
    ci_low, ci_high = _wilson_ci(int(wins), n)

    # Breakdown by exit type
    exit_breakdown = trades["exit_reason"].value_counts().to_dict()

    result = {
        "status": "preliminary" if n < MIN_SAMPLE_CONFIDENT else "reliable",
        "sample_size": n,
        "validation_period": {
            "start": str(trades["date"].min().date()),
            "end": str(trades["date"].max().date()),
        },
        "realized_win_rate": {
            "value": round(win_rate * 100, 1),
            "ci_95_lower": round(ci_low * 100, 1),
            "ci_95_upper": round(ci_high * 100, 1),
            "unit": "percent",
        },
        "realized_pnl": {
            "mean_pct": round(trades["pnl_pct"].mean(), 2),
            "median_pct": round(trades["pnl_pct"].median(), 2),
            "total_trades": n,
            "winning_trades": int(wins),
            "losing_trades": n - int(wins),
        },
        "exit_reasons": exit_breakdown,
        "backtest_comparison": {
            "backtest_profit_auc": backtest.get("profit", {}).get("random_forest", {}).get("auc"),
            "backtest_trend_auc": backtest.get("trend", {}).get("xgboost", {}).get("auc"),
            "note": "Backtest AUC is from walk-forward CV, not live validation.",
        },
    }

    if caveat:
        result["caveat"] = caveat

    return result


def compute_risk_track_record(trades: pd.DataFrame, backtest: Dict) -> Dict[str, Any]:
    """
    Compute realized track record for the risk model.

    Since the trade logs don't record the specific risk prediction made at
    entry time, we report the indirect metric: how well the risk filter
    (which excludes HIGH-risk stocks) performs as measured by the loss rate
    and stop-loss hit rate.
    """
    n = len(trades)
    caveat = _sample_caveat(n, "risk model")

    if n < MIN_SAMPLE_DISPLAY:
        return {
            "status": "insufficient_data",
            "sample_size": n,
            "caveat": caveat,
        }

    # Stop-loss hits indicate risk was underestimated
    stop_loss_hits = (trades["exit_reason"].isin(["STOP_LOSS"])).sum()
    stop_loss_rate = stop_loss_hits / n
    sl_ci_low, sl_ci_high = _wilson_ci(int(stop_loss_hits), n)

    # Backtest accuracy for context
    bt_risk = backtest.get("risk", {})

    result = {
        "status": "preliminary" if n < MIN_SAMPLE_CONFIDENT else "reliable",
        "sample_size": n,
        "validation_period": {
            "start": str(trades["date"].min().date()),
            "end": str(trades["date"].max().date()),
        },
        "stop_loss_rate": {
            "value": round(stop_loss_rate * 100, 1),
            "ci_95_lower": round(sl_ci_low * 100, 1),
            "ci_95_upper": round(sl_ci_high * 100, 1),
            "interpretation": (
                "Percentage of trades that hit the -2% stop loss. "
                "Lower is better — indicates the risk filter is working."
            ),
        },
        "backtest_comparison": {
            "backtest_accuracy": bt_risk.get("test_accuracy"),
            "random_baseline": bt_risk.get("random_baseline_accuracy"),
            "note": (
                "Per-prediction risk accuracy cannot be computed from trade logs alone "
                "because the logs do not record the specific risk-level prediction at entry. "
                "The stop-loss rate serves as an indirect proxy."
            ),
        },
        "data_limitation": (
            "The trade logs record only the final trade outcome, not the per-row "
            "risk prediction. To compute true risk model accuracy (predicted vs realized "
            "volatility tercile), a dedicated prediction log with the risk label recorded "
            "at prediction time is needed. This is a known gap for future implementation."
        ),
    }

    if caveat:
        result["caveat"] = caveat

    return result


def compute_return_track_record(trades: pd.DataFrame, backtest: Dict) -> Dict[str, Any]:
    """
    Compute calibration data for the expected return model.

    Since the trade logs don't record the predicted quantile band at entry time,
    we report what we can: the actual distribution of realized 5-day returns
    from the validation period, compared to the backtest calibration.
    """
    n = len(trades)
    caveat = _sample_caveat(n, "expected return model")

    if n < MIN_SAMPLE_DISPLAY:
        return {
            "status": "insufficient_data",
            "sample_size": n,
            "caveat": caveat,
        }

    returns = trades["pnl_pct"].values

    # Empirical quantiles from validation trades
    quantiles = [10, 25, 50, 75, 90]
    empirical_quantiles = {
        f"p{q}": round(float(np.percentile(returns, q)), 2)
        for q in quantiles
    }

    # Compare to backtest calibration
    bt_return = backtest.get("expected_return", {})

    result = {
        "status": "preliminary" if n < MIN_SAMPLE_CONFIDENT else "reliable",
        "sample_size": n,
        "validation_period": {
            "start": str(trades["date"].min().date()),
            "end": str(trades["date"].max().date()),
        },
        "realized_return_distribution": {
            "mean_pct": round(float(returns.mean()), 2),
            "std_pct": round(float(returns.std()), 2),
            "empirical_quantiles": empirical_quantiles,
        },
        "backtest_comparison": {
            "backtest_r2": bt_return.get("median_r2"),
            "backtest_band_calibration": bt_return.get("pct_actuals_within_10_90_band"),
            "note": (
                "Backtest R² ≈ 0 confirms the point estimate has no predictive value. "
                "The uncertainty band (10th–90th percentile) is the useful output."
            ),
        },
        "data_limitation": (
            "The trade logs do not record the predicted quantile band at entry time. "
            "A true calibration plot (predicted vs actual quantile frequency) requires "
            "a dedicated prediction log. This shows the empirical return distribution "
            "from live validation trades as a proxy."
        ),
    }

    if caveat:
        result["caveat"] = caveat

    return result


def generate_track_record(workspace_root: str) -> Dict[str, Any]:
    """
    Generate the full track record report from actual validation logs.

    Returns a structured dict suitable for the /api/v1/track-record endpoint.
    """
    trades = _load_trade_logs(workspace_root)
    backtest = _load_backtest_metrics(workspace_root)

    n_total = len(trades)

    if n_total == 0:
        return {
            "status": "no_data",
            "message": (
                "No validation data exists yet. Run autonomous_validation.py or "
                "paper_trading.py to generate trade logs before viewing the track record."
            ),
            "trend_profit": {"status": "no_data", "sample_size": 0},
            "risk": {"status": "no_data", "sample_size": 0},
            "expected_return": {"status": "no_data", "sample_size": 0},
        }

    return {
        "status": "available",
        "total_validation_trades": n_total,
        "data_sources": list(trades["source"].unique()),
        "validation_period": {
            "start": str(trades["date"].min().date()),
            "end": str(trades["date"].max().date()),
        },
        "trend_profit": compute_trend_track_record(trades, backtest),
        "risk": compute_risk_track_record(trades, backtest),
        "expected_return": compute_return_track_record(trades, backtest),
        "methodology_note": (
            "All statistics on this page are computed from actual paper trading "
            "validation logs, not from backtest data. Backtest metrics are shown "
            "for comparison but are labeled as such. Small-sample caveats are "
            "displayed whenever the data is insufficient for reliable conclusions."
        ),
    }
