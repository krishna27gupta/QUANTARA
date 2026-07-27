"""
ensemble.py

Evidence-first ensemble engine for Quantara.

Per docs/roadmap.md, the output structure is evidence-first, not verdict-first:
  - risk_forecast is the most prominent field (only validated model)
  - trend_evidence includes bootstrapped AUC confidence interval
  - No BUY/SELL/HOLD as the primary output
  - Raw ensemble score available under an 'advanced' key for power users
"""
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

logger = logging.getLogger("quantara-ml-ensemble")


class BaseEnsembleEngine(ABC):
    """Abstract interface defining the prediction consolidator and voting logic."""

    @abstractmethod
    async def aggregate_predictions(
        self,
        trend_pred: Dict[str, Any],
        profit_pred: Dict[str, Any],
        risk_pred: Dict[str, Any],
        return_pred: Dict[str, Any],
        sentiment_pred: Dict[str, Any],
        historical_analogs: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Aggregate inputs from multiple specialized models into evidence-first output."""
        pass


class EnsembleEngine(BaseEnsembleEngine):
    """
    Evidence-first ensemble engine.

    Produces a structured response with:
      - risk_forecast (most prominent — the only model with a statistically validated edge)
      - trend_evidence (with bootstrapped AUC CI from training metadata)
      - historical_context (base rates, return bands)
      - explanation (SHAP rationales)
      - model_confidence_intervals (all CIs in one place)
      - advanced (raw ensemble score for power users, NOT the headline)
    """

    async def aggregate_predictions(
        self,
        trend_pred: Dict[str, Any],
        profit_pred: Dict[str, Any],
        risk_pred: Dict[str, Any],
        return_pred: Dict[str, Any],
        sentiment_pred: Dict[str, Any],
        historical_analogs: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        logger.info("Assembling evidence-first prediction output.")

        # ── Extract raw values from sub-models ────────────────────────────
        bullish_prob = trend_pred.get("bullish_probability", 0.5)
        profit_prob = profit_pred.get("profit_probability", 0.5)
        risk_level = risk_pred.get("risk_level", "Medium")
        risk_confidence = risk_pred.get("risk_confidence", 0.34)
        risk_class_probs = risk_pred.get("class_probabilities", {})
        expected_ret = return_pred.get("expected_return_pct", 0.0)
        lower_bound = return_pred.get("forecast_lower_bound_pct", -2.0)
        upper_bound = return_pred.get("forecast_upper_bound_pct", 2.0)
        sentiment_score = sentiment_pred.get("sentiment_score", 0.5)

        # Trend AUC CI (loaded from metadata by TrendPredictor)
        trend_auc_ci = trend_pred.get("auc_confidence_interval", {})

        # Profit AUC CI
        profit_auc_ci = profit_pred.get("auc_confidence_interval", {})

        # ── risk_forecast (MOST PROMINENT) ────────────────────────────────
        risk_forecast = {
            "risk_level": risk_level,
            "risk_confidence": risk_confidence,
            "class_probabilities": risk_class_probs,
            "model_accuracy": risk_pred.get("model_accuracy", "See docs/roadmap.md for validated metrics"),
            "label_definition": risk_pred.get("label_definition",
                "Predicted realized-volatility tercile over the next 5 trading days"),
        }

        # ── trend_evidence (SECONDARY — weak, honest uncertainty) ──────────
        # Interpret the trend signal honestly
        if bullish_prob >= 0.55:
            interpretation = "Weak bullish lean — near-random signal"
        elif bullish_prob <= 0.45:
            interpretation = "Weak bearish lean — near-random signal"
        else:
            interpretation = "No directional lean — signal indistinguishable from random"

        trend_evidence = {
            "bullish_probability": round(bullish_prob, 4),
            "auc_confidence_interval": trend_auc_ci,
            "interpretation": interpretation,
        }

        # ── historical_context ─────────────────────────────────────────────
        historical_context = {
            "base_win_rate_pct": profit_pred.get("base_win_rate_pct", 33.8),
            "profit_probability": round(profit_prob, 4),
            "expected_return_band_pct": {
                "lower_10th": lower_bound,
                "median": expected_ret,
                "upper_90th": upper_bound,
            },
            "return_model_r2": return_pred.get("r2_caveat", -0.0068),
            "return_model_caveat": "Point forecast has ~0 R² (no predictive value); the uncertainty band is the useful output.",
            "historical_analogs": historical_analogs if historical_analogs else None,
        }

        # ── model_confidence_intervals ─────────────────────────────────────
        model_confidence_intervals = {
            "trend_auc_ci": [
                trend_auc_ci.get("ci_lower", None),
                trend_auc_ci.get("ci_upper", None),
            ],
            "profit_auc_ci": [
                profit_auc_ci.get("ci_lower", None),
                profit_auc_ci.get("ci_upper", None),
            ],
        }

        # ── advanced (power-user raw data) ─────────────────────────────────
        # Raw ensemble score kept for backward compatibility but NOT the headline
        raw_confidence = (bullish_prob * 0.35) + (profit_prob * 0.30) + \
                         (sentiment_score * 0.20) + (min(expected_ret / 15.0, 1.0) * 0.15)
        risk_penalty = {"Low": 0, "Medium": 8, "High": 18}.get(risk_level, 10)
        raw_score = int(min(max((raw_confidence * 100) - risk_penalty, 10), 99))

        advanced = {
            "raw_ensemble_score": raw_score,
            "raw_ensemble_confidence_pct": round(raw_confidence * 100, 2),
            "raw_inputs": {
                "trend": trend_pred,
                "profit": profit_pred,
                "risk": risk_pred,
                "return": return_pred,
                "sentiment": sentiment_pred,
            },
        }

        logger.info(f"Evidence assembled: risk={risk_level}, trend_prob={bullish_prob:.4f}, "
                    f"raw_score={raw_score}")

        return {
            "risk_forecast": risk_forecast,
            "trend_evidence": trend_evidence,
            "historical_context": historical_context,
            "model_confidence_intervals": model_confidence_intervals,
            "advanced": advanced,
        }
