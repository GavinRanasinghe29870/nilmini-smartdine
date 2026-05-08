import os
import json
import argparse
import urllib.parse
import urllib.request
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import defaultdict, Counter

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

DAILY_DATASET_PATH = DATA_DIR / "customer_group_daily_training_dataset.csv"
PREFERENCE_DATASET_PATH = DATA_DIR / "customer_group_product_preference_dataset.csv"

ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://order-service:5006")

COLOMBO_TZ = timezone(timedelta(hours=5, minutes=30))

AGE_GROUP_COLS = {
    "School Children": "school_children_groups",
    "Youngers": "youngers_groups",
    "Younger Adults": "younger_adults_groups",
    "Elders": "elders_groups",
}

DAILY_COLUMNS = [
    "date",
    "day_of_week",
    "month",
    "week_of_year",
    "is_weekend",
    "month_period",
    "weather_type",
    "holiday",
    "total_orders",
    "total_units_sold",
    "total_customer_groups",
    "avg_group_size",
    "school_children_groups",
    "youngers_groups",
    "younger_adults_groups",
    "elders_groups",
    "morning_groups",
    "afternoon_groups",
    "evening_groups",
    "hot_beverage_units",
    "cold_beverage_units",
    "bakery_units",
    "short_eats_units",
    "food_meal_units",
    "traditional_food_units",
    "dairy_units",
    "other_units",
]

RESTRICTED_SCHOOL_CHILDREN_PRODUCTS = {
    "cigarette",
    "cigarettes",
    "beedi",
    "bulath vita",
    "bulath wita",
}


def normalize_text(value):
    return str(value or "").strip()


def normalize_key(value):
    return normalize_text(value).lower().replace("_", " ")


def normalize_age_group(value):
    text = normalize_key(value)

    if text in {"school children", "school child", "children", "child", "student", "students"}:
        return "School Children"

    if text in {"youngers", "younger", "youth", "teen", "teens"}:
        return "Youngers"

    if text in {"younger adults", "younger adult", "adult", "adults", "young adult", "young adults"}:
        return "Younger Adults"

    if text in {"elders", "elder", "senior", "seniors", "old", "older adults"}:
        return "Elders"

    return "Younger Adults"


def normalize_weather(value):
    text = normalize_key(value)

    if text in {"rain", "rainy", "showers", "storm", "stormy", "drizzle"}:
        return "Rainy"

    if text in {"cloudy", "overcast", "partly cloudy"}:
        return "Cloudy"

    if text in {"hot", "sunny", "warm", "clear", "very hot"}:
        return "Hot"

    return "Normal"


def normalize_holiday(day_type):
    text = normalize_key(day_type)
    return "Yes" if text == "holiday" else "No"


def get_month_period(date_string):
    day = int(str(date_string).split("-")[2])

    if day <= 10:
        return "start"

    if day <= 20:
        return "middle"

    return "end"


def to_colombo_datetime(value):
    if value is None:
        return datetime.now(COLOMBO_TZ)

    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(COLOMBO_TZ)


def get_time_group_col(dt):
    if dt.hour < 12:
        return "morning_groups"

    if dt.hour < 17:
        return "afternoon_groups"

    return "evening_groups"


def infer_category_column(category_name, product_name):
    category = normalize_key(category_name)
    product = normalize_key(product_name)

    if "hot" in category or "tea" in category or "coffee" in category:
        return "hot_beverage_units"

    if "cold" in category or "drink" in category or "beverage" in category:
        if product in {"yogurt", "milk packet"}:
            return "dairy_units"
        return "cold_beverage_units"

    if "dairy" in category or product in {"yogurt", "milk packet"}:
        return "dairy_units"

    if "short" in category or "short eats" in category:
        return "short_eats_units"

    if "traditional" in category:
        return "traditional_food_units"

    if "meal" in category or "curry" in category:
        return "food_meal_units"

    if "bakery" in category or "bun" in category or "bread" in category:
        return "bakery_units"

    hot_beverages = {
        "tea",
        "plain tea",
        "milk plain tea",
        "kahata",
        "milo tea",
        "coffee",
    }

    cold_beverages = {
        "soft drinks",
        "soft drinks cup",
        "watter bottle",
        "water bottle",
    }

    bakery = {
        "bread",
        "roast bread",
        "flat bread",
        "fish bun",
        "egg bun",
        "cream bun",
        "jam bun",
        "buns",
    }

    short_eats = {
        "rolls",
        "egg rotti",
        "vegitable roti",
        "vegetable roti",
        "samosa",
        "pancake",
        "rock cake",
        "bite packet",
    }

    traditional_food = {
        "ulundu wade",
        "wade",
        "hoppers",
        "string hoppers",
        "roti",
        "lavariya",
        "halapa",
    }

    food_meal = {
        "breakfast",
        "chicken curry",
        "dal curry",
        "boil egg",
    }

    if product in hot_beverages:
        return "hot_beverage_units"

    if product in cold_beverages:
        return "cold_beverage_units"

    if product in bakery:
        return "bakery_units"

    if product in short_eats:
        return "short_eats_units"

    if product in traditional_food:
        return "traditional_food_units"

    if product in food_meal:
        return "food_meal_units"

    return "other_units"


