#!/usr/bin/env python3
import os
import sys
import time
import signal
import logging
from datetime import datetime, timedelta

# Configure logging to file and stream
current_dir = os.path.dirname(os.path.abspath(__file__))
log_dir = os.path.abspath(os.path.join(current_dir, "..", "storage"))
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "scheduler.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("quantara-scheduler-daemon")

# Add workspace root to sys.path
workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if workspace_root not in sys.path:
    sys.path.append(workspace_root)

try:
    from ml.src.autonomous_validation import AutonomousValidationSystem
except ImportError as e:
    logger.error(f"Failed to import AutonomousValidationSystem: {e}")
    sys.exit(1)

class SchedulerDaemon:
    """Daemon process managing scheduling execution loop at 3:45 PM IST."""

    def __init__(self):
        self.running = True
        self.validation_system = AutonomousValidationSystem()
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.handle_exit)
        signal.signal(signal.SIGTERM, self.handle_exit)

    def handle_exit(self, signum, frame):
        logger.info(f"Received shutdown signal {signum}. Shutting down daemon gracefully...")
        self.running = False

    def get_seconds_to_target(self):
        """Returns the number of seconds until 3:45 PM IST of the next weekday."""
        # Calculate current time in IST (UTC + 5:30)
        now_utc = datetime.utcnow()
        now_ist = now_utc + timedelta(hours=5, minutes=30)
        
        target_ist = now_ist.replace(hour=15, minute=45, second=0, microsecond=0)
        
        if now_ist >= target_ist:
            target_ist += timedelta(days=1)
            
        # Keep advancing if weekend (Saturday or Sunday)
        while target_ist.weekday() >= 5:
            target_ist += timedelta(days=1)
            
        diff = (target_ist - now_ist).total_seconds()
        return diff, target_ist

    def start(self):
        logger.info("Quantara Scheduler Daemon initialized. Listening on 3:45 PM IST execution schedule...")
        
        while self.running:
            try:
                sleep_sec, next_run = self.get_seconds_to_target()
                logger.info(f"Next execution target: {next_run.strftime('%Y-%m-%d %H:%M:%S')} IST.")
                logger.info(f"Sleeping for {sleep_sec / 3600:.2f} hours ({int(sleep_sec)} seconds)...")
                
                # Sleep in small increments to respond to signals promptly
                check_interval = 10
                elapsed = 0
                while elapsed < sleep_sec and self.running:
                    time.sleep(min(check_interval, sleep_sec - elapsed))
                    elapsed += check_interval
                
                if not self.running:
                    break
                    
                # Executing pipeline
                run_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
                logger.info(f"Triggering scheduled execution run for: {run_time.strftime('%Y-%m-%d %H:%M:%S')} IST")
                
                self.validation_system.run_daily_pipeline(run_time)
                
            except Exception as e:
                logger.error(f"Scheduler loop exception: {e}. Retrying in 60 seconds...")
                time.sleep(60)
                
        logger.info("Quantara Scheduler Daemon terminated successfully.")

if __name__ == "__main__":
    daemon = SchedulerDaemon()
    daemon.start()
