from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import os
import sys
import json
import joblib
import subprocess
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
SCRIPTS_DIR = BASE_DIR / "scripts"

REGISTRY_PATH = MODELS_DIR / "customer_group_model_registry.json"
DAILY_DATA_PATH = DATA_DIR / "customer_group_daily_training_dataset.csv"
PREFERENCE_RANKINGS_PATH = MODELS_DIR / "customer_group_preference_rankings.json"
RANKER_PATH = MODELS_DIR / "customer_group_ranker.joblib"

app = FastAPI(
    title="Nilmini SmartDine Customer Preference API",
    version="2.0.0",
    description="Predict next-day most visiting customer group and provide preferred food items for menu quantity adjustment.",
)

AGE_GROUP_COLS = [
    "school_children_groups",
    "youngers_groups",
    "younger_adults_groups",
    "elders_groups",
]

AGE_GROUP_LABEL_MAP = {
    "school_children_groups": "School Children",
    "youngers_groups": "Youngers",
    "younger_adults_groups": "Younger Adults",
    "elders_groups": "Elders",
}

TIME_GROUP_COLS = [
    "morning_groups",
    "afternoon_groups",
    "evening_groups",
]

CATEGORY_UNIT_COLS = [
    "hot_beverage_units",
    "cold_beverage_units",
    "bakery_units",
    "short_eats_units",
    "food_meal_units",
    "traditional_food_units",
    "dairy_units",
    "other_units",
]

REGISTRY = None
PREFERENCE_RANKINGS = {}
RANKER = None
FEATURE_COLUMNS = []
GROUP_INFO = {}
CUSTOMER_GROUP_LABELS = []


class CustomerGroupPredictionRequest(BaseModel):
    prediction_date: Optional[str] = None
    weather_type: Optional[str] = "Normal"
    holiday: Optional[str] = "No"
    month_period: Optional[str] = None
    top_n: Optional[int] = 5


class CustomerDatasetUpdateRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None


def normalize_yes_no(value):
    if isinstance(value, bool):
        return "Yes" if value else "No"

    if isinstance(value, (int, float)):
        return "Yes" if int(value) != 0 else "No"

    text = str(value or "").strip().lower()

    if text in {"yes", "y", "true", "1", "holiday"}:
        return "Yes"

    return "No"


def normalize_weather(value):
    text = str(value or "").strip().lower()

    if text in {"rain", "rainy", "showers", "storm", "stormy", "drizzle"}:
        return "Rainy"

    if text in {"cloudy", "overcast", "partly cloudy", "partly-cloudy"}:
        return "Cloudy"

    if text in {"hot", "sunny", "warm", "clear", "very hot"}:
        return "Hot"

    return "Normal"


def get_month_period(date_value):
    dt = pd.to_datetime(date_value, errors="coerce")

    if pd.isna(dt):
        return "middle"

    day = int(dt.day)

    if day <= 10:
        return "start"

    if day <= 20:
        return "middle"

    return "end"


def normalize_month_period(value, fallback_date=None):
    text = str(value or "").strip().lower()

    if text in {"start", "beginning", "early"}:
        return "start"

    if text in {"middle", "mid"}:
        return "middle"

    if text in {"end", "late"}:
        return "end"

    if fallback_date is not None:
        return get_month_period(fallback_date)

    return "middle"


def load_registry():
    global REGISTRY
    global FEATURE_COLUMNS
    global GROUP_INFO
    global CUSTOMER_GROUP_LABELS

    if not REGISTRY_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Customer group model registry not found at {REGISTRY_PATH}",
        )

    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        REGISTRY = json.load(f)

    FEATURE_COLUMNS = REGISTRY.get("feature_columns", [])
    GROUP_INFO = REGISTRY.get("group_info", {})
    CUSTOMER_GROUP_LABELS = REGISTRY.get("customer_group_labels", [])

    if not FEATURE_COLUMNS:
        raise HTTPException(
            status_code=500,
            detail="customer_group_model_registry.json does not contain feature_columns.",
        )

    if not GROUP_INFO:
        raise HTTPException(
            status_code=500,
            detail="customer_group_model_registry.json does not contain group_info.",
        )

    if not CUSTOMER_GROUP_LABELS:
        CUSTOMER_GROUP_LABELS = list(GROUP_INFO.keys())

    return REGISTRY


def reload_preference_rankings():
    global PREFERENCE_RANKINGS

    if not PREFERENCE_RANKINGS_PATH.exists():
        PREFERENCE_RANKINGS = {}
        return PREFERENCE_RANKINGS

    with open(PREFERENCE_RANKINGS_PATH, "r", encoding="utf-8") as f:
        PREFERENCE_RANKINGS = json.load(f)

    return PREFERENCE_RANKINGS


