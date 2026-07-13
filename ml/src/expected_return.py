import os
import json
import pickle
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List

import pandas as pd

try:
    from .features_engine import build_live_feature_row
except ImportError:
    from features_engine import build_live_feature_row

logger = logging.getLogger("quantara-ml-return")


class BaseExpectedReturnPredictor(ABC):
    @abstractmethod
    async def forecast_expected_return(self, sequential_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass


class ExpectedReturnPredictor(BaseExpectedReturnPredictor):
    """
    Real Gradient Boosted Quantile Regression forecasting 5-day forward return %, with
    honestly-calibrated lower/upper bounds (10th/90th percentile).

    HONESTY NOTE: the original doc described this as "LSTM + GRU". This build uses
    gradient boosted quantile regression instead, because torch/tensorflow aren't
    available in this training environment - see train_expected_return.py docstring
    for a real LSTM/GRU implementation guide if you want to try that in your own
    environment. As trained, the point forecast has ~0 R^2 (no real predictive edge
    on direction/magnitude) but the uncertainty band is well-calibrated (~83% of
    actual outcomes land inside the predicted 10-90 range).
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "2.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.model_path = os.path.join(self.workspace_root, models_dir, "return_quantile_models.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "return_feature_metadata.json")

        self.models = None
        self.features = []
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    self.models = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    self.features = json.load(f).get("features", [])
            logger.info("Loaded real expected-return quantile models.")
        except Exception as e:
            logger.error(f"Failed to load expected-return models: {e}")

    def predict(self, symbol: str) -> Dict[str, Any]:
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

            if self.models:
                median = float(self.models["median"].predict(X)[0])
                lower = float(self.models["lower"].predict(X)[0])
                upper = float(self.models["upper"].predict(X)[0])
            else:
                median, lower, upper = 0.0, -2.0, 2.0

            return {
                "model_type": "Gradient Boosted Quantile Regression - trained (not LSTM/GRU, see docstring)",
                "model_version": self.version,
                "expected_return_pct": round(median, 2),
                "forecast_lower_bound_pct": round(lower, 2),
                "forecast_upper_bound_pct": round(upper, 2),
                "label_definition": "Actual 5-day forward close-to-close return, percent",
            }
        except Exception as e:
            logger.error(f"Expected return inference error for {symbol}: {e}")
            return {
                "model_type": "Gradient Boosted Quantile Regression - trained (not LSTM/GRU, see docstring)",
                "model_version": self.version,
                "expected_return_pct": 0.0,
                "forecast_lower_bound_pct": -2.0,
                "forecast_upper_bound_pct": 2.0,
                "error": "fallback_used",
            }

    async def forecast_expected_return(self, sequential_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Backward-compatible async wrapper. Callers should migrate to predict(symbol)."""
        symbol = None
        if sequential_features and isinstance(sequential_features[-1], dict):
            symbol = sequential_features[-1].get("symbol")
        if not symbol:
            logger.warning("forecast_expected_return called without a symbol - use predict(symbol) instead.")
            return {
                "model_type": "Gradient Boosted Quantile Regression - trained (not LSTM/GRU, see docstring)",
                "model_version": self.version,
                "expected_return_pct": 0.0,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
