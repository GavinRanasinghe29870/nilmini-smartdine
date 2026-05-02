from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union
from pathlib import Path
import csv
import json
import joblib
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
REGISTRY_PATH = MODELS_DIR / "model_registry.json"
RELIABILITY_PATH = BASE_DIR / "product_accuracy_reliability_summary.csv"
WIDE_HISTORY_CSV_PATH = BASE_DIR / "04_daily_product_counts_wide.csv"

app = FastAPI(
    title="Nilmini SmartDine ML API",
    version="15.0.0",
    description="Dynamic prediction API using 04_daily_product_counts_wide.csv with month_period."
)

YesNoLike = Union[str, int, bool]

META_COLUMNS = {
    "date",
    "day_of_week",
    "month",
    "week_of_year",
    "is_weekend",
    "weather_type",
    "holiday",
    "before_holiday_flag",
    "after_holiday_flag",
    "month_period",
    "is_month_start",
    "is_month_end",
    "day",
    "quarter",
    "week_of_month",
}

class DemandPredictionInput(BaseModel):
    date: str
    weather_type: str
    holiday: YesNoLike
    before_holiday_flag: YesNoLike
    after_holiday_flag: YesNoLike
    month_period: Optional[str] = None

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

class CsvSalesUpdateRequest(BaseModel):
    date: str
    weather_type: Optional[str] = "Normal"
    holiday: Optional[str] = "No"
    before_holiday_flag: Optional[str] = "No"
    after_holiday_flag: Optional[str] = "No"
    month_period: Optional[str] = None
    product_totals: Dict[str, float]

class NextDayAllRequest(BaseModel):
    prediction_date: Optional[str] = None
    weather_type: Optional[str] = "Normal"
    holiday: Optional[str] = "No"
    before_holiday_flag: Optional[str] = "No"
    after_holiday_flag: Optional[str] = "No"
    month_period: Optional[str] = None

if not REGISTRY_PATH.exists():
    raise RuntimeError(f"model_registry.json not found at {REGISTRY_PATH}")

with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
    REGISTRY = json.load(f)

PRODUCT_STRATEGIES = REGISTRY.get("product_strategies", {})

def slugify(name: str) -> str:
    return (
        str(name)
        .strip()
        .lower()
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

    value = str(value or "").strip().lower()

    return "Yes" if value in {"yes", "y", "true", "1", "holiday"} else "No"

def normalize_weather(value):
    value = str(value or "").strip().lower()

    if value in {"rain", "rainy", "showers", "storm", "stormy", "drizzle"}:
        return "Rainy"

    if value in {"cloudy", "overcast", "partly cloudy", "partly-cloudy"}:
        return "Cloudy"

    if value in {"hot", "sunny", "warm", "clear", "very hot"}:
        return "Hot"

    return "Normal"

def get_month_period_from_date(value):
    dt = pd.to_datetime(value, errors="coerce")

    if pd.isna(dt):
        return "middle"

    day = int(dt.day)

    if day <= 10:
        return "start"

    if day <= 20:
        return "middle"

    return "end"

def normalize_month_period(value, fallback_date=None):
    if value is None or str(value).strip() == "":
        if fallback_date is not None:
            return get_month_period_from_date(fallback_date)
        return "middle"

    v = str(value).strip().lower()

    if v in {"start", "beginning", "early"}:
        return "start"

    if v in {"middle", "mid"}:
        return "middle"

    if v in {"end", "late"}:
        return "end"

    if fallback_date is not None:
        return get_month_period_from_date(fallback_date)

    return "middle"

def safe_float(value, default=None):
    if value in [None, "", "null", "None"]:
        return default

    try:
        return float(value)
    except Exception:
        return default

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
                "test_mape": safe_float(row.get("test_mape")),
                "test_wmape": safe_float(row.get("test_wmape")),
                "reliability_rating": row.get("reliability_rating", "Review"),
            }

    return reliability

RELIABILITY_MAP = load_reliability_map()

def get_model_product_names():
    return list(PRODUCT_STRATEGIES.keys())

