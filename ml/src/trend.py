"""
trend.py

Trend predictor serving module. Loads trained XGBoost and LightGBM models and
the AUC confidence interval from feature_metadata.json. Returns evidence-first
output: bullish_probability + AUC CI, not a BUY/SELL/HOLD verdict.
"""
import os
import pickle
import json
import logging
import pandas as pd
from abc import ABC, abstractmethod
from typing import Any, Dict

try:
    from .features_engine import build_live_feature_row
except ImportError:
    from features_engine import build_live_feature_row

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-ml-trend")


class BaseTrendPredictor(ABC):
    """Abstract interface defining stock market trend classifiers."""

    @abstractmethod
    async def predict_trend(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Return evidence-based trend assessment (not a verdict)."""
        pass


class TrendPredictor(BaseTrendPredictor):
    """
    Production trend predictor combining calibrated XGBoost and LightGBM models.

    Returns bullish_probability and AUC confidence interval from the walk-forward
    CV training pipeline. Does NOT return a BUY/SELL/HOLD verdict — per
    docs/roadmap.md, every user-facing screen shows evidence, not a verdict.
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "3.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

        self.xgb_path = os.path.join(self.workspace_root, models_dir, "trend_xgboost.pkl")
        self.lgb_path = os.path.join(self.workspace_root, models_dir, "trend_lightgbm.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "feature_metadata.json")

        self.xgb_model = None
        self.lgb_model = None
        self.features = []
        self.auc_ci = {}
        self.load_failed = False

        try:
            if os.path.exists(self.xgb_path):
                with open(self.xgb_path, "rb") as f:
                    self.xgb_model = pickle.load(f)
            if os.path.exists(self.lgb_path):
                with open(self.lgb_path, "rb") as f:
                    self.lgb_model = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
                    # Load AUC CI from the best-performing model (LightGBM)
                    lgb_metrics = meta.get("metrics", {}).get("lightgbm", {})
                    self.auc_ci = {
                        "ci_lower": lgb_metrics.get("auc_ci_lower"),
                        "ci_upper": lgb_metrics.get("auc_ci_upper"),
                        "point_auc": lgb_metrics.get("auc"),
                        "p_value_vs_random": lgb_metrics.get("auc_p_value_vs_random"),
                        "excludes_0_5": lgb_metrics.get("auc_excludes_0_5"),
                    }
            logger.info("Loaded trend models (XGBoost + LightGBM) with AUC CI.")
        except Exception as e:
            self.load_failed = True
            logger.error(f"Failed to load trend models: {e}")

    def _infer(self, row: Dict[str, Any]) -> Dict[str, Any]:
        X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

        prob_xgb = 0.5
        prob_lgb = 0.5
        if self.xgb_model and not self.load_failed:
            probs = self.xgb_model.predict_proba(X)[0]
            prob_xgb = float(probs[1]) if len(probs) == 2 else float(probs[-1])
        if self.lgb_model and not self.load_failed:
            probs = self.lgb_model.predict_proba(X)[0]
            prob_lgb = float(probs[1]) if len(probs) == 2 else float(probs[-1])

        # Average of both models
        bullish_prob = (prob_xgb + prob_lgb) / 2.0

        result = {
            "model_type": "Ensemble (XGBoost + LightGBM) - walk-forward CV trained",
            "model_version": self.version,
            "bullish_probability": round(bullish_prob, 4),
            "xgb_probability": round(prob_xgb, 4),
            "lgb_probability": round(prob_lgb, 4),
            "auc_confidence_interval": self.auc_ci,
        }
        if (not self.xgb_model and not self.lgb_model) or self.load_failed:
            result["error"] = "model_failed_to_load"

        return result

    def predict(self, symbol: str) -> Dict[str, Any]:
        """Self-contained inference from raw parquet data for a given symbol."""
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            return self._infer(row)
        except Exception as e:
            logger.error(f"Inference error for {symbol}: {e}")
            return {
                "model_type": "Ensemble (XGBoost + LightGBM) - walk-forward CV trained",
                "model_version": self.version,
                "bullish_probability": 0.50,
                "auc_confidence_interval": self.auc_ci,
                "error": "fallback_used",
            }

    async def predict_trend(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Async wrapper used by the API layer."""
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            return {
                "model_type": "Ensemble (XGBoost + LightGBM) - walk-forward CV trained",
                "model_version": self.version,
                "bullish_probability": 0.50,
                "auc_confidence_interval": self.auc_ci,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
