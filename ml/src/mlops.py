import os
import json
import logging
from typing import Any, Dict

logger = logging.getLogger("quantara-mlops")

class MLOpsInfrastructure:
    """Production ML infrastructure tracker, recording local metrics and pipeline alerts."""

    def __init__(self, tracking_uri: str = "local"):
        self.tracking_uri = tracking_uri
        self.active_run_id = None
        self.active_run_dir = None
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        self.runs_dir = os.path.join(self.workspace_root, "ml", "runs")
        os.makedirs(self.runs_dir, exist_ok=True)
        
        logger.info(f"Initialized MLOps infrastructure engine locally at {self.runs_dir}")

    def start_run(self, run_name: str) -> str:
        """Start a new experiment tracking session run."""
        self.active_run_id = f"run_{random_hex()}"
        self.active_run_dir = os.path.join(self.runs_dir, self.active_run_id)
        os.makedirs(self.active_run_dir, exist_ok=True)
        
        import time
        with open(os.path.join(self.active_run_dir, "meta.json"), "w") as f:
            json.dump({"run_name": run_name, "start_time": time.time()}, f)
            
        logger.info(f"Starting active experiment run [name={run_name}, run_id={self.active_run_id}]")
        return self.active_run_id

    def log_params(self, params: Dict[str, Any]):
        """Record model training hyperparameters."""
        if not self.active_run_id:
            logger.warning("No active run found. Logging parameters globally.")
        else:
            params_file = os.path.join(self.active_run_dir, "params.json")
            existing_params = {}
            if os.path.exists(params_file):
                with open(params_file, "r") as f:
                    existing_params = json.load(f)
                    
            existing_params.update(params)
            with open(params_file, "w") as f:
                json.dump(existing_params, f, indent=2)
                
        for k, v in params.items():
            logger.info(f"Log Parameter: {k} = {v}")

    def log_metrics(self, metrics: Dict[str, float], step: int = 0):
        """Record training performance evaluation metrics."""
        if not self.active_run_id:
            logger.warning("No active run found. Logging metrics globally.")
        else:
            metrics_file = os.path.join(self.active_run_dir, "metrics.json")
            existing_metrics = []
            if os.path.exists(metrics_file):
                with open(metrics_file, "r") as f:
                    existing_metrics = json.load(f)
                    
            existing_metrics.append({"step": step, "metrics": metrics})
            with open(metrics_file, "w") as f:
                json.dump(existing_metrics, f, indent=2)
                
        for k, v in metrics.items():
            logger.info(f"Log Metric [step={step}]: {k} = {v:.6f}")

    def end_run(self):
        """Finalize the active experiment run tracking session."""
        if self.active_run_id and self.active_run_dir:
            import time
            meta_file = os.path.join(self.active_run_dir, "meta.json")
            if os.path.exists(meta_file):
                with open(meta_file, "r+") as f:
                    meta = json.load(f)
                    meta["end_time"] = time.time()
                    f.seek(0)
                    json.dump(meta, f)
                    f.truncate()
        
        logger.info(f"Finalizing and closing active run {self.active_run_id}")
        self.active_run_id = None
        self.active_run_dir = None

    def trigger_alerts(self, monitor_metrics: Dict[str, Any]):
        """Check values and trigger Ops alerts on anomalies."""
        null_count = monitor_metrics.get("null_values_count", 0)
        drift_prob = monitor_metrics.get("kolmogorov_smirnov_p_value", 0.5)

        if null_count > 0:
            logger.critical(f"MLOps Alert: Null values detected in features! count={null_count}")
        if drift_prob < 0.05:
            logger.warning(f"MLOps Alert: Data drift detected! p-value is extremely low: {drift_prob:.4f}")

def random_hex() -> str:
    """
    Generate a mock hex ID string.
    Note: This generates a local run ID, not a real MLflow UUID.
    """
    import time
    return hex(int(time.time() * 1000))[2:]
