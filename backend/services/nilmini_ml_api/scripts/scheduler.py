import os
import sys
import subprocess
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

BASE_DIR = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = BASE_DIR / "scripts"

TIME_ZONE = os.environ.get("TZ", "Asia/Colombo")
DEMAND_DATASET_UPDATE_TIME = os.environ.get("DEMAND_DATASET_UPDATE_TIME", "23:10")

RUN_DEMAND_UPDATE_ON_START = (
    os.environ.get("RUN_DEMAND_UPDATE_ON_START", "false").strip().lower()
    == "true"
)

ALLOW_DEV_FALLBACK_ON_EMPTY = (
    os.environ.get("ALLOW_DEV_FALLBACK_ON_EMPTY", "false").strip().lower()
    == "true"
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


def update_demand_datasets():
    args = []

    if ALLOW_DEV_FALLBACK_ON_EMPTY:
        args.append("--allow-dev-fallback")

    run_script("update_demand_datasets_from_orders.py", args)


def main():
    scheduler = BlockingScheduler(timezone=TIME_ZONE)

    update_hour, update_minute = parse_hour_minute(DEMAND_DATASET_UPDATE_TIME)

    scheduler.add_job(
        update_demand_datasets,
        CronTrigger(
            hour=update_hour,
            minute=update_minute,
            timezone=TIME_ZONE,
        ),
        id="daily_demand_dataset_update",
        replace_existing=True,
    )

    print("Demand dataset scheduler started.", flush=True)
    print(
        f"Daily demand dataset update time: {DEMAND_DATASET_UPDATE_TIME} {TIME_ZONE}",
        flush=True,
    )
    print(
        f"RUN_DEMAND_UPDATE_ON_START: {RUN_DEMAND_UPDATE_ON_START}",
        flush=True,
    )
    print(
        f"ALLOW_DEV_FALLBACK_ON_EMPTY: {ALLOW_DEV_FALLBACK_ON_EMPTY}",
        flush=True,
    )

    if RUN_DEMAND_UPDATE_ON_START:
        print("RUN_DEMAND_UPDATE_ON_START=true, running update now.", flush=True)
        update_demand_datasets()

    scheduler.start()


if __name__ == "__main__":
    main()