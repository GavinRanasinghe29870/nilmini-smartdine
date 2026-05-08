import os
import json
import argparse
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://order-service:5006")
ML_API_URL = os.environ.get("ML_API_URL", "http://ml-api:8001")

ALLOW_DEV_FALLBACK_ON_EMPTY = (
    os.environ.get("ALLOW_DEV_FALLBACK_ON_EMPTY", "false").strip().lower()
    == "true"
)

COLOMBO_TZ = timezone(timedelta(hours=5, minutes=30))


def get_colombo_date_string(offset_days=0):
    now = datetime.now(COLOMBO_TZ)
    target = now + timedelta(days=offset_days)
    return target.strftime("%Y-%m-%d")


def post_json(url, payload, timeout=180):
    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def get_json(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_daily_sales_rows(date_string):
    query = urllib.parse.urlencode(
        {
            "startDate": date_string,
            "endDate": date_string,
        }
    )

    url = f"{ORDER_SERVICE_URL}/api/orders/daily-sales?{query}"
    payload = get_json(url, timeout=120)

    if not payload.get("success"):
        raise RuntimeError(f"Order service returned unsuccessful response: {payload}")

    return payload.get("data") or []


def build_product_totals(rows):
    totals = {}

    for row in rows:
        product_name = str(row.get("productName") or "").strip()

        if not product_name:
            continue

        totals[product_name] = totals.get(product_name, 0) + float(
            row.get("totalQuantity") or 0
        )

    return totals


def get_month_period(date_string):
    day = int(str(date_string).split("-")[2])

    if day <= 10:
        return "start"

    if day <= 20:
        return "middle"

    return "end"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=None)
    parser.add_argument("--weather-type", default="Normal")
    parser.add_argument("--holiday", default="No")
    parser.add_argument("--before-holiday-flag", default="No")
    parser.add_argument("--after-holiday-flag", default="No")
    parser.add_argument("--month-period", default=None)
    parser.add_argument("--allow-dev-fallback", action="store_true")

    args = parser.parse_args()

    sales_date = args.date or get_colombo_date_string(-1)

    rows = fetch_daily_sales_rows(sales_date)
    product_totals = build_product_totals(rows)

    allow_dev_fallback = bool(args.allow_dev_fallback or ALLOW_DEV_FALLBACK_ON_EMPTY)

    if not product_totals and not allow_dev_fallback:
        print(
            json.dumps(
                {
                    "success": True,
                    "skipped": True,
                    "message": "No order sales found. Demand dataset update skipped.",
                    "date": sales_date,
                    "orderRows": len(rows),
                    "allowDevFallback": False,
                },
                indent=2,
            )
        )
        return

    update_payload = {
        "date": sales_date,
        "weather_type": args.weather_type,
        "holiday": args.holiday,
        "before_holiday_flag": args.before_holiday_flag,
        "after_holiday_flag": args.after_holiday_flag,
        "month_period": args.month_period or get_month_period(sales_date),
        "product_totals": product_totals,
        "allow_dev_fallback": allow_dev_fallback,
        "dev_fallback_strategy": "recent_median",
    }

    result = post_json(
        f"{ML_API_URL}/data/demand-datasets/upsert-day-sales",
        update_payload,
        timeout=180,
    )

    print(
        json.dumps(
            {
                "success": True,
                "date": sales_date,
                "orderRows": len(rows),
                "productTotalCount": len(product_totals),
                "allowDevFallback": allow_dev_fallback,
                "mlApiResult": result,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()