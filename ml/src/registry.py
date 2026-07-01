import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger("quantara-ml-registry")

class ModelRegistry:
    """Production-grade model registry repository tracking model versions and metadata."""

    def __init__(self):
        self.models_db: Dict[str, List[Dict[str, Any]]] = {
            "trend_predictor": [
                {
                    "version": "1.4.2",
                    "registered_at": "2026-06-25T10:00:00",
                    "status": "production",
                    "metrics": {"accuracy": 0.63, "f1": 0.62},
                    "features_used": ["rsi", "ema_cross_20_50", "india_vix"]
                }
            ],
            "profit_predictor": [
                {
                    "version": "1.2.0",
                    "registered_at": "2026-06-25T10:05:00",
                    "status": "production",
                    "metrics": {"precision": 0.64, "win_rate": 65.5},
                    "features_used": ["relative_volume", "delivery_percentage"]
                }
            ],
            "risk_predictor": [
                {
                    "version": "2.0.1",
                    "registered_at": "2026-06-25T10:10:00",
                    "status": "production",
                    "metrics": {"accuracy": 0.82},
                    "features_used": ["beta", "drawdown", "india_vix"]
                }
            ]
        }

    def register_model(self, model_name: str, version: str, metrics: Dict[str, float], features: List[str]) -> Dict[str, Any]:
        """Save a new model candidate version into the registry database."""
        logger.info(f"Registering new model candidate: {model_name} [v{version}]")
        
        record = {
            "version": version,
            "registered_at": datetime.now().isoformat(),
            "status": "candidate",
            "metrics": metrics,
            "features_used": features
        }
        
        if model_name not in self.models_db:
            self.models_db[model_name] = []
        
        self.models_db[model_name].append(record)
        logger.info(f"Model {model_name} v{version} successfully registered.")
        return record

    def get_production_model(self, model_name: str) -> Dict[str, Any]:
        """Fetch production model version parameters."""
        versions = self.models_db.get(model_name, [])
        for v in versions:
            if v["status"] == "production":
                return v
        
        # Fallback to latest
        return versions[-1] if versions else {}

    def transition_status(self, model_name: str, version: str, new_status: str):
        """Transition model state (e.g. candidate -> production, production -> archived)."""
        logger.info(f"Transitioning status of {model_name} [v{version}] to '{new_status}'")
        versions = self.models_db.get(model_name, [])
        for v in versions:
            if v["version"] == version:
                if new_status == "production":
                    # Mark others as archived
                    for x in versions:
                        if x["status"] == "production":
                            x["status"] = "archived"
                v["status"] = new_status
                logger.info(f"Model status successfully updated to {new_status}")
                return True
        logger.warning("Model version not found in registry.")
        return False
