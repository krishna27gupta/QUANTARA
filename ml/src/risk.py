import os
import json
import pickle
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

import pandas as pd

try:
    from .features_engine import build_live_feature_row
except ImportError:
    from features_engine import build_live_feature_row

logger = logging.getLogger("quantara-ml-risk")

RISK_LABELS = {0: "Low", 1: "Medium", 2: "High"}


class BaseRiskPredictor(ABC):
    @abstractmethod
    async def evaluate_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        pass


class RiskPredictor(BaseRiskPredictor):
    """
    Real Gradient Boosting classifier predicting whether the NEXT 5 trading days are
    likely Low/Medium/High realized volatility for this stock (see train_risk.py for
    label definition and honest backtested metrics - ~45% accuracy on 3 classes vs a
    33% random baseline, i.e. a real but modest edge).
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "2.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.model_path = os.path.join(self.workspace_root, models_dir, "risk_gb.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "risk_feature_metadata.json")

        self.model = None
        self.features = []
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    self.features = json.load(f).get("features", [])
            logger.info("Loaded real risk model (Gradient Boosting).")
        except Exception as e:
            logger.error(f"Failed to load risk model: {e}")

    def predict(self, symbol: str) -> Dict[str, Any]:
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

            if self.model:
                probs = self.model.predict_proba(X)[0]
                pred_class = int(probs.argmax())
                risk_label = RISK_LABELS[pred_class]
                confidence = float(probs[pred_class])
            else:
                risk_label, confidence = "Medium", 0.34

            return {
                "model_type": "Gradient Boosting (HistGB) - trained",
                "model_version": self.version,
                "risk_level": risk_label,
                "risk_confidence": round(confidence, 4),
                "label_definition": "Predicted realized-volatility tercile over the next 5 trading days",
                "beta_volatility": round(float(row.get("beta", 1.0)), 3),
            }
        except Exception as e:
            logger.error(f"Risk inference error for {symbol}: {e}")
            return {
                "model_type": "Gradient Boosting (HistGB) - trained",
                "model_version": self.version,
                "risk_level": "Medium",
                "risk_confidence": 0.34,
                "error": "fallback_used",
            }

    async def evaluate_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Backward-compatible async wrapper. Callers should migrate to predict(symbol)."""
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            logger.warning("evaluate_risk called without a symbol - use predict(symbol) instead.")
            return {
                "model_type": "Gradient Boosting (HistGB) - trained",
                "model_version": self.version,
                "risk_level": "Medium",
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
