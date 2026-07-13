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
from features_engine import compute_market_returns, load_and_engineer, get_feature_columns

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-model-training")

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

    market_returns = compute_market_returns(datasets_dir)
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    # 2. Second Pass: Calculate indicators, targets, lags, and merge datasets
    combined_data_list = []
    
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)

            # Generate target variable (5 days future return > 2%)
            # future_return = (Close(t+5) - Close(t)) / Close(t)
            df['future_return_5d'] = (df['Close'].shift(-5) - df['Close']) / df['Close']
            df['target'] = (df['future_return_5d'] > 0.02).astype(int)

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
    features = get_feature_columns(full_df)
    
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
