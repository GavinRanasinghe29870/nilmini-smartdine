from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Union, Optional
from pathlib import Path
import json
import joblib
import csv
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
REGISTRY_PATH = MODELS_DIR / "model_registry.json"

app = FastAPI(
    title="Nilmini SmartDine ML API",
    version="13.0.0",
    description="Per-product feature-template selection + model selection API."
)

YesNoLike = Union[str, int, bool]

class DemandPredictionInput(BaseModel):
    date: str
    weather_type: str
    holiday: YesNoLike
    before_holiday_flag: YesNoLike
    after_holiday_flag: YesNoLike
    payday_window: YesNoLike
    lag_1_units: float = Field(..., ge=0)
    lag_7_units: float = Field(..., ge=0)
    lag_14_units: float = Field(..., ge=0)
    lag_21_units: float = Field(..., ge=0)
    lag_28_units: float = Field(..., ge=0)
    rolling_mean_3: float = Field(..., ge=0)
    rolling_mean_7: float = Field(..., ge=0)
    rolling_mean_14: float = Field(..., ge=0)
    rolling_std_7: float = Field(..., ge=0)
    rolling_std_14: float = Field(..., ge=0)
    rolling_median_7: float = Field(..., ge=0)
    rolling_median_14: float = Field(..., ge=0)
    trend_1_7: float
    trend_7_14: float
    weighted_recent: float

class DemandBatchItem(BaseModel):
    product_name: str
    features: DemandPredictionInput

class DemandBatchRequest(BaseModel):
    items: List[DemandBatchItem]

with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
    REGISTRY = json.load(f)

PRODUCT_STRATEGIES = REGISTRY.get("product_strategies", {})

def slugify(name: str) -> str:
    return (
        str(name).strip().lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("-", "_")
        .replace("&", "and")
    )

def normalize_yes_no(value):
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, (int, float)):
        return "Yes" if int(value) != 0 else "No"
    value = str(value).strip().lower()
    return "Yes" if value in {"yes", "y", "true", "1"} else "No"

def normalize_weather(value):
    v = str(value).strip().lower()
    if v in {"rain", "rainy", "showers", "storm", "stormy", "drizzle"}:
        return "Rainy"
    if v in {"cloudy", "overcast", "partly cloudy", "partly-cloudy"}:
        return "Cloudy"
    if v in {"hot", "sunny", "warm", "clear", "very hot"}:
        return "Hot"
    return "Normal"

