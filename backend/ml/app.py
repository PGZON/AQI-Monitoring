from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our ML modules
from models import ModelManager
from utils import (
    DataFetcher, 
    ForecastValidator, 
    LocationManager, 
    generate_synthetic_data,
    format_prediction_response,
    calculate_trend_direction
)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
model_manager = ModelManager()
data_fetcher = DataFetcher()
location_manager = LocationManager()
validator = ForecastValidator()

# Configuration
FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
MIN_DATA_POINTS = int(os.getenv('MIN_DATA_POINTS', 50))
FORECAST_DAYS_MAX = int(os.getenv('FORECAST_DAYS_MAX', 7))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AQI ML Forecasting Service',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'models_available': list(model_manager.models.keys()),
        'active_model': model_manager.active_model
    })

@app.route('/train', methods=['POST'])
def train_model():
    """
    Train ML models for a specific location
    POST /train
    {
        "city": "Mumbai",
        "days": 30,
        "lat": 19.0760,
        "lon": 72.8777,
        "force_retrain": false
    }
    """
    try:
        data = request.get_json()
        
        # Extract parameters
        city = data.get('city')
        days = min(int(data.get('days', 30)), 90)  # Max 90 days
        lat = data.get('lat')
        lon = data.get('lon')
        force_retrain = data.get('force_retrain', False)
        
        # Generate location key
        location_key = location_manager.get_location_key(city, lat, lon)
        
        # Check if retraining is needed
        if not force_retrain and not location_manager.should_retrain_model(location_key):
            return jsonify({
                'success': False,
                'message': 'Model was recently trained. Use force_retrain=true to override.',
                'location_key': location_key,
                'last_trained': location_manager.location_cache[location_key]['last_trained']
            })
        
        # Fetch training data
        try:
            training_data = data_fetcher.fetch_ml_data(city, days, lat, lon)
        except Exception as e:
            logger.warning(f"Failed to fetch real data: {e}. Using synthetic data.")
            training_data = generate_synthetic_data(city or "Unknown City", days)
        
        if len(training_data) < MIN_DATA_POINTS:
            return jsonify({
                'success': False,
                'message': f'Insufficient data for training. Need at least {MIN_DATA_POINTS} data points, got {len(training_data)}',
                'data_points': len(training_data)
            })
        
        # Train models
        logger.info(f"Training models for location: {location_key} with {len(training_data)} data points")
        training_results = model_manager.train_models(training_data)
        
        # Update location cache
        location_manager.update_location_cache(location_key, training_results)
        
        # Save models
        models_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
        os.makedirs(models_dir, exist_ok=True)
        saved_models = model_manager.save_models(os.path.join(models_dir, f'aqi_model_{location_key}'))
        
        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'location_key': location_key,
            'training_data_points': len(training_data),
            'training_results': training_results,
            'saved_models': saved_models,
            'trained_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Training failed',
            'error': str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Make AQI predictions for a location
    POST /predict
    {
        "city": "Mumbai",
        "days": 3,
        "lat": 19.0760,
        "lon": 72.8777,
        "auto_train": true
    }
    """
    try:
        data = request.get_json()
        
        # Extract parameters
        city = data.get('city')
        days = min(int(data.get('days', 3)), FORECAST_DAYS_MAX)
        lat = data.get('lat')
        lon = data.get('lon')
        auto_train = data.get('auto_train', True)
        
        # Generate location key
        location_key = location_manager.get_location_key(city, lat, lon)
        
        # Check if model needs training
        if auto_train and location_manager.should_retrain_model(location_key):
            logger.info(f"Auto-training model for location: {location_key}")
            
            try:
                # Fetch training data
                training_data = data_fetcher.fetch_ml_data(city, 30, lat, lon)
                
                if len(training_data) >= MIN_DATA_POINTS:
                    training_results = model_manager.train_models(training_data)
                    location_manager.update_location_cache(location_key, training_results)
                    logger.info(f"Auto-training completed for {location_key}")
                else:
                    logger.warning(f"Insufficient data for auto-training: {len(training_data)} points")
                    
            except Exception as e:
                logger.warning(f"Auto-training failed: {e}. Proceeding with existing model.")
        
        # Check if we have a trained model
        if not any(model.is_trained for model in model_manager.models.values()):
            return jsonify({
                'success': False,
                'message': 'No trained model available. Please train a model first.',
                'location_key': location_key
            }), 400
        
        # Fetch recent data for prediction
        try:
            recent_data = data_fetcher.fetch_recent_data(city, 14, lat, lon)
        except Exception as e:
            logger.warning(f"Failed to fetch real recent data: {e}. Using synthetic data.")
            recent_data = generate_synthetic_data(city or "Unknown City", 14)
        
        if len(recent_data) < 7:  # Minimum for prediction
            return jsonify({
                'success': False,
                'message': 'Insufficient recent data for prediction. Need at least 7 data points.',
                'data_points': len(recent_data)
            }), 400
        
        # Make prediction
        forecast_result = model_manager.predict(recent_data, days)
        
        # Validate forecast
        recent_aqi_avg = sum(point.get('aqi', 0) for point in recent_data[-7:]) / 7
        is_valid, validation_message = validator.validate_forecast(forecast_result, recent_aqi_avg)
        
        if not is_valid:
            logger.warning(f"Forecast validation failed: {validation_message}")
            # Still return the forecast but with a warning
            
        # Format response
        response = format_prediction_response(forecast_result, city, {
            'location_key': location_key,
            'recent_data_points': len(recent_data),
            'recent_aqi_avg': round(recent_aqi_avg, 1),
            'validation_passed': is_valid,
            'validation_message': validation_message
        })
        
        # Add trend analysis
        if response['forecast']:
            response['trend'] = calculate_trend_direction(response['forecast'])
            
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Prediction failed',
            'error': str(e)
        }), 500

@app.route('/forecast/<city>', methods=['GET'])
def get_forecast(city):
    """
    Get forecast for a specific city (GET endpoint for convenience)
    GET /forecast/Mumbai?days=3
    """
    try:
        days = min(int(request.args.get('days', 3)), FORECAST_DAYS_MAX)
        
        # Call the predict endpoint internally
        prediction_data = {
            'city': city,
            'days': days,
            'auto_train': True
        }
        
        # Simulate a POST request to the predict endpoint
        with app.test_request_context('/predict', method='POST', json=prediction_data):
            return predict()
            
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Forecast failed',
            'error': str(e)
        }), 500

@app.route('/models', methods=['GET'])
def get_models_info():
    """Get information about available models"""
    models_info = {}
    
    for name, model in model_manager.models.items():
        models_info[name] = {
            'is_trained': model.is_trained,
            'type': type(model).__name__
        }
        
        if hasattr(model, 'sequence_length'):
            models_info[name]['sequence_length'] = model.sequence_length
        if hasattr(model, 'forecast_horizon'):
            models_info[name]['forecast_horizon'] = model.forecast_horizon
    
    return jsonify({
        'models': models_info,
        'active_model': model_manager.active_model,
        'location_cache': location_manager.location_cache
    })

@app.route('/retrain-all', methods=['POST'])
def retrain_all():
    """Retrain models for all cached locations"""
    try:
        results = {}
        
        for location_key in location_manager.location_cache.keys():
            try:
                # Extract location info from key
                if location_key.startswith('city_'):
                    city = location_key[5:].replace('_', ' ')
                    training_data = data_fetcher.fetch_ml_data(city, 30)
                elif location_key.startswith('coords_'):
                    coords = location_key[7:].split('_')
                    lat, lon = float(coords[0]), float(coords[1])
                    training_data = data_fetcher.fetch_ml_data(None, 30, lat, lon)
                else:
                    continue
                
                if len(training_data) >= MIN_DATA_POINTS:
                    training_results = model_manager.train_models(training_data)
                    location_manager.update_location_cache(location_key, training_results)
                    results[location_key] = {'success': True, 'data_points': len(training_data)}
                else:
                    results[location_key] = {'success': False, 'reason': 'insufficient_data'}
                    
            except Exception as e:
                results[location_key] = {'success': False, 'error': str(e)}
        
        return jsonify({
            'success': True,
            'message': f'Retrained models for {len(results)} locations',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Bulk retraining failed',
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found',
        'available_endpoints': {
            'health': 'GET /health',
            'train': 'POST /train',
            'predict': 'POST /predict',
            'forecast': 'GET /forecast/<city>',
            'models': 'GET /models',
            'retrain_all': 'POST /retrain-all'
        }
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error',
        'error': str(error)
    }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting AQI ML Forecasting Service")
    logger.info(f"🌐 Service will run on http://{FLASK_HOST}:{FLASK_PORT}")
    logger.info(f"🔗 Node.js Backend: {os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')}")
    
    # Create necessary directories
    os.makedirs('saved_models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Run the Flask app
    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=os.getenv('FLASK_ENV') == 'development'
    )
