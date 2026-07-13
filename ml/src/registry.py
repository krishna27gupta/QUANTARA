import os
import json
import logging
import hashlib
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger("quantara-ml-registry")

class ModelRegistry:
    """Production-grade model registry repository tracking model versions and metadata."""

    def __init__(self, models_dir: str = "models"):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.models_dir = os.path.join(self.workspace_root, models_dir)
        self.registry_db_path = os.path.join(self.models_dir, "registry_db.json")

        self.models_db: Dict[str, List[Dict[str, Any]]] = self._load_db()

    def _load_db(self) -> Dict[str, List[Dict[str, Any]]]:
        if os.path.exists(self.registry_db_path):
            try:
                with open(self.registry_db_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load registry DB: {e}")
        return {}

    def _save_db(self):
        try:
            with open(self.registry_db_path, "w") as f:
                json.dump(self.models_db, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save registry DB: {e}")

    def _get_file_hash(self, filepath: str) -> str:
        """Compute SHA-256 hash of a file for versioning."""
        if not os.path.exists(filepath):
            return "unknown"
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            buf = f.read(65536)
            while len(buf) > 0:
                hasher.update(buf)
                buf = f.read(65536)
        return hasher.hexdigest()[:12]

    def get_model_metrics(self, model_name: str) -> Dict[str, Any]:
        """Read actual model metrics from the JSON file generated during training."""
        metrics_file = os.path.join(self.models_dir, f"metrics_{model_name}.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not read metrics for {model_name}: {e}")
        
        return {
            "note": "Metrics not available. Model was trained, but evaluation JSON is missing.",
            "status": "production"
        }

    def _get_features_used(self, model_name: str) -> List[str]:
        """Read actual feature metadata from the JSON file generated during training."""
        feature_name = model_name.replace('_predictor', '')
        # Fallback to general feature_metadata.json if specific one doesn't exist
        meta_file = os.path.join(self.models_dir, f"{feature_name}_feature_metadata.json")
        if not os.path.exists(meta_file):
            meta_file = os.path.join(self.models_dir, "feature_metadata.json")
            
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r") as f:
                    return json.load(f).get("features", [])
            except Exception as e:
                logger.warning(f"Could not read features for {model_name}: {e}")
        return []

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
        self._save_db()
        logger.info(f"Model {model_name} v{version} successfully registered.")
        return record

    def get_production_model(self, model_name: str) -> Dict[str, Any]:
        """Fetch production model version parameters and combine with actual disk artifact data."""
        metrics = self.get_model_metrics(model_name)
        features = self._get_features_used(model_name)
        
        # Try to find corresponding binary to get hash and timestamp
        binary_map = {
            "trend_predictor": "trend_xgboost.pkl",
            "profit_predictor": "profit_xgb.pkl",
            "risk_predictor": "risk_gb.pkl",
            "expected_return_predictor": "return_quantile_models.pkl"
        }
        
        binary_file = binary_map.get(model_name)
        file_hash = "unknown"
        modified_at = "unknown"
        
        if binary_file:
            full_path = os.path.join(self.models_dir, binary_file)
            if os.path.exists(full_path):
                file_hash = self._get_file_hash(full_path)
                modified_at = datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
        
        versions = self.models_db.get(model_name, [])
        for v in versions:
            if v["status"] == "production":
                return {**v, "metrics": metrics, "features_used": features, "hash": file_hash, "binary_updated_at": modified_at}
        
        # Fallback to reading the binary directly if nothing is formally registered
        return {
            "version": f"auto-{file_hash}",
            "status": "production",
            "metrics": metrics,
            "features_used": features,
            "hash": file_hash,
            "binary_updated_at": modified_at
        }

    def transition_status(self, model_name: str, version: str, new_status: str):
        """Transition model state (e.g. candidate -> production, production -> archived)."""
        logger.info(f"Transitioning status of {model_name} [v{version}] to '{new_status}'")
        versions = self.models_db.get(model_name, [])
        found = False
        for v in versions:
            if v["version"] == version:
                found = True
                if new_status == "production":
                    # Mark others as archived
                    for x in versions:
                        if x["status"] == "production":
                            x["status"] = "archived"
                v["status"] = new_status
                logger.info(f"Model status successfully updated to {new_status}")
        
        if found:
            self._save_db()
            return True
            
        logger.warning("Model version not found in registry.")
        return False