def load_ranker():
    global RANKER

    if not RANKER_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Customer group ranker model not found at {RANKER_PATH}",
        )

    RANKER = joblib.load(RANKER_PATH)
    return RANKER


def load_model_artifacts(force=False):
    global REGISTRY
    global RANKER

    if force or REGISTRY is None:
        load_registry()

    if force or RANKER is None:
        load_ranker()

    reload_preference_rankings()

    return {
        "registry": REGISTRY,
        "rankerLoaded": RANKER is not None,
        "preferenceRankingGroups": list(PREFERENCE_RANKINGS.keys()),
    }


def load_daily_data():
    if not DAILY_DATA_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Daily training dataset not found at {DAILY_DATA_PATH}",
        )

    df = pd.read_csv(DAILY_DATA_PATH)

    if "date" not in df.columns:
        raise HTTPException(
            status_code=500,
            detail="customer_group_daily_training_dataset.csv must contain a date column.",
        )

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    return df


def add_daily_base_features(df):
    data = df.copy().sort_values("date").reset_index(drop=True)

    if "weather_type" not in data.columns:
        data["weather_type"] = "Normal"

    if "holiday" not in data.columns:
        data["holiday"] = "No"

    if "month_period" not in data.columns:
        data["month_period"] = data["date"].apply(get_month_period)

    data["day_of_week"] = data["date"].dt.day_name()
    data["month"] = data["date"].dt.month
    data["week_of_year"] = data["date"].dt.isocalendar().week.astype(int)
    data["is_weekend"] = data["date"].dt.dayofweek.map(
        lambda x: "Yes" if x >= 5 else "No"
    )

    data["month_period"] = data.apply(
        lambda row: normalize_month_period(row.get("month_period"), row["date"]),
        axis=1,
    )

    data["weather_type"] = data["weather_type"].apply(normalize_weather)
    data["holiday"] = data["holiday"].apply(normalize_yes_no)

    numeric_cols = (
        [
            "total_orders",
            "total_units_sold",
            "total_customer_groups",
            "avg_group_size",
        ]
        + AGE_GROUP_COLS
        + TIME_GROUP_COLS
        + CATEGORY_UNIT_COLS
    )

    for col in numeric_cols:
        if col not in data.columns:
            data[col] = 0

        data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0)

    data["dominant_age_group"] = data[AGE_GROUP_COLS].idxmax(axis=1).map(
        AGE_GROUP_LABEL_MAP
    )

    future_dates = data["date"] + pd.Timedelta(days=1)

    data["prediction_day_of_week"] = future_dates.dt.day_name()
    data["prediction_is_weekend"] = future_dates.dt.dayofweek.map(
        lambda x: "Yes" if x >= 5 else "No"
    )
    data["prediction_month"] = future_dates.dt.month
    data["prediction_week_of_year"] = future_dates.dt.isocalendar().week.astype(int)
    data["prediction_month_period"] = future_dates.apply(get_month_period)

    data["prediction_weather_type"] = data["weather_type"].shift(-1).fillna(
        data["weather_type"]
    )
    data["prediction_holiday"] = data["holiday"].shift(-1).fillna("No")

    feature_source_cols = (
        [
            "total_orders",
            "total_units_sold",
            "total_customer_groups",
            "avg_group_size",
        ]
        + AGE_GROUP_COLS
        + TIME_GROUP_COLS
        + CATEGORY_UNIT_COLS
    )

    for col in feature_source_cols:
        data[f"lag_1_{col}"] = data[col].shift(1)
        data[f"lag_7_{col}"] = data[col].shift(7)
        data[f"rolling_mean_3_{col}"] = data[col].rolling(3, min_periods=1).mean()
        data[f"rolling_mean_7_{col}"] = data[col].rolling(7, min_periods=1).mean()

    data["age_group_balance_range"] = (
        data[AGE_GROUP_COLS].max(axis=1) - data[AGE_GROUP_COLS].min(axis=1)
    )

    data["young_customer_groups"] = (
        data["school_children_groups"] + data["youngers_groups"]
    )

    data["adult_customer_groups"] = (
        data["younger_adults_groups"] + data["elders_groups"]
    )

    data["beverage_units"] = (
        data["hot_beverage_units"] + data["cold_beverage_units"]
    )

    data["food_units"] = (
        data["bakery_units"]
        + data["short_eats_units"]
        + data["food_meal_units"]
        + data["traditional_food_units"]
    )

    data["young_customer_ratio"] = np.where(
        data["total_customer_groups"] > 0,
        data["young_customer_groups"] / data["total_customer_groups"],
        0,
    )

    data["adult_customer_ratio"] = np.where(
        data["total_customer_groups"] > 0,
        data["adult_customer_groups"] / data["total_customer_groups"],
        0,
    )

    data["beverage_ratio"] = np.where(
        data["total_units_sold"] > 0,
        data["beverage_units"] / data["total_units_sold"],
        0,
    )

    data["food_ratio"] = np.where(
        data["total_units_sold"] > 0,
        data["food_units"] / data["total_units_sold"],
        0,
    )

    data = data.fillna(0)

    return data


