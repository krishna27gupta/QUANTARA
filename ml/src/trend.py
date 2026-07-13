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
        """Classify market movement trends (Bullish, Bearish, Sideways)."""
        pass


class TrendPredictor(BaseTrendPredictor):
    """
    Production trend classifier combining calibrated XGBoost and LightGBM models.

    FIX (see docs/CHANGES.md): previously, the live API called `predict_trend(features)`
    with a feature dict built by FeatureStore/DataPipeline, which never computed ~40 of
    the 50 features these models actually need (gap_open_pct, support_distance,
    resistance_distance, ma_slope_20d/50d, atr_percentile, trend_persistence_5d, and
    their lags). Those all silently defaulted to 0.0, so the live model was never
    getting real inputs even though the trained model itself is legitimate.

    Fix: both predict(symbol) and predict_trend(features) now go through
    build_live_feature_row(), which recomputes the exact same feature set used at
    training time directly from raw price data. There is no second, divergent feature
    pipeline anymore.
    """

    def __init__(self, models_dir: str = "models"):
        self.version = "2.0.0"
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

        self.xgb_path = os.path.join(self.workspace_root, models_dir, "trend_xgboost.pkl")
        self.lgb_path = os.path.join(self.workspace_root, models_dir, "trend_lightgbm.pkl")
        self.meta_path = os.path.join(self.workspace_root, models_dir, "feature_metadata.json")

        self.xgb_model = None
        self.lgb_model = None
        self.features = []
        self.top_features = []
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
                    self.top_features = meta.get("top_features", ["rsi", "macd", "Volume"])
            logger.info("Successfully loaded real XGBoost and LightGBM trend models.")
        except Exception as e:
            self.load_failed = True
            logger.error(f"Failed to load real model weights: {e}")

    def _infer(self, row: Dict[str, Any]) -> Dict[str, Any]:
        X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

        prob_xgb, prob_lgb, prob_sell = 0.5, 0.5, 0.33
        probs3 = None
        if self.xgb_model and not self.load_failed:
            probs = self.xgb_model.predict_proba(X)[0]
            prob_xgb = float(probs[2]) if len(probs) == 3 else float(probs[-1])
        if self.lgb_model and not self.load_failed:
            probs3 = self.lgb_model.predict_proba(X)[0]
            prob_lgb = float(probs3[2]) if len(probs3) == 3 else float(probs3[-1])
            prob_sell = float(probs3[0])

        prob = (prob_xgb + prob_lgb) / 2.0
        if prob_lgb >= 0.48:
            signal, confidence = "BUY", int(prob_lgb * 100)
        elif prob_sell >= 0.45:
            signal, confidence = "SELL", int(prob_sell * 100)
        else:
            signal = "HOLD"
            confidence = int(probs3[1] * 100) if probs3 is not None and len(probs3) == 3 else 50

        top_feats_mapped = []
        for feat in self.top_features[:3]:
            if feat == "rsi":
                top_feats_mapped.append("RSI")
            elif feat == "macd":
                top_feats_mapped.append("MACD")
            elif "volume" in feat.lower():
                top_feats_mapped.append("Volume")
            else:
                top_feats_mapped.append(feat.upper())

        result = {
            "signal": signal,
            "confidence": confidence,
            "probability": round(prob_lgb, 4),
            "bullish_probability": round(prob_lgb, 4),
            "predicted_regime": "Bullish" if prob_lgb >= 0.48 else ("Bearish" if prob <= 0.40 else "Sideways"),
            "top_features": top_feats_mapped,
        }
        if (not self.xgb_model and not self.lgb_model) or self.load_failed:
            result["error"] = "model_failed_to_load"
            
        return result

    def predict(self, symbol: str) -> Dict[str, Any]:
        """Self-contained inference from raw parquet data for a given symbol."""
        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            return {**self._infer(row), "model_type": "Ensemble (XGBoost + LightGBM) - trained", "model_version": self.version}
        except Exception as e:
            logger.error(f"Inference error for {symbol}: {e}")
            return {
                "signal": "HOLD", "confidence": 50, "probability": 0.50,
                "bullish_probability": 0.50, "predicted_regime": "Sideways",
                "top_features": ["RSI", "MACD", "Volume"],
                "model_type": "Ensemble (XGBoost + LightGBM) - trained", "model_version": self.version,
                "error": "fallback_used",
            }

    async def predict_trend(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Async wrapper used by the API layer. Requires a 'symbol' key in `features` -
        this is the fix for the bug described in the class docstring: we no longer
        trust a pre-built feature vector that might be missing most of its columns,
        we always recompute from raw data for the given symbol.
        """
        symbol = features.get("symbol") if isinstance(features, dict) else None
        if not symbol:
            logger.warning("predict_trend called without a symbol - falling back to neutral HOLD.")
            return {
                "signal": "HOLD", "confidence": 50, "probability": 0.50,
                "bullish_probability": 0.50, "predicted_regime": "Sideways",
                "model_type": "Ensemble (XGBoost + LightGBM) - trained", "model_version": self.version,
                "error": "no_symbol_provided",
            }
        return self.predict(symbol)
