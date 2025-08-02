"""
AQI Prediction Service
Uses trained LSTM model for real-time AQI predictions
"""
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from lstm_model import LocationAwareLSTMModel
from data_collector import OpenAQDataCollector
from data_preprocessor import AQIDataPreprocessor
from config import *

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AQIPredictionService:
    """Real-time AQI prediction service using trained LSTM model"""
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.collector = None
        
        # Load trained model
        self.load_model()
        
        logger.info("🔮 AQI Prediction Service initialized")
    
    def load_model(self):
        """Load the trained LSTM model"""
        
        try:
            self.model = LocationAwareLSTMModel()
            
            # Try to load the best model first
            if os.path.exists(f"{MODEL_DIR}/best_lstm_model.keras"):
                self.model.load_model(f"{MODEL_DIR}/best_lstm_model.keras")
                logger.info("✅ Loaded best LSTM model (.keras)")
            elif os.path.exists(f"{MODEL_DIR}/location_aware_lstm_model.h5"):
                self.model.load_model(f"{MODEL_DIR}/location_aware_lstm_model.h5")
                logger.info("✅ Loaded trained LSTM model (.h5)")
            else:
                logger.error("❌ No trained model found!")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False
    
    def predict_for_location(self, latitude: float, longitude: float, hours_ahead: int = 1) -> dict:
        """Predict AQI for a specific location"""
        
        if not self.model:
            return {"error": "Model not loaded"}
        
        try:
            logger.info(f"🔮 Predicting AQI for ({latitude}, {longitude})")
            
            # Initialize data collector if needed
            if not self.collector:
                self.collector = OpenAQDataCollector()
            
            # Get recent data for the location
            location_data = self.collector.get_location_info(latitude, longitude)
            
            if location_data['total_locations'] == 0:
                return {"error": "No monitoring stations found near this location"}
            
            # For demonstration, use the trained model's predict method
            # In a real implementation, you would:
            # 1. Collect last 24 hours of data for this location
            # 2. Preprocess it into the required format
            # 3. Use model.predict() method
            
            # Simulated prediction using the test functionality
            prediction = self.model.predict_for_location(latitude, longitude)
            
            return {
                "latitude": latitude,
                "longitude": longitude,
                "predicted_aqi": round(prediction, 1),
                "prediction_time": datetime.now().isoformat(),
                "hours_ahead": hours_ahead,
                "status": "success",
                "nearby_stations": location_data['total_locations']
            }
            
        except Exception as e:
            logger.error(f"❌ Prediction failed: {e}")
            return {"error": str(e)}
    
    def batch_predict(self, locations: list) -> list:
        """Predict AQI for multiple locations"""
        
        results = []
        for lat, lon in locations:
            prediction = self.predict_for_location(lat, lon)
            results.append(prediction)
        
        return results
    
    def get_model_info(self) -> dict:
        """Get information about the loaded model"""
        
        if not self.model:
            return {"error": "No model loaded"}
        
        return {
            "model_type": "Location-Aware LSTM",
            "input_features": 15,
            "sequence_length": 24,
            "total_parameters": 205121,
            "validation_mae": 32.75,
            "test_mae": 44.60,
            "accuracy_20_aqi": "32.1%",
            "accuracy_30_aqi": "45.9%",
            "status": "ready"
        }

def main():
    """Interactive prediction service"""
    
    print("🔮 AQI PREDICTION SERVICE")
    print("=" * 40)
    
    # Initialize service
    service = AQIPredictionService()
    
    if not service.model:
        print("❌ Failed to load model. Please train the model first.")
        return
    
    # Show model info
    info = service.get_model_info()
    print(f"📊 Model Info:")
    print(f"   Type: {info['model_type']}")
    print(f"   Validation MAE: {info['validation_mae']} AQI units")
    print(f"   Accuracy (±30 AQI): {info['accuracy_30_aqi']}")
    
    # Interactive prediction
    while True:
        print("\n🎯 AQI PREDICTION OPTIONS:")
        print("1. 🌍 Predict for location")
        print("2. 📊 Multiple locations")
        print("3. 📈 Model information")
        print("4. ❌ Exit")
        
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == '1':
            try:
                lat = float(input("Enter latitude: "))
                lon = float(input("Enter longitude: "))
                
                result = service.predict_for_location(lat, lon)
                
                if "error" in result:
                    print(f"❌ Error: {result['error']}")
                else:
                    print(f"\n🎯 PREDICTION RESULT:")
                    print(f"   Location: ({result['latitude']}, {result['longitude']})")
                    print(f"   Predicted AQI: {result['predicted_aqi']}")
                    print(f"   Nearby stations: {result['nearby_stations']}")
                    print(f"   Prediction time: {result['prediction_time']}")
                    
            except ValueError:
                print("❌ Please enter valid coordinates")
        
        elif choice == '2':
            # Predefined locations
            locations = [
                (19.0760, 72.8777),  # Mumbai
                (28.6139, 77.2090),  # Delhi
                (12.9716, 77.5946),  # Bangalore
                (16.7054, 74.2439),  # Kolhapur
            ]
            
            print("\n🌍 Predicting for multiple locations...")
            results = service.batch_predict(locations)
            
            print("\n📊 BATCH PREDICTIONS:")
            for i, result in enumerate(results, 1):
                if "error" not in result:
                    print(f"   {i}. ({result['latitude']}, {result['longitude']}): {result['predicted_aqi']} AQI")
                else:
                    print(f"   {i}. Error: {result['error']}")
        
        elif choice == '3':
            info = service.get_model_info()
            print(f"\n📊 MODEL INFORMATION:")
            for key, value in info.items():
                if key != "status":
                    print(f"   {key.replace('_', ' ').title()}: {value}")
        
        elif choice == '4':
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main()
