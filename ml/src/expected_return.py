"""
expected_return.py

Expected return predictor serving module. Returns quantile regression bands
with honest R² disclaimer from walk-forward CV metadata.
"""
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
    Gradient Boosted Quantile Regression forecasting 5-day forward return % with
    honestly-calibrated lower/upper bounds (10th/90th percentile).

    The point forecast has ~0 R² (no predictive edge); the uncertainty band is
    the useful output.
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "3.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.model_path = os.path.join(self.workspace_root, models_dir, "return_quantile_models.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "return_feature_metadata.json")

        self.models = None
        self.features = []
        self.r2 = None
        self.calibration_pct = None
        self.load_failed = False
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    self.models = pickle.load(f)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
                    metrics = meta.get("metrics", {})
                    self.r2 = metrics.get("median_r2")
                    self.calibration_pct = metrics.get("pct_actuals_within_10_90_band")
            logger.info("Loaded expected-return quantile models with R² metadata.")
        except Exception as e:
            self.load_failed = True
            logger.error(f"Failed to load expected-return models: {e}")

    def predict(self, symbol: str, precomputed_row: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            row = precomputed_row if precomputed_row is not None else build_live_feature_row(symbol, self.workspace_root)
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

            if self.models and not self.load_failed:
                median = float(self.models["median"].predict(X)[0])
                lower = float(self.models["lower"].predict(X)[0])
                upper = float(self.models["upper"].predict(X)[0])
            else:
                median, lower, upper = 0.0, -2.0, 2.0

            result = {
                "model_type": "Gradient Boosted Quantile Regression (not LSTM/GRU)",
                "model_version": self.version,
                "expected_return_pct": round(median, 2),
                "forecast_lower_bound_pct": round(lower, 2),
                "forecast_upper_bound_pct": round(upper, 2),
                "label_definition": "Actual 5-day forward close-to-close return, percent",
                "r2_caveat": self.r2 if self.r2 is not None else -0.0068,
                "r2_interpretation": "Point forecast has ~0 R² (no predictive value); the uncertainty band is the useful output.",
                "calibration_pct": self.calibration_pct,
            }
            if not self.models or self.load_failed:
                result["error"] = "model_failed_to_load"

            return result
        except Exception as e:
            logger.error(f"Expected return inference error for {symbol}: {e}")
            return {
                "model_type": "Gradient Boosted Quantile Regression (not LSTM/GRU)",
                "model_version": self.version,
                "expected_return_pct": 0.0,
                "forecast_lower_bound_pct": -2.0,
                "forecast_upper_bound_pct": 2.0,
                "error": "fallback_used",
            }

    async def forecast_expected_return(self, sequential_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Async wrapper for API layer."""
        symbol = None
        if sequential_features and isinstance(sequential_features[-1], dict):
            symbol = sequential_features[-1].get("symbol")
        if not symbol:
            return {
                "model_type": "Gradient Boosted Quantile Regression (not LSTM/GRU)",
                "model_version": self.version,
                "expected_return_pct": 0.0,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
