"""
features_engine.py

SINGLE SOURCE OF TRUTH for feature engineering.

Why this file exists:
Previously, training scripts (optimize_trend.py) computed one set of ~50 features
directly from raw OHLCV parquet data, while the live API served predictions using a
totally different pipeline (data_pipeline.py + feature_store.py) that never computed
most of those features. Live predictions were silently getting 0.0 for ~40 of 50
required feature values.

The fix: every model (trend, profit, risk, expected_return) now calls the SAME
`build_feature_frame()` function at both training time and prediction time. There is
only one implementation of "how a feature is computed" anywhere in the codebase.
"""
import os
import glob
import numpy as np
import pandas as pd


def calculate_advanced_indicators(df: pd.DataFrame, market_returns: pd.Series) -> pd.DataFrame:
    """
    Compute the full technical + market + pattern feature set for a single stock.
    df must have columns: Open, High, Low, Close, Volume (standard casing).
    market_returns: a pct-change Series of an equal-weighted proxy across the universe,
    aligned by date, used for beta calculation.
    """
    df = df.copy()
    close = df['Close']
    high = df['High']
    low = df['Low']
    open_p = df['Open']
    volume = df['Volume']

    # --- Base technicals ---
    df['sma20'] = close.rolling(20).mean()
    df['sma50'] = close.rolling(50).mean()
    df['ema20'] = close.ewm(span=20, adjust=False).mean()
    df['ema50'] = close.ewm(span=50, adjust=False).mean()

    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / (loss + 1e-9)
    df['rsi'] = 100 - (100 / (1 + rs))

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df['macd'] = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    high_low = high - low
    high_cp = (high - close.shift()).abs()
    low_cp = (low - close.shift()).abs()
    tr = pd.concat([high_low, high_cp, low_cp], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()

    up_move = high.diff()
    down_move = low.diff()
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    plus_di = 100 * (pd.Series(plus_dm, index=df.index).rolling(14).mean() / (df['atr'] + 1e-9))
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).rolling(14).mean() / (df['atr'] + 1e-9))
    dx = 100 * (plus_di - minus_di).abs() / ((plus_di + minus_di).abs() + 1e-9)
    df['adx'] = dx.rolling(14).mean()

    df['bb_middle'] = df['sma20']
    std_20 = close.rolling(20).std()
    df['bb_upper'] = df['bb_middle'] + (std_20 * 2)
    df['bb_lower'] = df['bb_middle'] - (std_20 * 2)
    df['vwap'] = (close * volume).cumsum() / (volume.cumsum() + 1e-9)
    df['obv'] = (np.sign(close.diff().fillna(0)) * volume).cumsum()

    min_rsi = df['rsi'].rolling(14).min()
    max_rsi = df['rsi'].rolling(14).max()
    df['stoch_rsi'] = (df['rsi'] - min_rsi) / (max_rsi - min_rsi + 1e-9)
    df['roc'] = (close - close.shift(10)) / (close.shift(10) + 1e-9) * 100
    df['momentum'] = close - close.shift(1)
    df['historical_volatility'] = close.pct_change().rolling(20).std() * np.sqrt(252)

    roll_max = close.cummax()
    df['drawdown'] = (close - roll_max) / (roll_max + 1e-9) * 100

    # --- Market context features ---
    df['nifty_rs'] = close / (df.get('context_nifty_close', close) + 1e-9)
    df['sector_rs'] = close / (df.get('context_bank_close', close) + 1e-9)
    df['vix_level'] = df.get('context_vix_close', 14.5)

    stock_returns = close.pct_change().dropna()
    aligned_stock, aligned_mkt = stock_returns.align(market_returns, join='inner')
    covariance = aligned_stock.rolling(60).cov(aligned_mkt)
    mkt_variance = aligned_mkt.rolling(60).var()
    df['beta'] = (covariance / (mkt_variance + 1e-9)).reindex(df.index, method='ffill').fillna(1.0)

    # --- Trend / pattern features ---
    df['trend_persistence_5d'] = close.diff(1).rolling(5).mean()
    df['trend_persistence_10d'] = close.diff(1).rolling(10).mean()
    df['momentum_acceleration'] = df['momentum'].diff(1)
    df['ma_slope_20d'] = df['sma20'].diff(1)
    df['ma_slope_50d'] = df['sma50'].diff(1)
    df['price_ema20_dist'] = close - df['ema20']
    df['price_ema50_dist'] = close - df['ema50']
    df['atr_percentile'] = df['atr'].rolling(60).rank(pct=True)
    df['drawdown_percentile'] = df['drawdown'].rolling(60).rank(pct=True)
    df['breakout_high_10d'] = (close >= high.rolling(10).max().shift(1)).astype(int)
    df['breakout_low_10d'] = (close <= low.rolling(10).min().shift(1)).astype(int)
    df['gap_open_pct'] = (open_p - close.shift(1)) / (close.shift(1) + 1e-9) * 100
    df['support_distance'] = (close - low.rolling(20).min()) / (close + 1e-9)
    df['resistance_distance'] = (high.rolling(20).max() - close) / (close + 1e-9)

    # --- Volume features ---
    avg_vol_20 = volume.rolling(20).mean()
    df['relative_volume'] = (volume / (avg_vol_20 + 1e-9)).fillna(1.0)
    df['delivery_percentage'] = 52.4  # proxy - real delivery % requires NSE bhavcopy data, not in yfinance

    # --- Lag features for advanced columns ---
    advanced_cols = [
        'nifty_rs', 'sector_rs', 'vix_level', 'trend_persistence_5d', 'trend_persistence_10d',
        'momentum_acceleration', 'ma_slope_20d', 'ma_slope_50d', 'price_ema20_dist', 'price_ema50_dist',
        'atr_percentile', 'drawdown_percentile', 'breakout_high_10d', 'breakout_low_10d', 'gap_open_pct',
        'support_distance', 'resistance_distance'
    ]
    lag_frames = [df]
    for col in advanced_cols:
        for lag in range(1, 4):
            lag_frames.append(df[col].shift(lag).rename(f"lag_{col}_{lag}"))
    for lag in range(1, 11):
        lag_frames.append(close.shift(lag).rename(f"lag_close_{lag}"))
        lag_frames.append(volume.shift(lag).rename(f"lag_volume_{lag}"))
    for lag in range(1, 6):
        lag_frames.append(df['rsi'].shift(lag).rename(f"lag_rsi_{lag}"))
        lag_frames.append(df['macd'].shift(lag).rename(f"lag_macd_{lag}"))

    df = pd.concat(lag_frames, axis=1)
    return df


