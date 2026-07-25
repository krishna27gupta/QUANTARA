"""
risk.py

Risk predictor serving module. Returns full class probabilities and the model
accuracy statistic from walk-forward CV metadata. This is the MOST PROMINENT
model output per docs/roadmap.md — the only model with a statistically validated edge.
"""
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
    Gradient Boosting classifier predicting whether the NEXT 5 trading days are
    likely Low/Medium/High realized volatility. This is the headline model — the
    only one with a real, statistically validated edge over random.
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "3.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.model_path = os.path.join(self.workspace_root, models_dir, "risk_gb.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "risk_feature_metadata.json")

        self.model = None
        self.features = []
        self.model_accuracy = None
        self.random_baseline = 0.3333
        self.lift_over_random = None
        self.load_failed = False
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
                    metrics = meta.get("metrics", {})
                    self.model_accuracy = metrics.get("test_accuracy")
                    self.lift_over_random = metrics.get("lift_over_random_pp")
            logger.info("Loaded risk model (Gradient Boosting) with accuracy metadata.")
        except Exception as e:
            self.load_failed = True
            logger.error(f"Failed to load risk model: {e}")

    def predict(self, symbol: str, precomputed_row: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            row = precomputed_row if precomputed_row is not None else build_live_feature_row(symbol, self.workspace_root)
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

            if self.model and not self.load_failed:
                probs = self.model.predict_proba(X)[0]
                pred_class = int(probs.argmax())
                risk_label = RISK_LABELS[pred_class]
                confidence = float(probs[pred_class])
                class_probs = {RISK_LABELS[i]: round(float(probs[i]), 4) for i in range(len(probs))}
            else:
                risk_label, confidence = "Medium", 0.34
                class_probs = {"Low": 0.33, "Medium": 0.34, "High": 0.33}

            # Format accuracy string for display
            accuracy_str = None
            if self.model_accuracy is not None:
                accuracy_str = f"{self.model_accuracy*100:.2f}% (vs {self.random_baseline*100:.2f}% random baseline)"

            result = {
                "model_type": "HistGradientBoosting - walk-forward CV trained",
                "model_version": self.version,
                "risk_level": risk_label,
                "risk_confidence": round(confidence, 4),
                "class_probabilities": class_probs,
                "model_accuracy": accuracy_str,
                "label_definition": "Predicted realized-volatility tercile over the next 5 trading days",
                "beta_volatility": round(float(row.get("beta", 1.0)), 3),
            }
            if not self.model or self.load_failed:
                result["error"] = "model_failed_to_load"

            return result
        except Exception as e:
            logger.error(f"Risk inference error for {symbol}: {e}")
            return {
                "model_type": "HistGradientBoosting - walk-forward CV trained",
                "model_version": self.version,
                "risk_level": "Medium",
                "risk_confidence": 0.34,
                "class_probabilities": {"Low": 0.33, "Medium": 0.34, "High": 0.33},
                "error": "fallback_used",
            }

    async def evaluate_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Async wrapper for API layer."""
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            return {
                "model_type": "HistGradientBoosting - walk-forward CV trained",
                "model_version": self.version,
                "risk_level": "Medium",
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
