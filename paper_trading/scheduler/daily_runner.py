#!/usr/bin/env python3
import os
import sys
import argparse
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("quantara-daily-runner")

# Add workspace root to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if workspace_root not in sys.path:
    sys.path.append(workspace_root)

try:
    from ml.src.autonomous_validation import AutonomousValidationSystem
except ImportError as e:
    logger.error(f"Failed to import AutonomousValidationSystem: {e}")
    sys.exit(1)

def run_once(target_date_str=None):
    """Executes a single validation run for a given date."""
    system = AutonomousValidationSystem()
    
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        except ValueError:
            logger.error("Invalid date format. Expected YYYY-MM-DD.")
            sys.exit(1)
    else:
        # Use current local date
        target_date = datetime.now()

    # Check weekday (Monday=0 to Friday=4)
    if target_date.weekday() >= 5:
        logger.info(f"Target date {target_date.strftime('%Y-%m-%d')} is a weekend. Skipping market execution.")
        return

    logger.info(f"Triggering daily validation run for: {target_date.strftime('%Y-%m-%d')}")
    try:
        system.run_daily_pipeline(target_date)
    except Exception as e:
        logger.error(f"Error during validation pipeline execution: {e}")
        sys.exit(1)

def simulate_history(days):
    """Backfills performance simulator outputs for historical validation."""
    logger.info(f"Starting historical backfill simulation for {days} trading days...")
    system = AutonomousValidationSystem()
    try:
        system.simulate_history(days)
        logger.info("Historical validation simulation successfully generated.")
    except Exception as e:
        logger.error(f"Error during validation simulation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Quantara Daily Validation Runner CLI. Integrates with Cron, Airflow, and other schedulers."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--run-once",
        action="store_true",
        help="Run paper trading validation pipeline for the current date."
    )
    group.add_argument(
        "--date",
        type=str,
        help="Run validation pipeline for a specific date in YYYY-MM-DD format."
    )
    group.add_argument(
        "--simulate",
        type=int,
        help="Pre-populate validation logs with simulated data for N historical days."
    )

    args = parser.parse_args()

    if args.simulate is not None:
        simulate_history(args.simulate)
    elif args.date:
        run_once(args.date)
    elif args.run_once:
        run_once()
