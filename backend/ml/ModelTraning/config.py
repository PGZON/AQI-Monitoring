"""
Configuration file for OpenAQ API data collection
"""
import os
from datetime import datetime, timedelta

# OpenAQ API Configuration
OPENAQ_BASE_URL = "https://api.openaq.org/v3"
OPENAQ_API_KEY = os.getenv('OPENAQ_API_KEY', '6244e0e1d148d1855f1a86f606985a0011759cd4e3b251e038788bab0d76a4d8')  # Add your API key

# Request headers
HEADERS = {
    'X-API-Key': OPENAQ_API_KEY,
    'Content-Type': 'application/json'
}

# Geographic locations for data collection (lat, lon, name)
TARGET_LOCATIONS = [
    # Major Indian cities
    # (19.0760, 72.8777, "Mumbai"),
    # (28.6139, 77.2090, "Delhi"),
    # (12.9716, 77.5946, "Bangalore"),
    # (13.0827, 80.2707, "Chennai"),
    # (22.5726, 88.3639, "Kolkata"),
    # (18.5204, 73.8567, "Pune"),
    # (23.0225, 72.5714, "Ahmedabad"),
    # (17.3850, 78.4867, "Hyderabad"),
    # (16.8304, 74.6200, "Ichalkaranji"),
    (16.7054, 74.2439, "Kolhapur"),
    (16.8312, 74.5604, "Sangli"),
    # (17.3688, 73.9937, "Satara"),
    # (16.5886, 74.3085, "Kagal"),
    # (16.7070, 74.1970, "Karvir"),
    # (16.7787,74.5544,"Jaysingpur"),
    # (16.7054, 74.2439, "Gaganbavada"),
    # (16.7060, 74.2430, "Hatkanangale"),
    # (16.2264,74.3500,"Gadhinglaj"),
    # (15.9473,74.1886,"Chandgad"),
    # (16.4151,73.9977,"Radhanagari"),
    # (16.9123,73.9448,"Shahuwadi"),
    # (15.8497, 74.4976, "Belgaum"),
    # (15.2993, 74.1240, "Hubli"),
    # (15.3173, 75.7139, "Dharwad"),
    # (15.8497, 74.4976, "Bijapur"),
    # (16.8304, 74.6200, "Bagalkot"),
    # (16.3068, 75.1212, "Gadag"),
    # (16.8292, 75.1235, "Hampi"),

    # International cities for better model generalization
    # (40.7128, -74.0060, "New_York"),
    # (51.5074, -0.1278, "London"),
    # (35.6762, 139.6503, "Tokyo"),
    # (37.7749, -122.4194, "San_Francisco"),
    # (39.9042, 116.4074, "Beijing"),
    # (31.2304, 121.4737, "Shanghai"),
    # (55.7558, 37.6176, "Moscow"),
    # (48.8566, 2.3522, "Paris")
]

# Data collection parameters
SEARCH_RADIUS = 10000  # 10km radius around each point
DATE_FROM = datetime.now() - timedelta(days=10)  # Last 10 days (default)
DATE_TO = datetime.now()

# Pollutant parameters to collect
POLLUTANT_PARAMETERS = [
    'pm25',    # PM2.5
    'pm10',    # PM10
    'no2',     # Nitrogen Dioxide
    'co',      # Carbon Monoxide
    'o3',      # Ozone
    'so2',     # Sulfur Dioxide
    'bc',      # Black Carbon (optional)
    'pm1'      # PM1 (optional)
]

# Core parameters for LSTM model
CORE_PARAMETERS = ['pm25', 'pm10', 'no2', 'co', 'o3', 'so2']

# API request settings
MAX_REQUESTS_PER_MINUTE = 50
REQUEST_DELAY = 1.2  # seconds between requests
MAX_RETRIES = 3
TIMEOUT = 30

# Data processing settings
MIN_DATA_POINTS_PER_LOCATION = 100
SEQUENCE_LENGTH = 24  # 24 hours lookback for LSTM
TRAIN_TEST_SPLIT = 0.8

# File paths
DATA_DIR = "data"
RAW_DATA_FILE = f"{DATA_DIR}/raw_openaq_data.csv"
PROCESSED_DATA_FILE = f"{DATA_DIR}/processed_aqi_data.csv"
SEQUENCES_FILE = f"{DATA_DIR}/lstm_sequences.npz"
MODEL_DIR = "models"

# Quality control thresholds
MAX_AQI_VALUE = 500
MIN_AQI_VALUE = 0
MAX_MISSING_VALUES_RATIO = 0.3  # 30% missing values threshold

print(f"🔑 OpenAQ API Key configured: {'✅ Yes' if OPENAQ_API_KEY != 'your-api-key-here' else '❌ Please set your API key'}")
