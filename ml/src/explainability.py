import os
import pickle
import json
import logging
from typing import Any, Dict, List

import numpy as np
import pandas as pd

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

try:
    from .features_engine import build_live_feature_row
except ImportError:
    from features_engine import build_live_feature_row

logger = logging.getLogger("quantara-ml-explainability")


# Plain-English descriptions for each feature.
# Keys are feature column names; values are (bullish_description, bearish_description)
# tuples where the bullish text is used when the SHAP value is positive (pushes
# toward BUY) and the bearish text is used when the SHAP value is negative
# (drags the BUY probability down).
_FEATURE_LABELS: Dict[str, tuple] = {
    "rsi":                       ("RSI showing strong bullish momentum",
                                  "RSI signaling weak or oversold momentum"),
    "macd":                      ("MACD indicates positive trend acceleration",
                                  "MACD indicates fading or negative trend acceleration"),
    "macd_hist":                 ("MACD histogram expanding (bullish divergence)",
                                  "MACD histogram contracting (bearish divergence)"),
    "macd_signal":               ("MACD above signal line (bullish crossover)",
                                  "MACD below signal line (bearish crossover)"),
    "adx":                       ("Strong directional trend strength (ADX)",
                                  "Weak or directionless trend (ADX)"),
    "atr":                       ("Elevated average true range — high conviction move",
                                  "Subdued average true range — low conviction environment"),
    "atr_percentile":            ("ATR in upper percentile — strong volatility expansion",
                                  "ATR in lower percentile — subdued realized volatility"),
    "historical_volatility":     ("Elevated historical volatility favoring breakout",
                                  "Subdued historical volatility reducing breakout odds"),
    "drawdown":                  ("Shallow drawdown — price near recent highs",
                                  "Deep drawdown — price well off its recent high"),
    "drawdown_percentile":       ("Drawdown percentile near high — strong recovery",
                                  "Drawdown percentile low — prolonged decline"),
    "beta":                      ("High beta amplifying bullish market moves",
                                  "High beta amplifying market downside risk"),
    "obv":                       ("On-balance volume confirming upside accumulation",
                                  "On-balance volume confirming distribution pressure"),
    "vwap":                      ("Price above VWAP — institutional buying support",
                                  "Price below VWAP — institutional selling pressure"),
    "stoch_rsi":                 ("Stochastic RSI in bullish territory",
                                  "Stochastic RSI in bearish/oversold territory"),
    "roc":                       ("Positive rate of change — upward price momentum",
                                  "Negative rate of change — downward price momentum"),
    "gap_open_pct":              ("Positive gap-up opening favoring continuation",
                                  "Negative gap-down opening suggesting weakness"),
    "support_distance":          ("Price comfortably above support level",
                                  "Price dangerously close to support breakdown"),
    "resistance_distance":       ("Price approaching resistance (breakout setup)",
                                  "Price distant from resistance — limited upside catalyst"),
    "ma_slope_20d":              ("20-day moving average trending upward",
                                  "20-day moving average trending downward"),
    "ma_slope_50d":              ("50-day moving average trending upward",
                                  "50-day moving average trending downward"),
    "trend_persistence_5d":      ("Consistent trend over last 5 days",
                                  "Inconsistent or weakening 5-day trend"),
    "price_ema50_dist":          ("Price well above 50-EMA — strong trend",
                                  "Price below 50-EMA — bearish positioning"),
    "sma50":                     ("50-day SMA sloping up — long-term bullish structure",
                                  "50-day SMA sloping down — long-term bearish structure"),
    "bb_upper":                  ("Price near upper Bollinger Band — strong momentum",
                                  "Price far from upper Bollinger Band — weak momentum"),
}


def _describe_feature(name: str, shap_val: float) -> str:
    """Convert a feature name + signed SHAP value into a human-readable sentence."""
    is_bullish = shap_val > 0
    if name in _FEATURE_LABELS:
        return _FEATURE_LABELS[name][0] if is_bullish else _FEATURE_LABELS[name][1]

    # Lag features: strip the lag prefix and delegate to the base feature
    # e.g. "lag_rsi_1" -> look up "rsi"
    if name.startswith("lag_"):
        parts = name.split("_")
        # lag_<base>_<N> or lag_<base1>_<base2>_<N>
        lag_n = parts[-1]
        base_name = "_".join(parts[1:-1])
        if base_name in _FEATURE_LABELS:
            base_desc = _FEATURE_LABELS[base_name][0] if is_bullish else _FEATURE_LABELS[base_name][1]
            return f"{base_desc} ({lag_n}-day lag)"
        # Generic lag fallback
        direction = "bullish" if is_bullish else "bearish"
        return f"Lagged {base_name.replace('_', ' ')} ({lag_n}d) showing {direction} pressure"

    # Generic fallback for unknown features
    direction = "bullish" if is_bullish else "bearish"
    return f"{name.replace('_', ' ').title()} contributing {direction} pressure"


