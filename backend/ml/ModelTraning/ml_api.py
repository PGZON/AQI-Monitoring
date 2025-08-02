"""
Flask API Integration for AQI Predictions
Add these routes to your main backend Flask app
"""

# Add to your backend/app.js equivalent or create new Python Flask app
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add ML path
sys.path.append('ml/apiML')

from prediction_service import AQIPredictionService

app = Flask(__name__)
CORS(app)

# Initialize prediction service
prediction_service = AQIPredictionService()

@app.route('/api/ml/predict', methods=['POST'])
def predict_aqi():
    """Predict AQI for given coordinates"""
    
    try:
        data = request.get_json()
        lat = float(data.get('latitude'))
        lon = float(data.get('longitude'))
        
        result = prediction_service.predict_for_location(lat, lon)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/ml/batch-predict', methods=['POST'])
def batch_predict():
    """Predict AQI for multiple locations"""
    
    try:
        data = request.get_json()
        locations = data.get('locations', [])
        
        # Convert to list of tuples
        location_tuples = [(loc['lat'], loc['lon']) for loc in locations]
        
        results = prediction_service.batch_predict(location_tuples)
        
        return jsonify({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/ml/model-info', methods=['GET'])
def model_info():
    """Get information about the ML model"""
    
    try:
        info = prediction_service.get_model_info()
        
        return jsonify({
            'success': True,
            'data': info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/ml/health', methods=['GET'])
def ml_health():
    """Check ML service health"""
    
    return jsonify({
        'success': True,
        'status': 'ML service is running',
        'model_loaded': prediction_service.model is not None
    })

if __name__ == '__main__':
    print("🚀 Starting AQI ML Prediction API...")
    print("📊 Model Status:", "Loaded" if prediction_service.model else "Not Loaded")
    app.run(debug=True, port=5002)  # Different port from main backend
