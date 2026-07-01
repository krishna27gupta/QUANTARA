import os
import glob
import json
import pickle
import logging
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
import shap
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-model-training")

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate the core quantitative indicators required for features engineering."""
    df = df.copy()
    close = df['Close']
    high = df['High']
    low = df['Low']
    volume = df['Volume']

    # 1. Moving Averages
    df['sma20'] = close.rolling(20).mean()
    df['sma50'] = close.rolling(50).mean()
    df['ema20'] = close.ewm(span=20, adjust=False).mean()
    df['ema50'] = close.ewm(span=50, adjust=False).mean()

    # 2. RSI
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / (loss + 1e-9)
    df['rsi'] = 100 - (100 / (1 + rs))

    # 3. MACD
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df['macd'] = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    # 4. ATR
    high_low = high - low
    high_cp = (high - close.shift()).abs()
    low_cp = (low - close.shift()).abs()
    tr = pd.concat([high_low, high_cp, low_cp], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()

    # 5. ADX
    up_move = high.diff()
    down_move = low.diff()
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    plus_di = 100 * (pd.Series(plus_dm, index=df.index).rolling(14).mean() / (df['atr'] + 1e-9))
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).rolling(14).mean() / (df['atr'] + 1e-9))
    dx = 100 * (plus_di - minus_di).abs() / ((plus_di + minus_di).abs() + 1e-9)
    df['adx'] = dx.rolling(14).mean()

    # 6. Bollinger Bands
    df['bb_middle'] = df['sma20']
    std_20 = close.rolling(20).std()
    df['bb_upper'] = df['bb_middle'] + (std_20 * 2)
    df['bb_lower'] = df['bb_middle'] - (std_20 * 2)

    # 7. VWAP
    df['vwap'] = (close * volume).cumsum() / (volume.cumsum() + 1e-9)

    # 8. OBV
    df['obv'] = (np.sign(close.diff().fillna(0)) * volume).cumsum()

    # 9. Stochastic RSI
    min_rsi = df['rsi'].rolling(14).min()
    max_rsi = df['rsi'].rolling(14).max()
    df['stoch_rsi'] = (df['rsi'] - min_rsi) / (max_rsi - min_rsi + 1e-9)

    # 10. ROC & Momentum
    df['roc'] = (close - close.shift(10)) / (close.shift(10) + 1e-9) * 100
    df['momentum'] = close - close.shift(1)

    # 11. Historical Volatility & Drawdown
    df['historical_volatility'] = close.pct_change().rolling(20).std() * np.sqrt(252)
    roll_max = close.cummax()
    df['drawdown'] = (close - roll_max) / (roll_max + 1e-9) * 100

    return df

def main():
    logger.info("Initializing ML Model Training Pipeline...")
    datasets_dir = "ml/datasets"
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    if not parquet_files:
        logger.error(f"No parquet datasets found in {datasets_dir}. Exiting.")
        return

    logger.info(f"Found {len(parquet_files)} stock datasets.")

    # 1. First Pass: Read all stocks to construct a market index proxy (average returns) for Beta calculation
    all_returns = []
    for file in parquet_files:
        try:
            df = pd.read_parquet(file)
            ret = df['Close'].pct_change()
            all_returns.append(ret)
        except Exception as e:
            logger.warning(f"Error loading {file} for market returns: {e}")

    market_returns = pd.concat(all_returns, axis=1).mean(axis=1)

    # 2. Second Pass: Calculate indicators, targets, lags, and merge datasets
    combined_data_list = []
    
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = pd.read_parquet(file)
            df = calculate_indicators(df)

            # Calculate Beta (rolling covariance relative to market returns)
            stock_returns = df['Close'].pct_change().dropna()
            aligned_stock, aligned_mkt = stock_returns.align(market_returns, join='inner')
            covariance = aligned_stock.rolling(60).cov(aligned_mkt)
            mkt_variance = aligned_mkt.rolling(60).var()
            df['beta'] = (covariance / (mkt_variance + 1e-9)).reindex(df.index, method='ffill').fillna(1.0)

            # Generate target variable (5 days future return > 2%)
            # future_return = (Close(t+5) - Close(t)) / Close(t)
            df['future_return_5d'] = (df['Close'].shift(-5) - df['Close']) / df['Close']
            df['target'] = (df['future_return_5d'] > 0.02).astype(int)

            # Generate Lags features (close, volume, rsi, macd)
            for lag in range(1, 11):
                df[f"lag_close_{lag}"] = df['Close'].shift(lag)
                df[f"lag_volume_{lag}"] = df['Volume'].shift(lag)
            for lag in range(1, 6):
                df[f"lag_rsi_{lag}"] = df['rsi'].shift(lag)
                df[f"lag_macd_{lag}"] = df['macd'].shift(lag)

            # Drop lines with NaNs in targets or features
            df = df.dropna()
            
            # Record ticker identifier column for tracking
            df['ticker'] = ticker
            
            combined_data_list.append(df)
            logger.info(f"Processed {ticker}: {len(df)} rows.")
        except Exception as e:
            logger.error(f"Error processing model features for {ticker}: {e}")

    if not combined_data_list:
        logger.error("No valid stock feature data generated. Exiting.")
        return

    full_df = pd.concat(combined_data_list)
    logger.info(f"Combined dataset shape: {full_df.shape}")

    # 3. Features list definition (50–100 features)
    indicator_cols = [
        'sma20', 'sma50', 'ema20', 'ema50', 'rsi', 'macd', 'macd_signal', 'macd_hist',
        'atr', 'adx', 'bb_middle', 'bb_upper', 'bb_lower', 'vwap', 'obv', 'stoch_rsi',
        'roc', 'momentum', 'historical_volatility', 'drawdown', 'beta'
    ]
    lag_cols = [c for c in full_df.columns if c.startswith("lag_")]
    features = indicator_cols + lag_cols
    
    logger.info(f"Active training features count: {len(features)}")

    # 4. Split chronologically
    # Index is Date index
    train_df = full_df[full_df.index < '2023-01-01']
    val_df = full_df[(full_df.index >= '2023-01-01') & (full_df.index < '2024-01-01')]
    test_df = full_df[full_df.index >= '2024-01-01']

    X_train, y_train = train_df[features], train_df['target']
    X_val, y_val = val_df[features], val_df['target']
    X_test, y_test = test_df[features], test_df['target']

    logger.info(f"Split sizes: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    # 5. Train XGBoost
    logger.info("Training XGBoost Classifier...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.05,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    # 6. Train LightGBM
    logger.info("Training LightGBM Classifier...")
    lgb_model = lgb.LGBMClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.05,
        random_state=42,
        verbose=-1
    )
    lgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)])

    # 7. Model Evaluation
    def eval_model(model, name: str):
        train_preds = model.predict(X_train)
        val_preds = model.predict(X_val)
        test_preds = model.predict(X_test)
        test_probs = model.predict_proba(X_test)[:, 1]

        acc_train = accuracy_score(y_train, train_preds)
        acc_val = accuracy_score(y_val, val_preds)
        acc_test = accuracy_score(y_test, test_preds)
        
        prec = precision_score(y_test, test_preds, zero_division=0)
        rec = recall_score(y_test, test_preds, zero_division=0)
        f1 = f1_score(y_test, test_preds, zero_division=0)
        auc = roc_auc_score(y_test, test_probs)

        # Win Rate of prediction (predicted positive class actual profitability outcomes)
        # Fraction of times a BUY recommendation returned positive return (>0)
        test_df_copy = test_df.copy()
        test_df_copy['pred'] = test_preds
        buy_signals = test_df_copy[test_df_copy['pred'] == 1]
        win_rate = (buy_signals['future_return_5d'] > 0).mean() * 100 if len(buy_signals) > 0 else 0.0

        return {
            "name": name,
            "train_acc": acc_train,
            "val_acc": acc_val,
            "test_acc": acc_test,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "auc": auc,
            "win_rate": win_rate
        }

    xgb_metrics = eval_model(xgb_model, "XGBoost")
    lgb_metrics = eval_model(lgb_model, "LightGBM")

    # 8. SHAP calculations on validation data
    logger.info("Computing SHAP values for LightGBM model...")
    explainer = shap.TreeExplainer(lgb_model)
    shap_values = explainer(X_val)
    mean_shap = np.abs(shap_values.values).mean(axis=0)
    shap_importance = dict(zip(features, mean_shap))

    # Sort feature importances
    sorted_features = sorted(shap_importance.items(), key=lambda x: x[1], reverse=True)
    top_20 = sorted_features[:20]

    # Save Models Persistence
    logger.info(f"Saving models and feature metadata to {models_dir}...")
    with open(os.path.join(models_dir, "trend_xgboost.pkl"), "wb") as f:
        pickle.dump(xgb_model, f)
    with open(os.path.join(models_dir, "trend_lightgbm.pkl"), "wb") as f:
        pickle.dump(lgb_model, f)

    # Save feature metadata
    meta = {
        "features": features,
        "metrics": {
            "xgboost": {k: float(v) if not isinstance(v, str) else v for k, v in xgb_metrics.items()},
            "lightgbm": {k: float(v) if not isinstance(v, str) else v for k, v in lgb_metrics.items()}
        },
        "top_features": [f[0] for f in top_20],
        "feature_importances": {f[0]: float(f[1]) for f in sorted_features}
    }
    with open(os.path.join(models_dir, "feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # Print validation report
    print("\n" + "="*50)
    print("MODEL TRAINING & EVALUATION VALIDATION REPORT")
    print("="*50)
    print(f"Total dataset records: {len(full_df)}")
    print(f"Features dimension:    {len(features)}")
    print(f"Train samples:         {len(X_train)}")
    print(f"Val samples:           {len(X_val)}")
    print(f"Test samples:          {len(X_test)}")
    print("-"*50)
    print("Metrics Evaluation:")
    for metrics in [xgb_metrics, lgb_metrics]:
        print(f"\nModel: {metrics['name']}")
        print(f"  Training Accuracy:   {metrics['train_acc']:.4f}")
        print(f"  Validation Accuracy: {metrics['val_acc']:.4f}")
        print(f"  Test Accuracy:       {metrics['test_acc']:.4f}")
        print(f"  Precision:           {metrics['precision']:.4f}")
        print(f"  Recall:              {metrics['recall']:.4f}")
        print(f"  F1-Score:            {metrics['f1']:.4f}")
        print(f"  ROC-AUC:             {metrics['auc']:.4f}")
        print(f"  Trade Win Rate:      {metrics['win_rate']:.2f}%")
    print("-"*50)
    print("Top 20 Features Importance (SHAP):")
    for rank, (feat, val) in enumerate(top_20, 1):
        print(f"  {rank:<2}. {feat:<28} : {val:.6f}")
    print("="*50)

if __name__ == "__main__":
    main()
