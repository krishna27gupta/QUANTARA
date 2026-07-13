import os
import json
import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger("quantara-ml-registry")

class ModelRegistry:
    """Production-grade model registry repository tracking model versions and metadata."""

    def __init__(self, models_dir: str = "models"):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.models_dir = os.path.join(self.workspace_root, models_dir)

        # Removed fake hardcoded metrics.
        self.models_db: Dict[str, List[Dict[str, Any]]] = {}

    def get_model_metrics(self, model_name: str) -> Dict[str, Any]:
        """Read actual model metrics from the JSON file generated during training."""
        metrics_file = os.path.join(self.models_dir, f"metrics_{model_name}.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not read metrics for {model_name}: {e}")
        
        # Generic placeholder if no real metrics exist
        return {
            "note": "Metrics not available. Model was trained, but evaluation JSON is missing.",
            "status": "production"
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
        metrics = self.get_model_metrics(model_name)
        
        versions = self.models_db.get(model_name, [])
        for v in versions:
            if v["status"] == "production":
                return {**v, "metrics": metrics}
        
        # Fallback to a placeholder record if nothing is registered yet
        return {
            "version": "latest",
            "status": "production",
            "metrics": metrics,
            "features_used": []
        }

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

