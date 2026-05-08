import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

PREFERENCE_DATASET_PATH = DATA_DIR / "customer_group_product_preference_dataset.csv"
PREFERENCE_RANKINGS_PATH = MODELS_DIR / "customer_group_preference_rankings.json"
PREFERENCE_SUMMARY_PATH = OUTPUT_DIR / "customer_group_product_preference_summary.csv"

RESTRICTED_SCHOOL_CHILDREN_PRODUCTS = {
    "cigarette",
    "cigarettes",
    "beedi",
    "bulath vita",
    "bulath wita",
}


def normalize_product_key(value):
    return str(value or "").strip().lower().replace("_", " ")


def clean_product_name_from_column(col):
    name = str(col)

    for suffix in ["_units", "_unit", "_qty", "_quantity"]:
        if name.lower().endswith(suffix):
            name = name[: -len(suffix)]

    name = name.replace("_", " ").strip()
    return " ".join(word.capitalize() for word in name.split())


def atomic_write_json(data, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    temp_path.replace(path)


def atomic_write_csv(df, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    df.to_csv(temp_path, index=False)
    temp_path.replace(path)


def prepare_preference_dataset(preference_df):
    df = preference_df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    age_col = None

    for candidate in [
        "customer_age_group",
        "age_group",
        "customerGroup",
        "customer_group",
    ]:
        if candidate in df.columns:
            age_col = candidate
            break

    if age_col is None:
        raise ValueError("Preference dataset must have customer_age_group or age_group column.")

    df[age_col] = df[age_col].astype(str).str.strip()

    non_product_cols = {
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
    }

    product_cols = []

    for col in df.columns:
        if col in non_product_cols:
            continue

        converted = pd.to_numeric(df[col], errors="coerce")

        if converted.notna().sum() > 0:
            df[col] = converted.fillna(0)
            product_cols.append(col)

    if not product_cols:
        raise ValueError("No numeric product columns found in preference dataset.")

    return df, age_col, product_cols


def build_preference_summary(preference_df, age_col, product_cols):
    rows = []

    overall_product_units = {
        clean_product_name_from_column(col): float(preference_df[col].sum())
        for col in product_cols
    }

    overall_total_units = sum(overall_product_units.values())

    for age_group in sorted(preference_df[age_col].dropna().unique()):
        group_df = preference_df[preference_df[age_col] == age_group].copy()
        group_total_units = float(group_df[product_cols].sum().sum())

        for col in product_cols:
            product_name = clean_product_name_from_column(col)
            total_units_by_group = float(group_df[col].sum())

            group_product_share = (
                total_units_by_group / group_total_units
                if group_total_units > 0
                else 0
            )

            overall_product_share = (
                overall_product_units.get(product_name, 0) / overall_total_units
                if overall_total_units > 0
                else 0
            )

            preference_score = (
                group_product_share / overall_product_share
                if overall_product_share > 0
                else 0
            )

            if (
                str(age_group).strip().lower() == "school children"
                and normalize_product_key(product_name) in RESTRICTED_SCHOOL_CHILDREN_PRODUCTS
            ):
                total_units_by_group = 0
                group_product_share = 0
                preference_score = 0

            rows.append(
                {
                    "customer_age_group": age_group,
                    "product_name": product_name,
                    "total_units_by_group": round(total_units_by_group, 4),
                    "group_product_share": round(group_product_share, 6),
                    "overall_product_share": round(overall_product_share, 6),
                    "preference_score": round(float(preference_score), 6),
                }
            )

    summary_df = pd.DataFrame(rows)

    summary_df = summary_df.sort_values(
        by=["customer_age_group", "preference_score", "total_units_by_group"],
        ascending=[True, False, False],
    ).reset_index(drop=True)

    return summary_df


def build_preference_rankings(summary_df, top_n=8):
    rankings = {}

    for age_group in sorted(summary_df["customer_age_group"].unique()):
        group_df = summary_df[
            (summary_df["customer_age_group"] == age_group)
            & (summary_df["total_units_by_group"] > 0)
        ].copy()

        group_df = group_df.sort_values(
            by=["preference_score", "total_units_by_group"],
            ascending=[False, False],
        ).head(top_n)

        rankings[age_group] = group_df.to_dict(orient="records")

    return rankings


def main():
    if not PREFERENCE_DATASET_PATH.exists():
        raise FileNotFoundError(f"Preference dataset not found: {PREFERENCE_DATASET_PATH}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    preference_df = pd.read_csv(PREFERENCE_DATASET_PATH)
    preference_df, age_col, product_cols = prepare_preference_dataset(preference_df)

    summary_df = build_preference_summary(preference_df, age_col, product_cols)
    rankings = build_preference_rankings(summary_df, top_n=8)

    atomic_write_csv(summary_df, PREFERENCE_SUMMARY_PATH)
    atomic_write_json(rankings, PREFERENCE_RANKINGS_PATH)

    print(
        json.dumps(
            {
                "success": True,
                "preference_dataset": str(PREFERENCE_DATASET_PATH),
                "preference_rankings": str(PREFERENCE_RANKINGS_PATH),
                "age_groups": sorted(rankings.keys()),
                "product_columns": len(product_cols),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()