def read_existing_csv(path, columns=None):
    if not path.exists():
        return pd.DataFrame(columns=columns or [])

    df = pd.read_csv(path)

    if columns:
        for col in columns:
            if col not in df.columns:
                df[col] = 0

        df = df[columns + [c for c in df.columns if c not in columns]]

    return df


def atomic_write_csv(df, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    df.to_csv(temp_path, index=False)
    temp_path.replace(path)


def fetch_orders_from_order_service(start_date=None, end_date=None):
    query = {
        "limit": "100000",
    }

    if start_date:
        query["startDate"] = start_date

    if end_date:
        query["endDate"] = end_date

    url = f"{ORDER_SERVICE_URL}/api/orders?{urllib.parse.urlencode(query)}"

    with urllib.request.urlopen(url, timeout=120) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not payload.get("success"):
        raise RuntimeError(f"Order service returned unsuccessful response: {payload}")

    return payload.get("data") or []


def build_aggregates(orders):
    daily = {}
    preference = defaultdict(lambda: defaultdict(float))
    weather_votes = defaultdict(Counter)
    holiday_votes = defaultdict(Counter)

    for order in orders:
        placed_at = to_colombo_datetime(order.get("placedAt") or order.get("createdAt"))
        date_string = placed_at.strftime("%Y-%m-%d")

        if date_string not in daily:
            daily[date_string] = {
                "date": date_string,
                "day_of_week": placed_at.strftime("%A"),
                "month": int(placed_at.month),
                "week_of_year": int(placed_at.isocalendar().week),
                "is_weekend": "Yes" if placed_at.weekday() >= 5 else "No",
                "month_period": get_month_period(date_string),
                "weather_type": "Normal",
                "holiday": "No",
                "total_orders": 0,
                "total_units_sold": 0,
                "total_customer_groups": 0,
                "avg_group_size": 0,
                "school_children_groups": 0,
                "youngers_groups": 0,
                "younger_adults_groups": 0,
                "elders_groups": 0,
                "morning_groups": 0,
                "afternoon_groups": 0,
                "evening_groups": 0,
                "hot_beverage_units": 0,
                "cold_beverage_units": 0,
                "bakery_units": 0,
                "short_eats_units": 0,
                "food_meal_units": 0,
                "traditional_food_units": 0,
                "dairy_units": 0,
                "other_units": 0,
            }

        row = daily[date_string]

        age_group = normalize_age_group(order.get("ageGroup"))
        group_size = int(float(order.get("groupSize") or 1))
        group_size = max(group_size, 1)

        row["total_orders"] += 1
        row["total_customer_groups"] += group_size
        row[AGE_GROUP_COLS[age_group]] += group_size
        row[get_time_group_col(placed_at)] += group_size

        weather_votes[date_string][normalize_weather(order.get("weather"))] += 1
        holiday_votes[date_string][normalize_holiday(order.get("dayType"))] += 1

        for item in order.get("items") or []:
            product_name = normalize_text(item.get("productName"))

            if not product_name:
                continue

            quantity = float(item.get("quantity") or 0)

            if quantity <= 0:
                continue

            category_col = infer_category_column(item.get("categoryName"), product_name)

            row["total_units_sold"] += quantity
            row[category_col] += quantity

            if age_group == "School Children" and normalize_key(product_name) in RESTRICTED_SCHOOL_CHILDREN_PRODUCTS:
                continue

            preference[(date_string, age_group)][product_name] += quantity

    for date_string, row in daily.items():
        if row["total_orders"] > 0:
            row["avg_group_size"] = round(row["total_customer_groups"] / row["total_orders"], 4)

        if weather_votes[date_string]:
            row["weather_type"] = weather_votes[date_string].most_common(1)[0][0]

        if holiday_votes[date_string]:
            row["holiday"] = holiday_votes[date_string].most_common(1)[0][0]

    return daily, preference


def upsert_daily_dataset(daily_map):
    existing_df = read_existing_csv(DAILY_DATASET_PATH, DAILY_COLUMNS)

    if not existing_df.empty:
        existing_df["date"] = existing_df["date"].astype(str)

    generated_df = pd.DataFrame(list(daily_map.values()))

    for col in DAILY_COLUMNS:
        if col not in generated_df.columns:
            generated_df[col] = 0

    generated_df = generated_df[DAILY_COLUMNS]

    if existing_df.empty:
        final_df = generated_df.copy()
    else:
        existing_df = existing_df[
            ~existing_df["date"].astype(str).isin(set(generated_df["date"]))
        ]
        final_df = pd.concat([existing_df, generated_df], ignore_index=True)

    final_df = final_df.sort_values("date").reset_index(drop=True)
    atomic_write_csv(final_df, DAILY_DATASET_PATH)

    return final_df


def upsert_preference_dataset(preference_map):
    existing_df = read_existing_csv(PREFERENCE_DATASET_PATH)

    product_columns = set()

    for product_map in preference_map.values():
        product_columns.update(product_map.keys())

    if not existing_df.empty:
        for col in existing_df.columns:
            if col not in {
                "date",
                "customer_age_group",
                "age_group",
                "customerGroup",
                "customer_group",
                "day_of_week",
                "month",
                "week_of_year",
                "is_weekend",
                "month_period",
                "weather_type",
                "holiday",
            }:
                product_columns.add(col)

    product_columns = sorted(product_columns)

    generated_rows = []

    for (date_string, age_group), product_map in preference_map.items():
        dt = datetime.strptime(date_string, "%Y-%m-%d")

        row = {
            "date": date_string,
            "customer_age_group": age_group,
            "day_of_week": dt.strftime("%A"),
            "month": int(dt.month),
            "week_of_year": int(dt.isocalendar().week),
            "is_weekend": "Yes" if dt.weekday() >= 5 else "No",
            "month_period": get_month_period(date_string),
        }

        for col in product_columns:
            row[col] = float(product_map.get(col, 0))

        generated_rows.append(row)

    generated_df = pd.DataFrame(generated_rows)

    base_cols = [
        "date",
        "customer_age_group",
        "day_of_week",
        "month",
        "week_of_year",
        "is_weekend",
        "month_period",
    ]

    for col in base_cols + product_columns:
        if col not in generated_df.columns:
            generated_df[col] = 0

    generated_df = generated_df[base_cols + product_columns]

    if existing_df.empty:
        final_df = generated_df.copy()
    else:
        if "customer_age_group" not in existing_df.columns:
            for candidate in ["age_group", "customerGroup", "customer_group"]:
                if candidate in existing_df.columns:
                    existing_df["customer_age_group"] = existing_df[candidate]
                    break

        for col in base_cols + product_columns:
            if col not in existing_df.columns:
                existing_df[col] = 0

        replacement_keys = set(
            zip(
                generated_df["date"].astype(str),
                generated_df["customer_age_group"].astype(str),
            )
        )

        keep_mask = [
            (str(row["date"]), str(row["customer_age_group"])) not in replacement_keys
            for _, row in existing_df.iterrows()
        ]

        existing_df = existing_df.loc[keep_mask, base_cols + product_columns]
        final_df = pd.concat([existing_df, generated_df], ignore_index=True)

    final_df = final_df.sort_values(["date", "customer_age_group"]).reset_index(drop=True)
    atomic_write_csv(final_df, PREFERENCE_DATASET_PATH)

    return final_df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", default=None)
    parser.add_argument("--end-date", default=None)
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    orders = fetch_orders_from_order_service(args.start_date, args.end_date)

    if not orders:
        print(
            json.dumps(
                {
                    "success": True,
                    "skipped": True,
                    "message": "No orders found. Dataset update skipped.",
                    "start_date": args.start_date,
                    "end_date": args.end_date,
                },
                indent=2,
            )
        )
        return

    daily_map, preference_map = build_aggregates(orders)

    daily_df = upsert_daily_dataset(daily_map)
    preference_df = upsert_preference_dataset(preference_map)

    print(
        json.dumps(
            {
                "success": True,
                "orders_read": len(orders),
                "daily_dates_updated": len(daily_map),
                "daily_dataset_rows": len(daily_df),
                "preference_dataset_rows": len(preference_df),
                "daily_dataset": str(DAILY_DATASET_PATH),
                "preference_dataset": str(PREFERENCE_DATASET_PATH),
                "start_date": args.start_date,
                "end_date": args.end_date,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()