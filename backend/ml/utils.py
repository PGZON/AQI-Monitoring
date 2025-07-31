import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class DataFetcher:
    """Utility class to fetch training data from Node.js backend"""
    
    def __init__(self, backend_url=None):
        self.backend_url = backend_url or os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')
        
    def fetch_ml_data(self, city=None, days=30, lat=None, lon=None):
        """
        Fetch ML-ready data from the Node.js backend
        """
        try:
            url = f"{self.backend_url}/api/history/ml-data"
            params = {
                'days': days,
                'interval': 'daily'
            }
            
            if city:
                params['city'] = city
            if lat and lon:
                params['lat'] = lat
                params['lon'] = lon
                
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if data['success']:
                return data['data']
            else:
                raise Exception(f"Backend error: {data.get('message', 'Unknown error')}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch data from backend: {str(e)}")
    
    def fetch_recent_data(self, city=None, days=14, lat=None, lon=None):
        """
        Fetch recent data for making predictions
        """
        return self.fetch_ml_data(city, days, lat, lon)

class ForecastValidator:
    """Validates forecast results for reasonableness"""
    
    @staticmethod
    def validate_forecast(forecast_data, recent_aqi_avg=None):
        """
        Validate forecast predictions for reasonableness
        """
        if not forecast_data or 'forecast' not in forecast_data:
            return False, "No forecast data provided"
            
        forecasts = forecast_data['forecast']
        
        # Check if forecasts are in valid AQI range
        for forecast in forecasts:
            aqi = forecast.get('aqi', 0)
            if not (0 <= aqi <= 500):
                return False, f"AQI value {aqi} is out of valid range (0-500)"
                
        # Check for reasonable variation (AQI shouldn't jump dramatically)
        if len(forecasts) > 1:
            max_daily_change = max(
                abs(forecasts[i]['aqi'] - forecasts[i-1]['aqi']) 
                for i in range(1, len(forecasts))
            )
            
            if max_daily_change > 100:  # Dramatic change threshold
                return False, f"Forecast shows unrealistic daily change: {max_daily_change}"
                
        # Check against recent average if provided
        if recent_aqi_avg and forecasts:
            first_forecast = forecasts[0]['aqi']
            change_from_recent = abs(first_forecast - recent_aqi_avg)
            
            if change_from_recent > 150:  # Significant change threshold
                return False, f"Forecast deviates too much from recent average: {change_from_recent}"
                
        return True, "Forecast validation passed"

class LocationManager:
    """Manages location-based model training and predictions"""
    
    def __init__(self):
        self.location_cache = {}
        
    def get_location_key(self, city=None, lat=None, lon=None):
        """Generate a unique key for location"""
        if city:
            return f"city_{city.lower().replace(' ', '_')}"
        elif lat and lon:
            # Round to 2 decimal places for caching nearby locations
            return f"coords_{round(lat, 2)}_{round(lon, 2)}"
        else:
            return "global"
            
    def should_retrain_model(self, location_key, hours_threshold=24):
        """Check if model should be retrained based on time"""
        if location_key not in self.location_cache:
            return True
            
        last_trained = self.location_cache[location_key].get('last_trained')
        if not last_trained:
            return True
            
        time_diff = datetime.now() - datetime.fromisoformat(last_trained)
        return time_diff.total_seconds() / 3600 > hours_threshold
    
    def update_location_cache(self, location_key, model_info):
        """Update location cache with model information"""
        self.location_cache[location_key] = {
            'last_trained': datetime.now().isoformat(),
            'model_info': model_info,
            'training_data_points': model_info.get('training_samples', 0)
        }

def generate_synthetic_data(city="Test City", days=30):
    """
    Generate synthetic AQI data for testing when real data is not available
    """
    base_date = datetime.now() - timedelta(days=days)
    data = []
    
    # Base AQI varies by city
    city_base_aqi = {
        'mumbai': 120,
        'delhi': 150,
        'new york': 80,
        'london': 65,
        'beijing': 140
    }
    
    base_aqi = city_base_aqi.get(city.lower(), 100)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        
        # Add some seasonal and random variation
        seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * i / 30)  # Monthly cycle
        random_factor = np.random.normal(1, 0.3)  # Random variation
        
        aqi = max(10, min(300, base_aqi * seasonal_factor * random_factor))
        
        # Generate correlated pollutant data
        pm25 = aqi * 0.4 + np.random.normal(0, 5)
        pm10 = aqi * 0.6 + np.random.normal(0, 8)
        
        data.append({
            'timestamp': date.isoformat(),
            'aqi': round(aqi, 1),
            'pollutants': {
                'pm2_5': max(0, round(pm25, 1)),
                'pm10': max(0, round(pm10, 1)),
                'co': round(200 + aqi * 2 + np.random.normal(0, 50), 1),
                'no2': round(20 + aqi * 0.3 + np.random.normal(0, 5), 1),
                'o3': round(50 + np.random.normal(0, 20), 1),
                'so2': round(5 + aqi * 0.1 + np.random.normal(0, 2), 1)
            },
            'weather': {
                'temperature': round(25 + np.random.normal(0, 8), 1),
                'humidity': round(60 + np.random.normal(0, 15), 1),
                'pressure': round(1013 + np.random.normal(0, 20), 1),
                'windSpeed': round(5 + np.random.exponential(3), 1)
            },
            'dataPoints': 1
        })
    
    return data

def format_prediction_response(forecast_result, city=None, model_metadata=None):
    """
    Format prediction results into standardized API response
    """
    response = {
        'success': True,
        'city': city or 'Unknown',
        'generated_at': datetime.now().isoformat(),
        'model_used': forecast_result.get('model_used', 'unknown'),
        'forecast_days': forecast_result.get('forecast_days', 0),
        'forecast': forecast_result.get('forecast', [])
    }
    
    # Add model metadata if available
    if model_metadata:
        response['model_metadata'] = model_metadata
        
    # Add confidence assessment
    if response['forecast']:
        avg_confidence = len([f for f in response['forecast'] if f.get('confidence') == 'high']) / len(response['forecast'])
        response['overall_confidence'] = 'high' if avg_confidence > 0.7 else 'medium' if avg_confidence > 0.3 else 'low'
    
    return response

def calculate_trend_direction(forecast_data):
    """
    Calculate overall trend direction from forecast
    """
    if not forecast_data or len(forecast_data) < 2:
        return 'stable'
        
    aqi_values = [f['aqi'] for f in forecast_data]
    
    # Calculate linear trend
    x = np.arange(len(aqi_values))
    coefficients = np.polyfit(x, aqi_values, 1)
    slope = coefficients[0]
    
    if slope > 5:
        return 'increasing'
    elif slope < -5:
        return 'decreasing'
    else:
        return 'stable'
