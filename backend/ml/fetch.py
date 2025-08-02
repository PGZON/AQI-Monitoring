import requests
import pandas as pd
import time

base_url = "https://api.openaq.org/v2/measurements"
parameters = ["pm25", "pm10", "co", "no2", "o3", "so2"]
city = "Mumbai"
date_from = "2024-06-01"
date_to = "2024-07-01"

all_data = {}

# Fetch data for each pollutant
for param in parameters:
    print(f"Fetching {param}...")
    records = []

    for page in range(1, 10):  # Increase range if needed (pagination)
        response = requests.get(base_url, params={
            "city": city,
            "parameter": param,
            "date_from": date_from,
            "date_to": date_to,
            "limit": 100,
            "page": page,
            "sort": "asc"
        })

        if response.status_code != 200:
            print(f"Failed to fetch {param}, page {page}")
            break

        json_data = response.json()["results"]
        if not json_data:
            break

        for item in json_data:
            records.append({
                "datetime": item["date"]["utc"],
                param: item["value"]
            })

        time.sleep(1)  # avoid rate limiting

    df_param = pd.DataFrame(records)
    df_param["datetime"] = pd.to_datetime(df_param["datetime"])
    df_param = df_param.groupby("datetime").mean().reset_index()
    all_data[param] = df_param

# Merge all pollutants into one DataFrame
df_merged = all_data[parameters[0]]
for param in parameters[1:]:
    df_merged = pd.merge(df_merged, all_data[param], on="datetime", how="outer")

df_merged = df_merged.sort_values("datetime")
df_merged = df_merged.dropna()  # optional: remove incomplete rows

df_merged.to_csv("aqi_mumbai_openaq.csv", index=False)
print("✅ CSV saved!")
