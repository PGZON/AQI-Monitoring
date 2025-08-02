import requests

response = requests.get("https://api.openaq.org/v2/measurements", params={
    "coordinates": "19.0760,72.8777",  # Mumbai
    "radius": 10000,                  # 10 km range
    "parameter": "pm25",
    "date_from": "2024-06-01",
    "date_to": "2024-07-01",
    "limit": 100,
    "page": 1,
    "sort": "asc"
})

data = response.json()
print(data["results"][0])