class ExplainabilityEngine:
    """
    Real SHAP-based explainability engine using TreeExplainer on the trained
    XGBoost trend model. Replaces the original "SHAP explainer simulation" that
    used hardcoded thresholds on 4 features and padded output with filler phrases.

    How it works:
    1. Loads models/trend_xgboost.pkl (plain XGBClassifier, 3 classes: SELL/HOLD/BUY)
    2. For a given symbol, builds the exact same 50-feature vector the model was
       scored on via features_engine.build_live_feature_row()
    3. Runs shap.TreeExplainer to get per-feature attribution scores
    4. Returns only features with non-negligible SHAP magnitude (abs >= 1e-4),
       ranked by impact, as plain-English descriptions — never pads with filler
    """

    def __init__(self, models_dir: str = "models"):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

        xgb_path = os.path.join(self.workspace_root, models_dir, "trend_xgboost.pkl")
        meta_path = os.path.join(self.workspace_root, models_dir, "feature_metadata.json")

        self.xgb_model = None
        self.features: List[str] = []
        self.explainer = None

        try:
            if os.path.exists(xgb_path):
                with open(xgb_path, "rb") as f:
                    self.xgb_model = pickle.load(f)
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
            if self.xgb_model is not None and SHAP_AVAILABLE:
                self.explainer = shap.TreeExplainer(self.xgb_model)
                logger.info("ExplainabilityEngine: loaded trend XGBoost model and SHAP TreeExplainer.")
            elif not SHAP_AVAILABLE:
                logger.warning("ExplainabilityEngine: SHAP library not found — rationales will use rule-based fallback.")
            else:
                logger.warning("ExplainabilityEngine: trend XGBoost model not found — rationales will be empty.")
        except Exception as e:
            logger.error(f"ExplainabilityEngine: failed to initialize SHAP explainer: {e}")

    def calculate_shap_values(self, symbol: str) -> Dict[str, float]:
        """
        Compute real SHAP feature attributions for the BUY class (index 2) given
        a stock symbol. Returns a dict of {feature_name: shap_value} for features
        with abs(shap_value) >= 1e-4, sorted by descending absolute magnitude.
        """
        if self.explainer is None or not self.features:
            logger.warning("SHAP explainer not available — returning empty attributions.")
            return {}

        try:
            row = build_live_feature_row(symbol, self.workspace_root)
            X = pd.DataFrame([{f: row.get(f, 0.0) for f in self.features}])

            sv = self.explainer.shap_values(X)  # shape: (1, n_features, 3) ndarray

            # Extract BUY class (index 2) SHAP values
            if isinstance(sv, np.ndarray) and sv.ndim == 3:
                buy_shap = sv[0, :, 2]
            elif isinstance(sv, list) and len(sv) == 3:
                buy_shap = sv[2][0]
            else:
                logger.warning(f"Unexpected SHAP output shape: {type(sv)}, ndim={getattr(sv, 'ndim', '?')}")
                return {}

            # Filter non-negligible and sort by absolute magnitude
            pairs = [
                (name, float(val))
                for name, val in zip(self.features, buy_shap)
                if abs(val) >= 1e-4
            ]
            pairs.sort(key=lambda x: abs(x[1]), reverse=True)

            return dict(pairs)

        except Exception as e:
            logger.error(f"SHAP computation failed for {symbol}: {e}")
            return {}

    def generate_rationales(self, symbol: str, signal: str, top_n: int = 4) -> List[str]:
        """
        Generate plain-English explanations of why the model produced a given
        signal for a stock. Uses real SHAP attributions from the trained XGBoost
        trend model — not hardcoded thresholds or filler text.

        Args:
            symbol:  Stock ticker (e.g. "RELIANCE")
            signal:  The ensemble signal ("BUY", "SELL", or "HOLD")
            top_n:   Maximum number of explanations to return (default 4)

        Returns:
            List of plain-English strings, each describing one genuine driver
            of the prediction. May return fewer than top_n if fewer features
            have non-negligible SHAP values — never pads with filler.
        """
        shap_vals = self.calculate_shap_values(symbol)

        if not shap_vals:
            logger.warning(f"No SHAP values for {symbol} — returning minimal rationale.")
            return [f"Insufficient feature data to generate detailed rationales for {symbol}."]

        # Take top_n features by absolute SHAP magnitude
        top_features = list(shap_vals.items())[:top_n]

        rationales = []
        for feat_name, shap_val in top_features:
            description = _describe_feature(feat_name, shap_val)
            rationales.append(description)

        logger.info(f"Generated {len(rationales)} SHAP rationales for {symbol} (signal={signal}).")
        return rationales
