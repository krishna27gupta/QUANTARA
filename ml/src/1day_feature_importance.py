import os
import glob
import logging
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from label_experiments import compute_dynamic_touch_label
from walk_forward_cv import FOLD_BOUNDARIES, permutation_importance_with_control

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-1day-importance")

def main():
    datasets_dir = "ml/datasets"
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    market_returns = compute_market_returns(datasets_dir)

    combined = []
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            combined.append(df)
        except Exception as e:
            pass

    df = pd.concat(combined)
    df = df.dropna(subset=get_feature_columns(df)).copy()
    features = get_feature_columns(df)
    
    # 1-Day Hold (+2%/-2%) label
    df['target'] = compute_dynamic_touch_label(df, 1, pd.Series(0.02, index=df.index), pd.Series(-0.02, index=df.index))
    df = df.dropna(subset=['target'])
    
    X = df[features]
    y = df['target'].astype(int).values
    date_index = df.index
    
    params = {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.05, 'num_leaves': 31, 'verbose': -1, 'random_state': 42}
    
    fold_importances = []
    
    for i, fold in enumerate(FOLD_BOUNDARIES):
        train_end = pd.Timestamp(fold["train_end"])
        test_start = pd.Timestamp(fold["test_start"])
        test_end = pd.Timestamp(fold["test_end"])
        
        train_mask = date_index <= train_end
        test_mask = (date_index >= test_start) & (date_index <= test_end)
        
        if not test_mask.any():
            continue
            
        X_train, y_train = X[train_mask], y[train_mask]
        X_test, y_test = X[test_mask], y[test_mask]
        
        if len(np.unique(y_test)) < 2:
            continue
            
        logger.info(f"Training Fold {i+1}...")
        model = lgb.LGBMClassifier(**params)
        model.fit(X_train, y_train)
        
        logger.info(f"Computing permutation importance for Fold {i+1}...")
        perm_result = permutation_importance_with_control(model, X_test, y_test, scoring='roc_auc', n_repeats=5)
        fold_importances.append((len(y_test), perm_result['importances']))

    # Aggregate across folds (weighted average by fold size)
    total_samples = sum(size for size, _ in fold_importances)
    avg_importances = {}
    
    for feat in features:
        weighted_mean = sum(size * result[feat]['mean'] for size, result in fold_importances) / total_samples
        avg_importances[feat] = weighted_mean
        
    top_features = sorted(avg_importances.items(), key=lambda x: x[1], reverse=True)[:10]
    
    logger.info("Top 10 Features for 1-Day Hold:")
    for f, imp in top_features:
        logger.info(f"  {f}: {imp:.5f}")

    # Write report template
    report_path = os.path.join(workspace_root, "docs", "label_1day_feature_analysis.md")
    with open(report_path, "w") as f:
        f.write("# 1-Day Hold (+2%/-2%) Feature Importance Analysis\n\n")
        f.write("Averaged across all Walk-Forward CV folds, these are the top 10 most predictive features for achieving a 2% up-move before a 2% down-move in a single trading day (net of 0.5% round-trip costs):\n\n")
        
        for i, (feat, imp) in enumerate(top_features):
            f.write(f"{i+1}. **{feat}** (Importance: {imp:.4f})\n")
            if i < 5:
                f.write(f"   - *Interpretation: [TO BE FILLED]*\n")
                
    logger.info("Report template created.")

if __name__ == "__main__":
    main()
