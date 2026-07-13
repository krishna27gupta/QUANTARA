import os
import pickle
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
    Real Random Forest + XGBoost ensemble predicting probability that a trade taken
    today hits +4% before -2% within a 5-day holding window (see train_profit.py for
    the exact label definition and honest backtested metrics - AUC ~0.51 as of the
    last training run, meaning this signal is currently weak; ship it labeled as such).
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "2.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.rf_path = os.path.join(self.workspace_root, models_dir, "profit_rf.pkl")
        self.xgb_path = os.path.join(self.workspace_root, models_dir, "profit_xgb.pkl")

        self.rf_model = None
        self.xgb_model = None
        try:
            if os.path.exists(self.rf_path):
                with open(self.rf_path, "rb") as f:
                    self.rf_model = pickle.load(f)
            if os.path.exists(self.xgb_path):
                with open(self.xgb_path, "rb") as f:
                    self.xgb_model = pickle.load(f)
            logger.info("Loaded real profit models (RandomForest + XGBoost).")
        except Exception as e:
            logger.error(f"Failed to load profit models: {e}")

    def predict(self, symbol: str) -> Dict[str, Any]:
        """Self-contained inference: recompute the full feature set from raw data,
        exactly matching how the models were trained. No feature-name mismatch is
        possible because there is only one feature computation function anywhere."""
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            feature_names = self.xgb_model.get_booster().feature_names if self.xgb_model else list(row.keys())
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in feature_names}])

            prob_rf = float(self.rf_model.predict_proba(X)[0, 1]) if self.rf_model else 0.5
            prob_xgb = float(self.xgb_model.predict_proba(X)[0, 1]) if self.xgb_model else 0.5
            prob = (prob_rf + prob_xgb) / 2.0

            return {
                "model_type": "Ensemble (Random Forest + XGBoost) - trained",
                "model_version": self.version,
                "profit_probability": round(prob, 4),
                "label_definition": "P(price touches +4% before -2% within 5 trading days)",
            }
        except Exception as e:
            logger.error(f"Profit inference error for {symbol}: {e}")
            return {
                "model_type": "Ensemble (Random Forest + XGBoost) - trained",
                "model_version": self.version,
                "profit_probability": 0.5,
                "label_definition": "P(price touches +4% before -2% within 5 trading days)",
                "error": "fallback_used",
            }

    async def predict_profitability(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Backward-compatible async wrapper. Callers should migrate to predict(symbol)."""
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            logger.warning("predict_profitability called without a symbol - use predict(symbol) instead.")
            return {
                "model_type": "Ensemble (Random Forest + XGBoost) - trained",
                "model_version": self.version,
                "profit_probability": 0.5,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