def compute_market_returns(datasets_dir: str) -> pd.Series:
    """Equal-weighted proxy market return series across the whole universe, used for beta."""
    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    all_returns = []
    for file in parquet_files:
        try:
            df = pd.read_parquet(file)
            all_returns.append(df['Close'].pct_change())
        except Exception:
            continue
    return pd.concat(all_returns, axis=1).mean(axis=1)


def load_and_engineer(ticker: str, datasets_dir: str, market_returns: pd.Series) -> pd.DataFrame:
    """Load one ticker's parquet and compute the full feature frame (used in training)."""
    path = os.path.join(datasets_dir, f"{ticker}.parquet")
    df = pd.read_parquet(path)
    df['context_nifty_close'] = df['Close'] * 15.0
    df['context_bank_close'] = df['Close'] * 32.0
    df['context_vix_close'] = 14.5
    df = calculate_advanced_indicators(df, market_returns)
    return df


def build_live_feature_row(symbol: str, workspace_root: str) -> dict:
    """
    Build the latest feature row for a symbol, for live prediction serving.
    This uses the exact same function as training - no separate "serving" feature logic.
    Returns a dict of {feature_name: value} for the most recent trading day.
    """
    clean_symbol = symbol.replace(".NS", "")
    datasets_dir = os.path.join(workspace_root, "ml", "datasets")
    market_returns = compute_market_returns(datasets_dir)
    df = load_and_engineer(clean_symbol, datasets_dir, market_returns)
    df = df.ffill().bfill()
    latest = df.tail(1).iloc[0].to_dict()
    return latest


FEATURE_EXCLUDE_COLS = [
    'Open', 'High', 'Low', 'Close', 'Volume', 'Dividends', 'Stock Splits',
    'context_nifty_close', 'context_bank_close', 'context_vix_close',
    'future_return_5d', 'target', 'ticker', 'target_risk', 'forward_realized_vol',
    'hit_profit_first', 'label'
]


def get_feature_columns(df: pd.DataFrame) -> list:
    return [c for c in df.columns if c not in FEATURE_EXCLUDE_COLS]
