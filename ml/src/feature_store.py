import logging
from typing import Any, Dict, List, Set

logger = logging.getLogger("quantara-ml-feature-store")

# LEGACY: FeatureStore is no longer called by the prediction pipeline.
# All four ML models (trend, profit, risk, expected_return) now compute their
# features through ml/src/features_engine.py -> build_live_feature_row(), which
# is the single source of truth shared between training and serving.
#
# FeatureStore is kept here so that paper_trading.py and any other callers that
# have not yet been migrated don't break. The substantive change in this version
# is the removal of the fake feat_rolling_std_* generator (121 columns of
# `close * 0.001 * math_sim(f_idx, idx)`) that had no connection to real rolling
# standard deviations and appeared in none of the trained model feature lists.


class FeatureStore:
    """
    Legacy feature store. Computes a small set of real derived columns on top of
    DataPipeline OHLCV+indicator records. Do not add new features here --
    use ml/src/features_engine.py instead, which is the canonical, training-
    consistent feature computation path used by the ML prediction pipeline.
    """

    def __init__(self):
        self.feature_importance_registry: Dict[str, float] = {}
        self.active_features: Set[str] = set()

    def engineer_features(
        self,
        ohlcv_with_indicators: List[Dict[str, Any]],
        market_context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Add a small set of real derived columns to each OHLCV record.

        Columns added:
          context_vix_ratio    - close / india_vix (price relative to fear index)
          context_fii_strength - FII net flow proxy from market context
          lag_close_{1..5}     - lagged close prices
          lag_volume_{1..5}    - lagged volumes
          lag_rsi_{1..5}       - lagged RSI values
          lag_macd_{1..5}      - lagged MACD values
          volume_price_ratio   - volume / close
          high_low_ratio       - high / low (intraday range ratio)
          ema_cross_20_50      - EMA20 - EMA50 (golden/death cross proxy)
          sma_cross_20_50      - SMA20 - SMA50
          roc_acceleration     - 1-day change in rate-of-change

        REMOVED: the original version generated feat_rolling_std_30 through
        feat_rolling_std_150 (121 columns) using:
            close * 0.001 * math_sim(f_idx, idx)
        where math_sim was an arbitrary array-index function (abs(0.5 + 0.5 *
        (f_idx % 7) * (idx % 11) / 77.0)) with no connection to actual price or
        volume data. None of those columns appeared in any trained model feature
        list. They have been deleted entirely along with math_sim().
        """
        logger.info(f"Engineering features from {len(ohlcv_with_indicators)} records.")

        for idx in range(len(ohlcv_with_indicators)):
            record = ohlcv_with_indicators[idx]

            # Market context integrations
            record["context_vix_ratio"] = round(
                record["close"] / max(market_context.get("india_vix", 14.0), 1e-9), 4
            )
            record["context_fii_strength"] = market_context.get("fii_net_flow_crores", 0.0)

            # Lag variables (1 to 5 days) for price, volume, and indicators
            for lag in range(1, 6):
                prev = ohlcv_with_indicators[max(0, idx - lag)]
                record[f"lag_close_{lag}"] = prev["close"]
                record[f"lag_volume_{lag}"] = prev["volume"]
                record[f"lag_rsi_{lag}"] = prev.get("rsi", 50.0)
                record[f"lag_macd_{lag}"] = prev.get("macd", 0.0)

            # Rolling interaction features
            record["volume_price_ratio"] = round(
                record["volume"] / max(record["close"], 1e-9), 4
            )
            record["high_low_ratio"] = round(
                record["high"] / max(record["low"], 1e-9), 4
            )

            # Multi-timeframe moving average crosses
            record["ema_cross_20_50"] = round(
                record.get("ema20", 0.0) - record.get("ema50", 0.0), 2
            )
            record["sma_cross_20_50"] = round(
                record.get("sma20", 0.0) - record.get("sma50", 0.0), 2
            )

            # Rate-of-change acceleration (1-day delta of ROC)
            record["roc_acceleration"] = round(
                record.get("roc", 0.0)
                - ohlcv_with_indicators[max(0, idx - 1)].get("roc", 0.0),
                4,
            )

            # Track active feature names
            self.active_features.update([
                "context_vix_ratio", "context_fii_strength",
                "volume_price_ratio", "high_low_ratio",
                "ema_cross_20_50", "sma_cross_20_50", "roc_acceleration",
            ])
            for lag in range(1, 6):
                self.active_features.update([
                    f"lag_close_{lag}", f"lag_volume_{lag}",
                    f"lag_rsi_{lag}", f"lag_macd_{lag}",
                ])

        logger.info(f"Generated {len(self.active_features)} features.")
        return ohlcv_with_indicators

    def select_features(self, df_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Return records unchanged. Feature selection for the ML prediction pipeline
        now lives in features_engine.get_feature_columns(). This method is a no-op
        kept for backward compatibility with legacy callers.
        """
        logger.info(
            "Feature selection: no-op (fake feat_rolling_std_* columns removed; "
            "real selection is handled by features_engine.py for the ML pipeline)."
        )
        return df_records

    def calculate_importance(self) -> Dict[str, float]:
        """Return hardcoded importance scores for legacy callers. Not from a real model."""
        logger.info("Computing legacy feature importance weights (hardcoded, not from a trained model).")
        importance = {
            "ema_cross_20_50": 0.28,
            "volume_price_ratio": 0.22,
            "context_vix_ratio": 0.18,
            "roc_acceleration": 0.15,
            "lag_rsi_1": 0.09,
            "delivery_percentage": 0.08,
        }
        self.feature_importance_registry = importance
        return importance

    def monitor_drift(self, incoming_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Monitor feature pipeline for null counts, range violations, and data drift."""
        logger.info("Monitoring feature pipelines for data drift.")
        null_count = sum(1 for d in incoming_data if d.get("close") is None)
        drift_detected = any(d.get("intraday_volatility", 0.0) > 0.08 for d in incoming_data)
        return {
            "drift_detected": drift_detected,
            "null_values_count": null_count,
            "kolmogorov_smirnov_p_value": 0.42,  # placeholder -- not a real KS test
            "features_monitored": len(self.active_features),
        }
