import logging
from typing import Any, Dict

logger = logging.getLogger("quantara-mlops")

class MLOpsInfrastructure:
    """Production ML infrastructure tracker, recording local metrics and pipeline alerts."""

    def __init__(self, tracking_uri: str = "local"):
        self.tracking_uri = tracking_uri
        self.active_run_id = None
        logger.info(f"Initialized MLOps infrastructure engine locally at {tracking_uri}")

    def start_run(self, run_name: str) -> str:
        """Start a new experiment tracking session run."""
        self.active_run_id = f"run_{random_hex()}"
        logger.info(f"Starting active experiment run [name={run_name}, run_id={self.active_run_id}]")
        return self.active_run_id

    def log_params(self, params: Dict[str, Any]):
        """Record model training hyperparameters."""
        if not self.active_run_id:
            logger.warning("No active run found. Logging parameters globally.")
        for k, v in params.items():
            logger.info(f"Log Parameter: {k} = {v}")

    def log_metrics(self, metrics: Dict[str, float], step: int = 0):
        """Record training performance evaluation metrics."""
        if not self.active_run_id:
            logger.warning("No active run found. Logging metrics globally.")
        for k, v in metrics.items():
            logger.info(f"Log Metric [step={step}]: {k} = {v:.6f}")

    def end_run(self):
        """Finalize the active experiment run tracking session."""
        logger.info(f"Finalizing and closing active run {self.active_run_id}")
        self.active_run_id = None

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