def get_prediction_day_features(
    date_value,
    weather_type="Normal",
    holiday="No",
    month_period=None,
):
    dt = pd.to_datetime(date_value)

    return {
        "prediction_day_of_week": dt.day_name(),
        "prediction_is_weekend": "Yes" if dt.dayofweek >= 5 else "No",
        "prediction_month": int(dt.month),
        "prediction_week_of_year": int(dt.isocalendar().week),
        "prediction_month_period": normalize_month_period(month_period, dt),
        "prediction_weather_type": normalize_weather(weather_type),
        "prediction_holiday": normalize_yes_no(holiday),
    }


def build_live_candidate_rows(request: CustomerGroupPredictionRequest):
    load_model_artifacts()

    df = load_daily_data()

    if df.empty:
        raise HTTPException(status_code=500, detail="Daily dataset is empty.")

    data = add_daily_base_features(df)

    if data.empty:
        raise HTTPException(
            status_code=500,
            detail="Not enough daily data to build customer group prediction features.",
        )

    latest_row = data.iloc[-1].copy()

    if request.prediction_date:
        prediction_date = request.prediction_date
    else:
        prediction_date = (
            pd.to_datetime(latest_row["date"]) + pd.Timedelta(days=1)
        ).strftime("%Y-%m-%d")

    prediction_features = get_prediction_day_features(
        prediction_date,
        weather_type=request.weather_type or "Normal",
        holiday=request.holiday or "No",
        month_period=request.month_period,
    )

    rows = []

    for group_name in CUSTOMER_GROUP_LABELS:
        info = GROUP_INFO.get(group_name)

        if not info:
            continue

        count_col = info.get("count_col")

        if not count_col:
            continue

        if count_col not in data.columns:
            data[count_col] = 0

        row = latest_row.to_dict()

        for key, value in prediction_features.items():
            row[key] = value

        current_group_count = float(latest_row.get(count_col, 0))
        current_total_groups = float(latest_row.get("total_customer_groups", 0))

        row["candidate_customer_group"] = group_name
        row["candidate_group_type"] = info.get("group_type", "unknown")
        row["candidate_current_group_count"] = current_group_count
        row["candidate_current_group_share"] = (
            current_group_count / current_total_groups
            if current_total_groups > 0
            else 0
        )

        row["candidate_lag_1_group_count"] = current_group_count

        if len(data) >= 7:
            row["candidate_lag_7_group_count"] = float(data.iloc[-7].get(count_col, 0))
        else:
            row["candidate_lag_7_group_count"] = current_group_count

        previous_values = pd.to_numeric(data[count_col], errors="coerce").fillna(0)

        row["candidate_rolling_mean_3_group_count"] = float(
            previous_values.tail(3).mean()
        )
        row["candidate_rolling_mean_7_group_count"] = float(
            previous_values.tail(7).mean()
        )

        rows.append(row)

    if not rows:
        raise HTTPException(
            status_code=500,
            detail="No candidate customer group rows were created.",
        )

    candidate_df = pd.DataFrame(rows)

    missing = [c for c in FEATURE_COLUMNS if c not in candidate_df.columns]

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing feature columns for customer group prediction: {missing}",
        )

    return prediction_date, candidate_df


def get_preferred_items(age_group, top_n=5):
    reload_preference_rankings()

    items = PREFERENCE_RANKINGS.get(age_group, [])

    return [
        {
            "productName": item.get("product_name"),
            "preferenceScore": item.get("preference_score"),
            "totalUnitsByGroup": item.get("total_units_by_group"),
            "groupProductShare": item.get("group_product_share"),
        }
        for item in items[:top_n]
    ]


def parse_json_from_stdout(stdout_text):
    text = str(stdout_text or "").strip()

    if not text:
        return {
            "success": False,
            "message": "Script returned empty output.",
        }

    decoder = json.JSONDecoder()

    for index, char in enumerate(text):
        if char != "{":
            continue

        try:
            parsed, _ = decoder.raw_decode(text[index:])
            return parsed
        except Exception:
            continue

    return {
        "success": False,
        "message": "Could not parse JSON output from script.",
        "rawOutput": text[-2000:],
    }


