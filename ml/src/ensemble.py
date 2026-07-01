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
        sentiment_pred: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Aggregate inputs from multiple specialized models into a single weighted decision."""
        pass


class EnsembleEngine(BaseEnsembleEngine):
    """Production ensemble engine consolidating trend, profit, risk, return, and sentiment inputs."""

    async def aggregate_predictions(
        self,
        trend_pred: Dict[str, Any],
        profit_pred: Dict[str, Any],
        risk_pred: Dict[str, Any],
        return_pred: Dict[str, Any],
        sentiment_pred: Dict[str, Any]
    ) -> Dict[str, Any]:
        logger.info("Consolidating multiple prediction streams into weighted consensus.")
        
        bullish_prob = trend_pred.get("bullish_probability", 0.5)
        profit_prob = profit_pred.get("profit_probability", 0.5)
        risk_level = risk_pred.get("risk_level", "Medium")
        expected_ret = return_pred.get("expected_return_pct", 2.0)
        sentiment_score = sentiment_pred.get("sentiment_score", 0.5)

        # Weighted confidence calculation
        # Trend carries 35%, Profit probability carries 30%, Sentiment 20%, Return 15%
        confidence = (bullish_prob * 0.35) + (profit_prob * 0.30) + (sentiment_score * 0.20) + (min(expected_ret / 15.0, 1.0) * 0.15)
        confidence_pct = round(confidence * 100, 2)

        # Output Signal Determination
        if bullish_prob > 0.60 and profit_prob > 0.55:
            signal = "BUY"
        elif bullish_prob < 0.40 and profit_prob < 0.45:
            signal = "SELL"
        else:
            signal = "HOLD"

        # Overall Quantara Score (0-100 scale metrics)
        # Score is higher if confidence is high and risk is low
        risk_penalty = {"Low": 0, "Medium": 8, "High": 18}.get(risk_level, 10)
        q_score = int(min(max((confidence * 100) - risk_penalty + (5 if signal == "BUY" else 0), 10), 99))

        logger.info(f"Ensemble voting complete. Action: {signal}, Confidence: {confidence_pct}%, Score: {q_score}")
        return {
            "signal": signal,
            "confidence": confidence_pct,
            "profit_probability": round(profit_prob * 100, 2),
            "expected_return": expected_ret,
            "risk": risk_level,
            "quantara_score": q_score,
            "raw_inputs": {
                "trend": trend_pred,
                "profit": profit_pred,
                "risk": risk_pred,
                "return": return_pred,
                "sentiment": sentiment_pred
            }
        }
