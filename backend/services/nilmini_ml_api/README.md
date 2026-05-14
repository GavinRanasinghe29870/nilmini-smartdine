# Nilmini SmartDine ML API

This service is used to predict the next-day product demand for Nilmini SmartDine. It predicts how many units of each product may be needed for the next day by using the saved demand history datasets and trained model files.

The prediction process does not directly read order data from MongoDB. Order data is used only during the dataset update process. After the datasets are updated, the prediction API reads those datasets and generates the next-day product quantity predictions.

## Main datasets

- `daily_product_sales_history_wide.csv`  
  Stores daily product sales totals in wide format. This file is mainly used when generating live prediction features.

- `product_demand_forecast_training_dataset.csv`  
  Stores the product demand training data in long format. This file is useful for model training and retraining.

- `product_accuracy_reliability_summary.csv`  
  Stores product-wise accuracy and reliability details.

- `models/model_registry.json`  
  Stores the selected prediction strategy and model details for each product.

## Main flow

End of day orders are collected from database
Daily product totals are calculated
Demand datasets are updated
ML API reads the latest datasets
Next-day product quantities are predicted
AI Menu Service uses the prediction results