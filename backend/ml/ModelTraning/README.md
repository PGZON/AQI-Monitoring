# Location-Based AQI Data Collection & Preprocessing

This directory contains a complete pipeline for collecting historical AQI and pollutant data from the OpenAQ API based on geographic coordinates and training an LSTM model for location-aware AQI forecasting.

## 🎯 Overview

The pipeline consists of three main components:

1. **Data Collection** (`data_collector.py`) - Fetches data from OpenAQ API v3
2. **Data Preprocessing** (`data_preprocessor.py`) - Cleans and prepares data for ML
3. **LSTM Model** (`lstm_model.py`) - Trains location-aware forecasting model

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd backend/ml/apiML
pip install -r requirements.txt
```

### 2. Configure API Key

Sign up at [OpenAQ.org](https://openaq.org) and get your API key, then:

```bash
# Option 1: Environment variable
export OPENAQ_API_KEY="your-api-key-here"

# Option 2: Edit config.py
# Update OPENAQ_API_KEY in config.py
```

### 3. Run Complete Pipeline

```bash
python main.py
```

Select option 4 to run the complete pipeline, or run individual steps:

## 📊 Step-by-Step Usage

### Step 1: Data Collection

```bash
python data_collector.py
```

**What it does:**
- Queries OpenAQ API for 16 global locations
- Collects PM2.5, PM10, NO₂, CO, O₃, SO₂ data
- Fetches last 90 days of hourly measurements
- Saves raw data to `data/raw_openaq_data.csv`

**Output:** ~50,000-100,000 data points (varies by location availability)

### Step 2: Data Preprocessing

```bash
python data_preprocessor.py
```

**What it does:**
- Cleans and validates raw data
- Calculates AQI from pollutant concentrations
- Adds temporal features (hour, day, month)
- Creates LSTM sequences (24-hour lookback)
- Scales features for neural network training
- Saves processed data to `data/processed_aqi_data.csv`

**Output:** Time-series sequences ready for LSTM training

### Step 3: Model Training

```bash
python lstm_model.py
```

**What it does:**
- Loads preprocessed sequences
- Trains deep LSTM neural network
- Evaluates model performance
- Saves trained model to `models/location_aware_lstm_model.h5`

**Architecture:**
- 3 LSTM layers (128, 96, 64 units)
- Batch normalization + dropout
- Dense output layer
- Adam optimizer with learning rate scheduling

## 📁 File Structure

```
apiML/
├── config.py              # Configuration settings
├── data_collector.py      # OpenAQ API data collection
├── data_preprocessor.py   # Data cleaning & feature engineering
├── lstm_model.py          # LSTM model training & evaluation
├── main.py               # Interactive pipeline execution
├── requirements.txt      # Python dependencies
├── README.md            # This file
├── data/                # Generated data files
│   ├── raw_openaq_data.csv
│   ├── processed_aqi_data.csv
│   ├── lstm_sequences.npz
│   └── feature_info.json
└── models/              # Trained models
    ├── location_aware_lstm_model.h5
    ├── location_aware_lstm_model_metadata.json
    ├── feature_scaler.joblib
    └── training_history.png
```

## 🗺️ Target Locations

The pipeline collects data from 16 global locations:

**Indian Cities:**
- Mumbai, Delhi, Bangalore, Chennai
- Kolkata, Pune, Ahmedabad, Hyderabad

**International Cities:**
- New York, London, Tokyo, San Francisco
- Beijing, Shanghai, Moscow, Paris

## 🧪 Features Used for Prediction

### Pollutant Features (Primary)
- **PM2.5** - Fine particulate matter
- **PM10** - Coarse particulate matter  
- **NO₂** - Nitrogen dioxide
- **CO** - Carbon monoxide
- **O₃** - Ozone
- **SO₂** - Sulfur dioxide

### Temporal Features
- **Hour** (sin/cos encoded)
- **Month** (sin/cos encoded)
- **Day of year** (sin/cos encoded)
- **Is weekend** (binary)

### Location Features
- **Latitude** - Geographic coordinate
- **Longitude** - Geographic coordinate

## 📊 Model Performance

Expected performance metrics:
- **MAE**: 15-25 AQI units
- **R² Score**: 0.75-0.85
- **Accuracy (±20 AQI)**: 70-80%

## 🔧 Configuration Options

Edit `config.py` to customize:

```python
# API settings
OPENAQ_API_KEY = "your-key"
REQUEST_DELAY = 1.2  # seconds between requests

# Data collection
SEARCH_RADIUS = 10000  # 10km around each point
DATE_FROM = datetime.now() - timedelta(days=90)  # Last 90 days

# Model settings
SEQUENCE_LENGTH = 24  # 24-hour lookback
TRAIN_TEST_SPLIT = 0.8

# Add custom locations
TARGET_LOCATIONS.append((lat, lon, "City_Name"))
```

## 🚨 Troubleshooting

### API Key Issues
```bash
# Error: "API key not configured"
export OPENAQ_API_KEY="your-actual-key"
```

### Insufficient Data
```bash
# Error: "No data collected"
# Check if locations have monitoring stations:
python -c "from data_collector import *; collector = OpenAQDataCollector(); print(collector.get_location_info(19.0760, 72.8777))"
```

### Memory Issues
```bash
# Reduce data size in config.py:
DATE_FROM = datetime.now() - timedelta(days=30)  # Reduce from 90 to 30 days
```

### Training Fails
```bash
# Check TensorFlow GPU setup:
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

## 🔮 Making Predictions

After training, use the model for forecasting:

```python
from lstm_model import LocationAwareLSTMModel

# Load trained model
model = LocationAwareLSTMModel()
model.load_model()

# Predict AQI for a location (requires 24 hours of recent data)
predictions = model.predict_future_aqi(location_data, lat=19.0760, lon=72.8777, steps_ahead=24)
print(f"Next 24 hours AQI: {predictions}")
```

## 📈 Data Flow

```
OpenAQ API → Raw Data → Cleaned Data → Feature Engineering → 
LSTM Sequences → Model Training → AQI Predictions
```

## 🤝 Contributing

To add new features:

1. **New Pollutants**: Add to `POLLUTANT_PARAMETERS` in `config.py`
2. **New Locations**: Add to `TARGET_LOCATIONS` in `config.py`
3. **New Features**: Modify `add_temporal_features()` in `data_preprocessor.py`
4. **Model Architecture**: Edit `create_model()` in `lstm_model.py`

## 📝 License

This project is part of the AQI Monitoring System. Use responsibly and respect OpenAQ API rate limits.

---

**Happy Forecasting! 🌍📊**
