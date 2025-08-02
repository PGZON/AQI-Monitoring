"""
AQI ML Backend Service
Flask API for AQI predictions using trained LSTM model
"""
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
import logging
import requests
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class AQIPredictor:
    """AQI Prediction service using trained LSTM model"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_columns = [
            'pm25', 'pm10', 'no2', 'co', 'o3', 'so2',
            'hour_sin', 'hour_cos', 'month_sin', 'month_cos', 
            'day_sin', 'day_cos', 'is_weekend', 'target_lat', 'target_lon'
        ]
        self.sequence_length = 24
        self.load_model()
    
    def load_model(self):
        """Load trained LSTM model and scaler"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'best_lstm_model.keras')
            
            if os.path.exists(model_path):
                self.model = load_model(model_path)
                logger.info(f"✅ Model loaded successfully from {model_path}")
                return True
            else:
                logger.error(f"❌ Model file not found at {model_path}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            return False
    
    def get_temporal_features(self, dt):
        """Extract temporal features from datetime"""
        hour = dt.hour
        month = dt.month
        day_of_year = dt.timetuple().tm_yday
        is_weekend = 1 if dt.weekday() >= 5 else 0
        
        # Cyclical encoding
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)
        day_sin = np.sin(2 * np.pi * day_of_year / 365)
        day_cos = np.cos(2 * np.pi * day_of_year / 365)
        
        return {
            'hour_sin': hour_sin,
            'hour_cos': hour_cos,
            'month_sin': month_sin,
            'month_cos': month_cos,
            'day_sin': day_sin,
            'day_cos': day_cos,
            'is_weekend': is_weekend
        }
    
    def calculate_aqi(self, pm25=None, pm10=None, no2=None, co=None, o3=None, so2=None):
        """Calculate AQI from pollutant concentrations"""
        aqi_values = []
        
        # PM2.5 AQI (µg/m³)
        if pm25 is not None and pm25 >= 0:
            if pm25 <= 12.0:
                aqi_pm25 = (50 / 12.0) * pm25
            elif pm25 <= 35.4:
                aqi_pm25 = 50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1)
            elif pm25 <= 55.4:
                aqi_pm25 = 100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5)
            else:
                aqi_pm25 = min(500, 150 + ((200 - 150) / (150.4 - 55.5)) * (pm25 - 55.5))
            aqi_values.append(aqi_pm25)
        
        # PM10 AQI (µg/m³)
        if pm10 is not None and pm10 >= 0:
            if pm10 <= 54:
                aqi_pm10 = (50 / 54) * pm10
            elif pm10 <= 154:
                aqi_pm10 = 50 + ((100 - 50) / (154 - 55)) * (pm10 - 55)
            else:
                aqi_pm10 = min(500, 100 + ((150 - 100) / (254 - 155)) * (pm10 - 155))
            aqi_values.append(aqi_pm10)
        
        # Return maximum AQI (worst pollutant determines overall AQI)
        return max(aqi_values) if aqi_values else 50  # Default moderate AQI
    
    def predict_aqi(self, latitude, longitude, current_data=None):
        """Predict AQI for given location"""
        try:
            if not self.model:
                return {"error": "Model not loaded"}
            
            # Debug: Log what we received
            logger.info(f"predict_aqi called with: lat={latitude}, lon={longitude}, current_data={current_data}")
            
            # Handle current_data - merge with defaults if partial data provided
            default_data = {
                'pm25': 25.0,
                'pm10': 45.0,
                'no2': 15.0,
                'co': 1.0,
                'o3': 30.0,
                'so2': 5.0
            }
            
            # If current_data is provided, use it; otherwise use defaults
            if current_data and isinstance(current_data, dict):
                # Use provided values, fall back to defaults for missing keys
                final_data = {key: current_data.get(key, default_data[key]) 
                             for key in default_data.keys()}
                logger.info(f"Using provided data, final_data: {final_data}")
            else:
                final_data = default_data.copy()
                logger.info(f"Using default data: {final_data}")
            
            # Create feature sequence (simulate 24 hours of data)
            now = datetime.now()
            sequence_data = []
            
            for i in range(self.sequence_length):
                # Go back in time for sequence
                dt = now - timedelta(hours=self.sequence_length - i - 1)
                
                # Get temporal features
                temp_features = self.get_temporal_features(dt)
                
                # Create feature vector using final_data
                features = {
                    'pm25': final_data['pm25'],
                    'pm10': final_data['pm10'],
                    'no2': final_data['no2'],
                    'co': final_data['co'],
                    'o3': final_data['o3'],
                    'so2': final_data['so2'],
                    'target_lat': latitude,
                    'target_lon': longitude,
                    **temp_features
                }
                
                # Create feature vector in correct order
                feature_vector = [features[col] for col in self.feature_columns]
                sequence_data.append(feature_vector)
            
            # Debug: Log first feature vector to verify values
            logger.info(f"First feature vector (pm25={sequence_data[0][0]}, pm10={sequence_data[0][1]}): {sequence_data[0][:6]}")
            
            # Convert to numpy array and reshape for model
            X = np.array(sequence_data).reshape(1, self.sequence_length, len(self.feature_columns))
            
            # Make prediction
            prediction = self.model.predict(X, verbose=0)[0][0]
            
            # Convert from normalized prediction to AQI scale
            predicted_aqi = max(0, min(500, prediction * 500))
            
            logger.info(f"Raw model prediction: {prediction}, Scaled AQI: {predicted_aqi}")
            
            return {
                "predicted_aqi": round(predicted_aqi, 1),
                "latitude": latitude,
                "longitude": longitude,
                "prediction_time": now.isoformat(),
                "input_data": final_data,  # Return the actual data used
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return {"error": str(e)}

# Initialize predictor
predictor = AQIPredictor()

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        "service": "AQI ML Backend",
        "status": "running",
        "model_loaded": predictor.model is not None,
        "version": "1.0.0"
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict AQI for given coordinates"""
    try:
        data = request.get_json()
        
        # Debug: Log incoming request
        logger.info(f"Received prediction request: {data}")
        
        # Validate input
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude required"}), 400
        
        # Optional current pollution data
        current_data = data.get('current_data', {})
        
        # Debug: Log current_data being passed
        logger.info(f"Current data being passed to prediction: {current_data}")
        
        # Make prediction
        result = predictor.predict_aqi(float(latitude), float(longitude), current_data)
        
        # Debug: Log prediction result
        logger.info(f"Prediction result: {result}")
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict AQI for multiple locations"""
    try:
        data = request.get_json()
        locations = data.get('locations', [])
        
        if not locations:
            return jsonify({"error": "No locations provided"}), 400
        
        results = []
        for location in locations:
            lat = location.get('latitude')
            lon = location.get('longitude')
            current_data = location.get('current_data', {})
            
            if lat is not None and lon is not None:
                prediction = predictor.predict_aqi(float(lat), float(lon), current_data)
                results.append(prediction)
            else:
                results.append({"error": "Invalid location data"})
        
        return jsonify({
            "success": True,
            "data": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        "success": True,
        "data": {
            "model_type": "Location-Aware LSTM",
            "input_features": len(predictor.feature_columns),
            "feature_columns": predictor.feature_columns,
            "sequence_length": predictor.sequence_length,
            "model_loaded": predictor.model is not None,
            "performance": {
                "validation_mae": "32.75 AQI units",
                "test_mae": "44.60 AQI units",
                "accuracy_30_aqi": "45.9%"
            }
        }
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "model_status": "loaded" if predictor.model else "not_loaded",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/forecast/train', methods=['GET', 'POST'])
def train_model():
    """Model training endpoint (for compatibility)"""
    return jsonify({
        "success": True,
        "message": "Model is already trained",
        "model_info": {
            "type": "Location-Aware LSTM",
            "status": "trained",
            "performance": {
                "validation_mae": "32.75 AQI units",
                "test_mae": "44.60 AQI units",
                "accuracy_30_aqi": "45.9%"
            },
            "trained_at": "2025-08-02",
            "model_file": "best_lstm_model.keras"
        },
        "note": "This model is pre-trained. No additional training needed."
    })

if __name__ == '__main__':
    print("🚀 Starting AQI ML Backend Service...")
    print(f"📊 Model Status: {'Loaded' if predictor.model else 'Not Loaded'}")
    
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5001,  # Different port from main backend
        debug=True
    )