def build_feature_row(features: DemandPredictionInput):
    dt = pd.to_datetime(features.date)

    return pd.DataFrame(
        [
            {
                "day_of_week": dt.day_name(),
                "is_weekend": "Yes" if dt.dayofweek >= 5 else "No",
                "weather_type": normalize_weather(features.weather_type),
                "holiday": normalize_yes_no(features.holiday),
                "before_holiday_flag": normalize_yes_no(features.before_holiday_flag),
                "after_holiday_flag": normalize_yes_no(features.after_holiday_flag),
                "month_period": normalize_month_period(features.month_period, features.date),
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
            }
        ]
    )

def make_prediction_response(product_name, prediction_type, predicted_units, strategy_info):
    reliability = RELIABILITY_MAP.get(product_name, {})

    return {
        "product_name": product_name,
        "prediction_type": prediction_type,
        "predicted_units": int(max(round(float(predicted_units)), 0)),
        "evaluation_lane": strategy_info.get("evaluation_lane", "unknown"),
        "reliability": reliability.get(
            "reliability_rating",
            strategy_info.get("reliability", "Review")
        ),
        "test_mape": reliability.get("test_mape"),
        "test_wmape": reliability.get("test_wmape"),
    }

def read_wide_history_csv():
    if not WIDE_HISTORY_CSV_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"04_daily_product_counts_wide.csv not found at {WIDE_HISTORY_CSV_PATH}",
        )

    df = pd.read_csv(WIDE_HISTORY_CSV_PATH)

    if "date" not in df.columns:
        raise HTTPException(
            status_code=500,
            detail="04_daily_product_counts_wide.csv must contain a date column",
        )

    if "excel_date_serial" in df.columns:
        df = df.drop(columns=["excel_date_serial"])

    if "payday_window" in df.columns:
        df = df.drop(columns=["payday_window"])

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    df = df.sort_values("date").reset_index(drop=True)

    if "month_period" not in df.columns:
        df["month_period"] = df["date"].apply(get_month_period_from_date)
    else:
        df["month_period"] = df.apply(
            lambda r: normalize_month_period(r.get("month_period"), r.get("date")),
            axis=1
        )

    return df

def save_wide_history_csv(df):
    output_df = df.copy()
    output_df["date"] = pd.to_datetime(output_df["date"]).dt.strftime("%Y-%m-%d")
    output_df.to_csv(WIDE_HISTORY_CSV_PATH, index=False)

def ensure_csv_has_model_product_columns(df):
    for product_name in get_model_product_names():
        if product_name not in df.columns:
            df[product_name] = 0

    return df

