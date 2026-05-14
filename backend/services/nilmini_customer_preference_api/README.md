# Nilmini SmartDine Customer Preference API

This service is used to predict the most likely next-day visiting customer group and identify the food items preferred by that group. The AI Menu Service uses this result to make small quantity adjustments to the predicted menu.

This service does not predict product quantities. Product quantities come from the main demand prediction service. This service only supports customer preference-based menu adjustment.

## Main datasets

- `customer_group_daily_visit_training_dataset.csv`  
  Stores daily customer group counts, order details, time-based group counts, and category-level sales data.

- `customer_group_product_preference_training_dataset.csv`  
  Stores product preference data for each customer age group.

- `customer_group_product_preference_summary_report.csv`  
  Stores the calculated product preference scores for each customer group.

- `models/customer_group_ranker.joblib`  
  The trained model used to predict the most likely next-day customer group.

- `models/customer_group_preference_rankings.json`  
  Stores the ranked preferred products for each customer group.

## Main flow

Order data is collected
Customer group datasets are updated
Product preference rankings are rebuilt
Customer group prediction is generated
Preferred products are returned
AI Menu Service adjusts matching menu items