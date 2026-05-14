import os
import sys
import subprocess
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

BASE_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = BASE_DIR / "scripts"

TIME_ZONE = os.environ.get("TZ", "Asia/Colombo")

AGGREGATE_TIME = os.environ.get("AGGREGATE_TIME", "23:15")
PREFERENCE_ANALYZE_TIME = os.environ.get("PREFERENCE_ANALYZE_TIME", "23:20")

RETRAIN_DAYS = os.environ.get("RETRAIN_DAYS", "mon,thu")
RETRAIN_TIME = os.environ.get("RETRAIN_TIME", "23:30")

RUN_RETRAIN_ON_START = (
    os.environ.get("RUN_RETRAIN_ON_START", "false").strip().lower() == "true"
)


def parse_hour_minute(value):
    hour_text, minute_text = value.split(":")
    return int(hour_text), int(minute_text)


def run_script(script_name, extra_args=None):
    script_path = SCRIPTS_DIR / script_name
    command = [sys.executable, str(script_path)]

    if extra_args:
        command.extend(extra_args)

    print(f"Running command: {' '.join(command)}", flush=True)

    result = subprocess.run(
        command,
        cwd=str(BASE_DIR),
        check=False,
    )

    if result.returncode != 0:
        raise RuntimeError(f"{script_name} failed with exit code {result.returncode}")


def aggregate_orders():
    run_script("aggregate_orders_to_customer_dataset.py")


def rebuild_preferences():
    run_script("rebuild_customer_preference_rankings.py")


def retrain_model():
    aggregate_orders()
    rebuild_preferences()
    run_script("retrain_customer_preference_model.py")


def main():
    scheduler = BlockingScheduler(timezone=TIME_ZONE)

    aggregate_hour, aggregate_minute = parse_hour_minute(AGGREGATE_TIME)
    preference_hour, preference_minute = parse_hour_minute(PREFERENCE_ANALYZE_TIME)
    retrain_hour, retrain_minute = parse_hour_minute(RETRAIN_TIME)

    scheduler.add_job(
        aggregate_orders,
        CronTrigger(
            hour=aggregate_hour,
            minute=aggregate_minute,
            timezone=TIME_ZONE,
        ),
        id="daily_customer_dataset_aggregation",
        replace_existing=True,
    )

    scheduler.add_job(
        rebuild_preferences,
        CronTrigger(
            hour=preference_hour,
            minute=preference_minute,
            timezone=TIME_ZONE,
        ),
        id="daily_customer_preference_analysis",
        replace_existing=True,
    )

    scheduler.add_job(
        retrain_model,
        CronTrigger(
            day_of_week=RETRAIN_DAYS,
            hour=retrain_hour,
            minute=retrain_minute,
            timezone=TIME_ZONE,
        ),
        id="twice_weekly_customer_group_retraining",
        replace_existing=True,
    )

    print("Customer preference scheduler started.", flush=True)
    print(f"Daily dataset aggregation time: {AGGREGATE_TIME} {TIME_ZONE}", flush=True)
    print(f"Daily preference analysis time: {PREFERENCE_ANALYZE_TIME} {TIME_ZONE}", flush=True)
    print(f"Retrain days: {RETRAIN_DAYS}", flush=True)
    print(f"Retrain time: {RETRAIN_TIME} {TIME_ZONE}", flush=True)

    if RUN_RETRAIN_ON_START:
        print("RUN_RETRAIN_ON_START=true, running retraining now.", flush=True)
        retrain_model()

    scheduler.start()


if __name__ == "__main__":
    main()