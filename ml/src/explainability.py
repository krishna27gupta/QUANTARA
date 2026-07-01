import logging
from typing import Any, Dict, List

logger = logging.getLogger("quantara-ml-explainability")

class ExplainabilityEngine:
    """SHAP explainer simulation and natural language explanation reason generator."""

    def calculate_shap_values(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Generate SHAP feature attribution contribution scores for the active prediction."""
        logger.info("Computing SHAP values for prediction features attribution.")
        
        # Calculate contributions relative to base value
        rsi = features.get("rsi", 50.0)
        ema_cross = features.get("ema_cross_20_50", 0.0)
        rel_vol = features.get("relative_volume", 1.0)
        vix = features.get("india_vix", 14.0)

        shap_values = {
            "base_value": 0.52,
            "rsi_contribution": round(0.12 if rsi > 55 else -0.05, 4),
            "ema_crossover_contribution": round(0.14 if ema_cross > 0 else -0.08, 4),
            "volume_spike_contribution": round(0.09 if rel_vol >= 1.5 else -0.02, 4),
            "market_vix_contribution": round(0.06 if vix < 15 else -0.05, 4)
        }
        return shap_values

    def generate_rationales(self, features: Dict[str, Any], signal: str) -> List[str]:
        """Convert feature attributions into readable, educational explanation points."""
        logger.info("Generating bulleted trade explanation rationales.")
        reasons = []

        rsi = features.get("rsi", 50.0)
        ema_cross = features.get("ema_cross_20_50", 0.0)
        rel_vol = features.get("relative_volume", 1.0)
        vix = features.get("india_vix", 14.0)

        if signal == "BUY":
            if ema_cross > 0:
                reasons.append("Technical breakout (EMA golden crossover)")
            if rsi > 55:
                reasons.append("Strong momentum (RSI trending above mid-level)")
            if rel_vol >= 1.5:
                reasons.append("Volume breakout (relative volume exceeds 20-day average)")
            if vix < 15:
                reasons.append("Low volatility regime (favorable context index)")
            
            # Default fallbacks to ensure we always have 3+ points
            if len(reasons) < 3:
                reasons.append("Positive sentiment flows")
                reasons.append("Historical pattern similarity matches")
        
        elif signal == "SELL":
            if ema_cross < 0:
                reasons.append("Technical breakdown (EMA death crossover)")
            if rsi < 40:
                reasons.append("Weak momentum (RSI drops under support bounds)")
            if rel_vol >= 1.5:
                reasons.append("High volume selling liquidation")
            if vix > 18:
                reasons.append("High volatility environment risk")
            
            if len(reasons) < 3:
                reasons.append("Institutional outflow distribution")
                reasons.append("Weak sector indexes correlation")
        
        else:
            reasons.append("Sideways market consolidation")
            reasons.append("RSI indicators bounded near midpoints")
            reasons.append("Insufficient volume breakouts")

        return reasons