def build_daily_metadata(
    date_string,
    weather_type,
    holiday,
    before_holiday_flag,
    after_holiday_flag,
    month_period,
):
    dt = pd.to_datetime(date_string)

    return {
        "date": dt,
        "day_of_week": dt.day_name(),
        "month": int(dt.month),
        "week_of_year": int(dt.isocalendar().week),
        "is_weekend": "Yes" if dt.dayofweek >= 5 else "No",
        "weather_type": normalize_weather(weather_type),
        "holiday": normalize_yes_no(holiday),
        "before_holiday_flag": normalize_yes_no(before_holiday_flag),
        "after_holiday_flag": normalize_yes_no(after_holiday_flag),
        "month_period": normalize_month_period(month_period, date_string),
        "is_month_start": "Yes" if dt.is_month_start else "No",
        "is_month_end": "Yes" if dt.is_month_end else "No",
        "day": int(dt.day),
        "quarter": int(dt.quarter),
        "week_of_month": int(((dt.day - 1) // 7) + 1),
    }

def normalize_product_name(value):
    return str(value or "").strip().lower().replace("  ", " ")

def get_total_for_product(product_totals, product_name):
    direct = product_totals.get(product_name)

    if direct is not None:
        return float(direct)

    normalized_target = normalize_product_name(product_name)

    for key, value in product_totals.items():
        if normalize_product_name(key) == normalized_target:
            return float(value)

    return 0.0

def get_series_for_product(df, product_name, prediction_date):
    prediction_dt = pd.to_datetime(prediction_date)
    history_end = prediction_dt - pd.Timedelta(days=1)

    temp = df[["date", product_name]].copy()
    temp["date"] = pd.to_datetime(temp["date"])
    temp[product_name] = pd.to_numeric(temp[product_name], errors="coerce").fillna(0)

    temp = temp[temp["date"] <= history_end]

    if temp.empty:
        return pd.Series(dtype=float)

    date_range = pd.date_range(
        start=temp["date"].min(),
        end=history_end,
        freq="D",
    )

    series = (
        temp.set_index("date")[product_name]
        .reindex(date_range)
        .fillna(0)
        .astype(float)
    )

    return series

def get_lag_value(series, offset_days):
    if series.empty or len(series) < offset_days:
        return 0.0

    return float(series.iloc[-offset_days])

def get_last_values(series, n):
    if series.empty:
        return []

    return [float(x) for x in series.tail(n).values]

def safe_mean(values):
    return float(np.mean(values)) if values else 0.0

def safe_std(values):
    return float(np.std(values)) if values else 0.0

def safe_median(values):
    return float(np.median(values)) if values else 0.0

def build_features_from_wide_csv(
    df,
    product_name,
    prediction_date,
    weather_type,
    holiday,
    before_holiday_flag,
    after_holiday_flag,
    month_period,
):
    series = get_series_for_product(df, product_name, prediction_date)

    last3 = get_last_values(series, 3)
    last7 = get_last_values(series, 7)
    last14 = get_last_values(series, 14)

    lag_1 = get_lag_value(series, 1)
    lag_7 = get_lag_value(series, 7)
    lag_14 = get_lag_value(series, 14)
    lag_21 = get_lag_value(series, 21)
    lag_28 = get_lag_value(series, 28)

    rolling_mean_3 = safe_mean(last3)
    rolling_mean_7 = safe_mean(last7)
    rolling_mean_14 = safe_mean(last14)

    return DemandPredictionInput(
        date=prediction_date,
        weather_type=weather_type,
        holiday=holiday,
        before_holiday_flag=before_holiday_flag,
        after_holiday_flag=after_holiday_flag,
        month_period=normalize_month_period(month_period, prediction_date),
        lag_1_units=lag_1,
        lag_7_units=lag_7,
        lag_14_units=lag_14,
        lag_21_units=lag_21,
        lag_28_units=lag_28,
        rolling_mean_3=rolling_mean_3,
        rolling_mean_7=rolling_mean_7,
        rolling_mean_14=rolling_mean_14,
        rolling_std_7=safe_std(last7),
        rolling_std_14=safe_std(last14),
        rolling_median_7=safe_median(last7),
        rolling_median_14=safe_median(last14),
        trend_1_7=lag_1 - rolling_mean_7,
        trend_7_14=rolling_mean_7 - rolling_mean_14,
        weighted_recent=(0.5 * lag_1)
        + (0.3 * rolling_mean_3)
        + (0.2 * rolling_mean_7),
    )

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "nilmini-ml-api",
        "history_csv": str(WIDE_HISTORY_CSV_PATH),
    }

@app.get("/models")
def models():
    return REGISTRY

@app.get("/data/wide-csv/status")
def wide_csv_status():
    df = read_wide_history_csv()
    df = ensure_csv_has_model_product_columns(df)

    return {
        "success": True,
        "csv_path": str(WIDE_HISTORY_CSV_PATH),
        "row_count": int(len(df)),
        "first_date": df["date"].min().strftime("%Y-%m-%d") if len(df) else None,
        "last_date": df["date"].max().strftime("%Y-%m-%d") if len(df) else None,
        "model_product_count": len(get_model_product_names()),
        "model_products": get_model_product_names(),
    }

@app.post("/data/wide-csv/upsert-day-sales")
def upsert_day_sales_to_wide_csv(request: CsvSalesUpdateRequest):
    df = read_wide_history_csv()
    df = ensure_csv_has_model_product_columns(df)

    update_date = pd.to_datetime(request.date)
    update_date_string = update_date.strftime("%Y-%m-%d")

    metadata = build_daily_metadata(
        request.date,
        request.weather_type,
        request.holiday,
        request.before_holiday_flag,
        request.after_holiday_flag,
        request.month_period,
    )

    product_columns = get_model_product_names()
    new_row = {}

    for col in df.columns:
        if col in metadata:
            new_row[col] = metadata[col]
        elif col in product_columns:
            new_row[col] = get_total_for_product(request.product_totals, col)
        else:
            new_row[col] = 0

    existing_mask = df["date"].dt.strftime("%Y-%m-%d") == update_date_string

    if existing_mask.any():
        for col, value in new_row.items():
            df.loc[existing_mask, col] = value
        action = "updated"
    else:
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        action = "inserted"

    df = df.sort_values("date").reset_index(drop=True)
    save_wide_history_csv(df)

    return {
        "success": True,
        "message": f"Daily sales row {action} for {update_date_string}",
        "date": update_date_string,
        "product_totals": request.product_totals,
    }

@app.post("/predict/demand/{product_name}")
def predict_demand(product_name: str, features: DemandPredictionInput):
    strategy_info = PRODUCT_STRATEGIES.get(product_name)

    if strategy_info is None:
        raise HTTPException(status_code=404, detail=f"Unknown product: {product_name}")

    strategy = strategy_info.get("selected_strategy", "seasonal_naive")
    feature_columns = strategy_info.get("feature_columns", [])

    if strategy == "seasonal_naive":
        return make_prediction_response(
            product_name,
            "seasonal_naive",
            features.lag_7_units,
            strategy_info,
        )

    if strategy == "rolling_mean_7":
        return make_prediction_response(
            product_name,
            "rolling_mean_7",
            features.rolling_mean_7,
            strategy_info,
        )

    if strategy == "rolling_mean_14":
        return make_prediction_response(
            product_name,
            "rolling_mean_14",
            features.rolling_mean_14,
            strategy_info,
        )

    model_path = MODELS_DIR / f"demand_model_{slugify(product_name)}.joblib"

    if not model_path.exists():
        return make_prediction_response(
            product_name,
            "seasonal_naive_missing_model_file",
            features.lag_7_units,
            strategy_info,
        )

    model = joblib.load(model_path)
    feature_row = build_feature_row(features)

    try:
        X = feature_row[feature_columns]
    except KeyError as error:
        raise HTTPException(
            status_code=500,
            detail=f"Missing model feature columns for {product_name}: {str(error)}",
        )

    model_pred = max(float(np.expm1(model.predict(X)[0])), 0)

    if strategy == "blend_catboost_rm7":
        pred = (0.7 * model_pred) + (0.3 * float(features.rolling_mean_7))
    elif strategy == "blend_catboost_rm14":
        pred = (0.5 * model_pred) + (0.5 * float(features.rolling_mean_14))
    else:
        pred = model_pred

    return make_prediction_response(product_name, strategy, pred, strategy_info)

@app.post("/predict/demand-batch")
def predict_demand_batch(request: DemandBatchRequest):
    if not request.items:
        raise HTTPException(status_code=400, detail="No prediction items provided")

    results = []

    for item in request.items:
        results.append(predict_demand(item.product_name, item.features))

    return {
        "success": True,
        "source": "provided_features",
        "results": results,
    }

@app.post("/predict/next-day-all")
def predict_next_day_all(request: NextDayAllRequest):
    df = read_wide_history_csv()
    df = ensure_csv_has_model_product_columns(df)

    if request.prediction_date:
        prediction_date = request.prediction_date
    else:
        latest_date = df["date"].max()
        prediction_date = (latest_date + pd.Timedelta(days=1)).strftime("%Y-%m-%d")

    prediction_month_period = normalize_month_period(request.month_period, prediction_date)

    predictions = []

    for product_name in get_model_product_names():
        features = build_features_from_wide_csv(
            df=df,
            product_name=product_name,
            prediction_date=prediction_date,
            weather_type=request.weather_type or "Normal",
            holiday=request.holiday or "No",
            before_holiday_flag=request.before_holiday_flag or "No",
            after_holiday_flag=request.after_holiday_flag or "No",
            month_period=prediction_month_period,
        )

        result = predict_demand(product_name, features)

        predictions.append(
            {
                "productName": result["product_name"],
                "predictedQuantity": result["predicted_units"],
                "predictionType": result["prediction_type"],
                "evaluationLane": result.get("evaluation_lane", "unknown"),
                "reliability": result.get("reliability", "Review"),
                "testMape": result.get("test_mape"),
                "testWmape": result.get("test_wmape"),
            }
        )

    return {
        "success": True,
        "source": "wide_csv_dynamic_features",
        "history_csv": str(WIDE_HISTORY_CSV_PATH),
        "prediction_date": prediction_date,
        "weather_type": request.weather_type,
        "holiday": request.holiday,
        "month_period": prediction_month_period,
        "predictions": predictions,
    }