def run_data_script(script_name, extra_args=None, timeout_seconds=240):
    script_path = SCRIPTS_DIR / script_name

    if not script_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Script not found: {script_path}",
        )

    command = [sys.executable, str(script_path)]

    if extra_args:
        command.extend(extra_args)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    try:
        result = subprocess.run(
            command,
            cwd=str(BASE_DIR),
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail={
                "success": False,
                "message": f"{script_name} timed out after {timeout_seconds} seconds.",
            },
        )

    parsed = parse_json_from_stdout(result.stdout)

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": f"{script_name} failed.",
                "returnCode": result.returncode,
                "stdout": result.stdout[-2000:],
                "stderr": result.stderr[-2000:],
            },
        )

    return parsed


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "nilmini-customer-preference-api",
        "status": "running",
        "paths": {
            "dailyDataset": str(DAILY_DATA_PATH),
            "preferenceRankings": str(PREFERENCE_RANKINGS_PATH),
            "registry": str(REGISTRY_PATH),
            "ranker": str(RANKER_PATH),
        },
        "artifacts": {
            "dailyDatasetExists": DAILY_DATA_PATH.exists(),
            "preferenceRankingsExists": PREFERENCE_RANKINGS_PATH.exists(),
            "registryExists": REGISTRY_PATH.exists(),
            "rankerExists": RANKER_PATH.exists(),
        },
    }


@app.get("/models")
def models():
    artifacts = load_model_artifacts()

    return {
        "success": True,
        "registry": artifacts["registry"],
        "rankerLoaded": artifacts["rankerLoaded"],
        "preferenceRankingGroups": artifacts["preferenceRankingGroups"],
    }


@app.post("/data/customer-datasets/upsert-from-orders")
def upsert_customer_datasets_from_orders(request: CustomerDatasetUpdateRequest):
    args = []

    if request.start_date:
        args.extend(["--start-date", request.start_date])

    if request.end_date:
        args.extend(["--end-date", request.end_date])

    result = run_data_script(
        "aggregate_orders_to_customer_dataset.py",
        extra_args=args,
        timeout_seconds=240,
    )

    return result


@app.post("/data/preferences/rebuild")
def rebuild_customer_preferences():
    result = run_data_script(
        "rebuild_customer_preference_rankings.py",
        timeout_seconds=240,
    )

    reload_preference_rankings()

    return result


@app.get("/preferences/{customer_group}")
def preferences(customer_group: str, top_n: int = 5):
    load_model_artifacts()

    normalized = customer_group.strip()
    available = list(PREFERENCE_RANKINGS.keys())
    matched = next((g for g in available if g.lower() == normalized.lower()), None)

    if not matched:
        raise HTTPException(
            status_code=404,
            detail=f"Customer group not found. Available groups: {available}",
        )

    return {
        "success": True,
        "customerGroup": matched,
        "preferredFoodItems": get_preferred_items(matched, top_n),
    }


@app.post("/predict/customer-group")
def predict_customer_group(request: CustomerGroupPredictionRequest):
    load_model_artifacts()

    prediction_date, candidate_df = build_live_candidate_rows(request)

    prediction_input = candidate_df[FEATURE_COLUMNS].copy()

    candidate_df = candidate_df.copy()
    candidate_df["predictedScore"] = np.maximum(
        RANKER.predict(prediction_input),
        0,
    )

    total_score = float(candidate_df["predictedScore"].sum())

    if total_score > 0:
        candidate_df["normalizedScorePercentage"] = (
            candidate_df["predictedScore"] / total_score * 100
        )
    else:
        candidate_df["normalizedScorePercentage"] = 0

    candidate_df = candidate_df.sort_values(
        "predictedScore",
        ascending=False,
    ).reset_index(drop=True)

    predicted_group = str(candidate_df.iloc[0]["candidate_customer_group"])
    confidence = float(round(candidate_df.iloc[0]["normalizedScorePercentage"], 4))

    candidate_scores = []

    for _, row in candidate_df.iterrows():
        candidate_scores.append(
            {
                "customerGroup": row["candidate_customer_group"],
                "predictedScore": float(round(row["predictedScore"], 6)),
                "normalizedScorePercentage": float(
                    round(row["normalizedScorePercentage"], 4)
                ),
            }
        )

    return {
        "success": True,
        "predictionDate": prediction_date,
        "strategy": "next_day_customer_group_ranking",
        "predictedCustomerGroup": predicted_group,
        "confidencePercentage": confidence,
        "candidateScores": candidate_scores,
    }


@app.post("/predict/customer-menu-preference")
def predict_customer_menu_preference(request: CustomerGroupPredictionRequest):
    result = predict_customer_group(request)

    customer_group = result["predictedCustomerGroup"]
    top_n = request.top_n or 5

    return {
        "success": True,
        "predictionDate": result["predictionDate"],
        "predictedCustomerGroup": customer_group,
        "confidencePercentage": result["confidencePercentage"],
        "candidateScores": result["candidateScores"],
        "preferredFoodItems": get_preferred_items(customer_group, top_n),
        "note": "This service predicts the most visiting customer group and returns preferred food items. Product quantities must come from the demand prediction model, then AI menu service can adjust preferred items by 10-15 units.",
    }