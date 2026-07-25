"""
profit.py

Profit predictor serving module. Returns evidence-first output: profit probability
with AUC confidence interval and base win rate context.
"""
import os
import pickle
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

import pandas as pd

try:
    from .features_engine import build_live_feature_row
except ImportError:
    from features_engine import build_live_feature_row

logger = logging.getLogger("quantara-ml-profit")


class BaseProfitPredictor(ABC):
    @abstractmethod
    async def predict_profitability(self, features: Dict[str, Any]) -> Dict[str, Any]:
        pass


class ProfitPredictor(BaseProfitPredictor):
    """
    RandomForest + XGBoost ensemble predicting probability that a trade taken today
    hits +4% before -2% within a 5-day holding window. Returns evidence with AUC CI,
    not a bare probability.
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "3.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.rf_path = os.path.join(self.workspace_root, models_dir, "profit_rf.pkl")
        self.xgb_path = os.path.join(self.workspace_root, models_dir, "profit_xgb.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "profit_feature_metadata.json")

        self.rf_model = None
        self.xgb_model = None
        self.features = []
        self.auc_ci = {}
        self.base_win_rate = 33.8

        try:
            if os.path.exists(self.rf_path):
                with open(self.rf_path, "rb") as f:
                    self.rf_model = pickle.load(f)
            if os.path.exists(self.xgb_path):
                with open(self.xgb_path, "rb") as f:
                    self.xgb_model = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
                    self.base_win_rate = meta.get("base_rate_win_pct", 33.8)
                    # Load AUC CI from the XGBoost model
                    xgb_metrics = meta.get("metrics", {}).get("xgboost", {})
                    self.auc_ci = {
                        "ci_lower": xgb_metrics.get("auc_ci_lower"),
                        "ci_upper": xgb_metrics.get("auc_ci_upper"),
                        "point_auc": xgb_metrics.get("auc"),
                        "p_value_vs_random": xgb_metrics.get("auc_p_value_vs_random"),
                        "excludes_0_5": xgb_metrics.get("auc_excludes_0_5"),
                    }
            logger.info("Loaded profit models (RF + XGBoost) with AUC CI.")
        except Exception as e:
            logger.error(f"Failed to load profit models: {e}")

    def predict(self, symbol: str) -> Dict[str, Any]:
        """Evidence-first inference: probability + AUC CI + base rate."""
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            feature_names = self.features if self.features else list(row.keys())
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in feature_names}])

            prob_rf = float(self.rf_model.predict_proba(X)[0, 1]) if self.rf_model else 0.5
            prob_xgb = float(self.xgb_model.predict_proba(X)[0, 1]) if self.xgb_model else 0.5
            prob = (prob_rf + prob_xgb) / 2.0

            return {
                "model_type": "Ensemble (RandomForest + XGBoost) - walk-forward CV trained",
                "model_version": self.version,
                "profit_probability": round(prob, 4),
                "rf_probability": round(prob_rf, 4),
                "xgb_probability": round(prob_xgb, 4),
                "label_definition": "P(price touches +4% before -2% within 5 trading days)",
                "base_win_rate_pct": self.base_win_rate,
                "auc_confidence_interval": self.auc_ci,
            }
        except Exception as e:
            logger.error(f"Profit inference error for {symbol}: {e}")
            return {
                "model_type": "Ensemble (RandomForest + XGBoost) - walk-forward CV trained",
                "model_version": self.version,
                "profit_probability": 0.5,
                "base_win_rate_pct": self.base_win_rate,
                "auc_confidence_interval": self.auc_ci,
                "error": "fallback_used",
            }

    async def predict_profitability(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Async wrapper for API layer."""
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            return {
                "model_type": "Ensemble (RandomForest + XGBoost) - walk-forward CV trained",
                "model_version": self.version,
                "profit_probability": 0.5,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