def build_feature_row(features):
    dt = pd.to_datetime(features.date)
    return pd.DataFrame([{
        "day_of_week": dt.day_name(),
        "is_weekend": "Yes" if dt.dayofweek >= 5 else "No",
        "weather_type": normalize_weather(features.weather_type),
        "holiday": normalize_yes_no(features.holiday),
        "before_holiday_flag": normalize_yes_no(features.before_holiday_flag),
        "after_holiday_flag": normalize_yes_no(features.after_holiday_flag),
        "payday_window": normalize_yes_no(features.payday_window),
        "is_month_start": "Yes" if dt.is_month_start else "No",
        "is_month_end": "Yes" if dt.is_month_end else "No",
        "month": int(dt.month),
        "week_of_year": int(dt.isocalendar().week),
        "day": int(dt.day),
        "quarter": int(dt.quarter),
        "week_of_month": int(((dt.day - 1) // 7) + 1),
        "lag_1_units": float(features.lag_1_units),
        "lag_7_units": float(features.lag_7_units),
        "lag_14_units": float(features.lag_14_units),
        "lag_21_units": float(features.lag_21_units),
        "lag_28_units": float(features.lag_28_units),
        "rolling_mean_3": float(features.rolling_mean_3),
        "rolling_mean_7": float(features.rolling_mean_7),
        "rolling_mean_14": float(features.rolling_mean_14),
        "rolling_std_7": float(features.rolling_std_7),
        "rolling_std_14": float(features.rolling_std_14),
        "rolling_median_7": float(features.rolling_median_7),
        "rolling_median_14": float(features.rolling_median_14),
        "trend_1_7": float(features.trend_1_7),
        "trend_7_14": float(features.trend_7_14),
        "weighted_recent": float(features.weighted_recent),
    }])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/models")
def models():
    return REGISTRY

@app.post("/predict/demand/{product_name}")
def predict_demand(product_name: str, features: DemandPredictionInput):
    strategy_info = PRODUCT_STRATEGIES.get(product_name)
    if strategy_info is None:
        raise HTTPException(status_code=404, detail=f"Unknown product: {product_name}")

    strategy = strategy_info.get("selected_strategy", "seasonal_naive")
    feature_columns = strategy_info.get("feature_columns", [])

    if strategy == "seasonal_naive":
        pred = max(int(round(float(features.lag_7_units))), 0)
        return {"product_name": product_name, "prediction_type": "seasonal_naive", "predicted_units": pred}

    if strategy == "rolling_mean_7":
        pred = max(int(round(float(features.rolling_mean_7))), 0)
        return {"product_name": product_name, "prediction_type": "rolling_mean_7", "predicted_units": pred}

    if strategy == "rolling_mean_14":
        pred = max(int(round(float(features.rolling_mean_14))), 0)
        return {"product_name": product_name, "prediction_type": "rolling_mean_14", "predicted_units": pred}

    model_path = MODELS_DIR / f"demand_model_{slugify(product_name)}.joblib"
    if not model_path.exists():
        pred = max(int(round(float(features.lag_7_units))), 0)
        return {"product_name": product_name, "prediction_type": "seasonal_naive", "predicted_units": pred}

    model = joblib.load(model_path)
    X = build_feature_row(features)[feature_columns]
    model_pred = max(float(np.expm1(model.predict(X)[0])), 0)

    if strategy == "blend_catboost_rm7":
        pred = max(int(round((0.7 * model_pred) + (0.3 * float(features.rolling_mean_7)))), 0)
    elif strategy == "blend_catboost_rm14":
        pred = max(int(round((0.5 * model_pred) + (0.5 * float(features.rolling_mean_14)))), 0)
    else:
        pred = max(int(round(model_pred)), 0)

    return {"product_name": product_name, "prediction_type": strategy, "predicted_units": pred}

@app.post("/predict/demand-batch")
def predict_demand_batch(request: DemandBatchRequest):
    results = []
    for item in request.items:
        results.append(predict_demand(item.product_name, item.features))
    return {"results": results}

class NextDayAllRequest(BaseModel):
    prediction_date: Optional[str] = None
    weather_type: Optional[str] = "Normal"
    holiday: Optional[str] = "No"


NEXT_DAY_PREDICTIONS_PATH = BASE_DIR / "next_day_selected_product_predictions.csv"
RELIABILITY_PATH = BASE_DIR / "product_accuracy_reliability_summary.csv"


def load_reliability_map():
    reliability = {}

    if not RELIABILITY_PATH.exists():
        return reliability

    with open(RELIABILITY_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            product_name = row.get("product_name")

            if not product_name:
                continue

            reliability[product_name] = {
                "test_mape": row.get("test_mape"),
                "test_wmape": row.get("test_wmape"),
                "reliability_rating": row.get("reliability_rating", "Review"),
            }

    return reliability


@app.post("/predict/next-day-all")
def predict_next_day_all(request: NextDayAllRequest):
    if not NEXT_DAY_PREDICTIONS_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail="next_day_selected_product_predictions.csv not found in nilmini_ml_api folder",
        )

    reliability_map = load_reliability_map()

    rows = []

    with open(NEXT_DAY_PREDICTIONS_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            rows.append(row)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No next-day predictions found",
        )

    available_dates = sorted(
        set(row["date"] for row in rows if row.get("date"))
    )

    selected_date = request.prediction_date or available_dates[-1]

    selected_rows = [
        row for row in rows if row.get("date") == selected_date
    ]

    # If requested date is not available, use latest available prediction date
    if not selected_rows:
        selected_date = available_dates[-1]
        selected_rows = [
            row for row in rows if row.get("date") == selected_date
        ]

    predictions = []

    for row in selected_rows:
        product_name = row.get("product_name")
        reliability = reliability_map.get(product_name, {})

        predicted_units = row.get("predicted_units", 0)

        predictions.append(
            {
                "productName": product_name,
                "predictedQuantity": int(float(predicted_units)),
                "predictionType": row.get("prediction_type", "unknown"),
                "evaluationLane": row.get("evaluation_lane", "unknown"),
                "reliability": reliability.get("reliability_rating", "Review"),
                "testMape": reliability.get("test_mape"),
                "testWmape": reliability.get("test_wmape"),
            }
        )

    return {
        "success": True,
        "prediction_date": selected_date,
        "weather_type": request.weather_type,
        "holiday": request.holiday,
        "predictions": predictions,
    }