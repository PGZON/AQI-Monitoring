"""
Main execution pipeline for Location-Based AQI Data Collection & LSTM Training
"""
import os
import sys
import time
import logging
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import with error handling
try:
    from data_collector import OpenAQDataCollector
    print("✅ data_collector imported successfully")
except Exception as e:
    print(f"❌ Failed to import data_collector: {e}")
    
try:
    from data_preprocessor import AQIDataPreprocessor
    print("✅ data_preprocessor imported successfully")
except Exception as e:
    print(f"❌ Failed to import data_preprocessor: {e}")
    
try:
    from lstm_model import LocationAwareLSTMModel
    print("✅ lstm_model imported successfully")
except Exception as e:
    print(f"❌ Failed to import lstm_model: {e}")
    print("⚠️ LSTM training will not be available")
    LocationAwareLSTMModel = None

try:
    from config import *
    print("✅ config imported successfully")
except Exception as e:
    print(f"❌ Failed to import config: {e}")
    sys.exit(1)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AQIPipeline:
    """Complete AQI data collection and model training pipeline"""
    
    def __init__(self):
        self.collector = None
        self.preprocessor = None
        self.model = None
        
        # Create necessary directories
        os.makedirs(DATA_DIR, exist_ok=True)
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        logger.info("🚀 AQI Pipeline initialized")
        logger.info(f"📁 Data directory: {DATA_DIR}")
        logger.info(f"📁 Models directory: {MODEL_DIR}")
    
    def check_api_key(self) -> bool:
        """Check if OpenAQ API key is configured"""
        
        if OPENAQ_API_KEY == 'your-api-key-here':
            logger.error("❌ OpenAQ API key not configured!")
            logger.info("📝 Please:")
            logger.info("   1. Sign up at https://openaq.org")
            logger.info("   2. Get your API key")
            logger.info("   3. Set environment variable: OPENAQ_API_KEY=your-key")
            logger.info("   4. Or edit config.py and update OPENAQ_API_KEY")
            return False
        
        logger.info("✅ OpenAQ API key configured")
        return True
    
    def step1_collect_data(self, force_recollect: bool = False) -> bool:
        """Step 1: Collect data from OpenAQ API"""
        
        logger.info("📊 STEP 1: Data Collection")
        logger.info("=" * 50)
        
        # Check if data already exists
        if os.path.exists(RAW_DATA_FILE) and not force_recollect:
            logger.info(f"✅ Raw data file exists: {RAW_DATA_FILE}")
            response = input("🤔 Recollect data? (y/N): ").lower().strip()
            if response != 'y':
                logger.info("⏭️  Skipping data collection")
                return True
        
        # Check API key
        if not self.check_api_key():
            return False
        
        # Initialize collector
        self.collector = OpenAQDataCollector()
        
        # Test API connection first
        logger.info("🔌 Testing API connection...")
        test_location = TARGET_LOCATIONS[0]
        location_info = self.collector.get_location_info(test_location[0], test_location[1])
        
        if location_info['total_locations'] == 0:
            logger.error("❌ API connection failed or no monitoring stations found")
            return False
        
        logger.info(f"✅ API connection successful!")
        logger.info(f"📊 Found {location_info['total_locations']} monitoring stations")
        logger.info(f"🧪 Available parameters: {location_info['parameters_available']}")
        
        # Confirm data collection
        total_requests = len(TARGET_LOCATIONS) * len(POLLUTANT_PARAMETERS)
        estimated_time = (total_requests * REQUEST_DELAY) / 60  # minutes
        
        logger.info(f"📈 Data collection plan:")
        logger.info(f"   Locations: {len(TARGET_LOCATIONS)}")
        logger.info(f"   Parameters: {len(POLLUTANT_PARAMETERS)}")
        logger.info(f"   Total API requests: ~{total_requests}")
        logger.info(f"   Estimated time: ~{estimated_time:.1f} minutes")
        
        response = input("🚀 Start data collection? (Y/n): ").lower().strip()
        if response == 'n':
            logger.info("⏹️  Data collection cancelled")
            return False
        
        # Start data collection
        start_time = time.time()
        df = self.collector.collect_data_for_all_locations()
        end_time = time.time()
        
        if not df.empty:
            duration = (end_time - start_time) / 60
            logger.info(f"🎉 Data collection completed!")
            logger.info(f"⏱️  Duration: {duration:.1f} minutes")
            logger.info(f"📊 Records collected: {len(df)}")
            return True
        else:
            logger.error("❌ Data collection failed!")
            return False
    
    def step2_preprocess_data(self) -> bool:
        """Step 2: Preprocess collected data"""
        
        logger.info("🔧 STEP 2: Data Preprocessing")
        logger.info("=" * 50)
        
        # Check for available data files
        data_files = []
        if os.path.exists(RAW_DATA_FILE):
            data_files.append((RAW_DATA_FILE, "Latest data"))
        if os.path.exists(f"{DATA_DIR}/historical_openaq_data.csv"):
            data_files.append((f"{DATA_DIR}/historical_openaq_data.csv", "Historical data"))
        
        if not data_files:
            logger.error("❌ No data files found!")
            logger.info(f"   Expected: {RAW_DATA_FILE}")
            logger.info(f"   Or: {DATA_DIR}/historical_openaq_data.csv")
            logger.info("💡 Please run data collection first")
            return False
        
        # Show available files
        if len(data_files) > 1:
            logger.info("📁 Multiple data files found:")
            for i, (file_path, desc) in enumerate(data_files, 1):
                file_size = os.path.getsize(file_path) / 1024  # KB
                logger.info(f"   {i}. {desc}: {os.path.basename(file_path)} ({file_size:.1f} KB)")
            
            # Use the larger file (likely historical data)
            selected_file = max(data_files, key=lambda x: os.path.getsize(x[0]))[0]
            logger.info(f"✅ Auto-selected largest file: {os.path.basename(selected_file)}")
        else:
            selected_file = data_files[0][0]
            logger.info(f"✅ Using data file: {os.path.basename(selected_file)}")
        
        # Initialize preprocessor
        self.preprocessor = AQIDataPreprocessor()
        
        # Process the selected file directly
        logger.info(f"📊 Processing data file: {selected_file}")
        
        # Run preprocessing pipeline
        try:
            # Pass the selected file path to the pipeline
            X, y = self.preprocessor.process_pipeline(selected_file)
            
            if len(X) > 0:
                logger.info("✅ Data preprocessing successful!")
                logger.info(f"📊 LSTM sequences created: {len(X)}")
                return True
            else:
                logger.error("❌ Data preprocessing failed - insufficient data for LSTM sequences!")
                logger.info("💡 Try collecting more historical data (30+ days recommended)")
                return False
        
        except Exception as e:
            logger.error(f"❌ Data preprocessing failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def step3_train_model(self) -> bool:
        """Step 3: Train LSTM model"""
        
        logger.info("🧠 STEP 3: LSTM Model Training")
        logger.info("=" * 50)
        
        # Check if LSTM model is available
        if LocationAwareLSTMModel is None:
            logger.error("❌ LSTM model not available (TensorFlow import issue)")
            logger.info("💡 LSTM training is disabled due to import errors")
            return False
        
        # Check if processed data exists
        if not os.path.exists(SEQUENCES_FILE):
            logger.error(f"❌ Sequences file not found: {SEQUENCES_FILE}")
            logger.info("💡 Please run Step 2 (data preprocessing) first")
            return False
        
        # Initialize model
        self.model = LocationAwareLSTMModel()
        
        # Load data
        X, y = self.model.load_data()
        
        if len(X) == 0:
            logger.error("❌ No data available for training")
            return False
        
        logger.info(f"📊 Training data: {len(X)} sequences")
        
        # Confirm training
        response = input("🚀 Start model training? (Y/n): ").lower().strip()
        if response == 'n':
            logger.info("⏹️  Model training cancelled")
            return False
        
        # Train model
        from sklearn.model_selection import train_test_split
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Train
        training_results = self.model.train_model(X_train, y_train)
        
        # Evaluate
        evaluation_results = self.model.evaluate_model(X_test, y_test)
        
        # Save model
        self.model.save_model()
        
        # Plot training history
        self.model.plot_training_history()
        
        logger.info("✅ Model training completed!")
        logger.info(f"📊 Validation MAE: {training_results['val_mae']:.2f} AQI units")
        logger.info(f"📊 Test MAE: {evaluation_results['mae']:.2f} AQI units")
        
        return True
    
    def run_complete_pipeline(self):
        """Run the complete pipeline"""
        
        logger.info("🎯 LOCATION-BASED AQI FORECASTING PIPELINE")
        logger.info("=" * 60)
        logger.info(f"🕒 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        pipeline_start = time.time()
        
        try:
            # Step 1: Data Collection
            if not self.step1_collect_data():
                logger.error("❌ Pipeline failed at Step 1")
                return False
            
            # Step 2: Data Preprocessing
            if not self.step2_preprocess_data():
                logger.error("❌ Pipeline failed at Step 2")
                return False
            
            # Step 3: Model Training
            if not self.step3_train_model():
                logger.error("❌ Pipeline failed at Step 3")
                return False
            
            pipeline_end = time.time()
            total_duration = (pipeline_end - pipeline_start) / 60
            
            logger.info("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
            logger.info("=" * 60)
            logger.info(f"⏱️  Total duration: {total_duration:.1f} minutes")
            logger.info(f"📊 Model ready for AQI forecasting!")
            logger.info(f"💾 Files created:")
            logger.info(f"   Raw data: {RAW_DATA_FILE}")
            logger.info(f"   Processed data: {PROCESSED_DATA_FILE}")
            logger.info(f"   LSTM sequences: {SEQUENCES_FILE}")
            logger.info(f"   Trained model: {MODEL_DIR}/location_aware_lstm_model.h5")
            
            return True
            
        except KeyboardInterrupt:
            logger.info("⏹️  Pipeline interrupted by user")
            return False
        except Exception as e:
            logger.error(f"❌ Pipeline failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_prediction(self, lat: float = 19.0760, lon: float = 72.8777):
        """Test prediction for a specific location"""
        
        logger.info(f"🔮 Testing prediction for location ({lat:.4f}, {lon:.4f})")
        
        # Load trained model
        if self.model is None:
            self.model = LocationAwareLSTMModel()
            if not self.model.load_model():
                logger.error("❌ Failed to load trained model")
                return
        
        # For testing, create dummy input sequence
        import numpy as np
        
        # Load feature info
        feature_info_path = f"{DATA_DIR}/feature_info.json"
        if os.path.exists(feature_info_path):
            import json
            with open(feature_info_path, 'r') as f:
                feature_info = json.load(f)
            
            feature_columns = feature_info['feature_columns']
            sequence_length = feature_info.get('sequence_length', SEQUENCE_LENGTH)
            
            # Create dummy input (you would use real data in practice)
            dummy_input = np.random.random((sequence_length, len(feature_columns)))
            
            # Make prediction
            predicted_aqi = self.model.predict_aqi(dummy_input)
            
            logger.info(f"🎯 Predicted AQI: {predicted_aqi:.1f}")
        else:
            logger.error("❌ Feature info not found - run preprocessing first")

def main():
    """Main execution function"""
    
    pipeline = AQIPipeline()
    
    # Show menu
    while True:
        print("\n🎯 LOCATION-BASED AQI FORECASTING PIPELINE")
        print("=" * 50)
        print("1. 📊 Collect Data from OpenAQ API")
        print("2. 🔧 Preprocess Data")
        print("3. 🧠 Train LSTM Model")
        print("4. 🚀 Run Complete Pipeline")
        print("5. 🔮 Test Prediction")
        print("6. ❌ Exit")
        print("=" * 50)
        
        choice = input("Select option (1-6): ").strip()
        
        if choice == '1':
            pipeline.step1_collect_data(force_recollect=True)
        elif choice == '2':
            pipeline.step2_preprocess_data()
        elif choice == '3':
            pipeline.step3_train_model()
        elif choice == '4':
            pipeline.run_complete_pipeline()
        elif choice == '5':
            pipeline.test_prediction()
        elif choice == '6':
            logger.info("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please select 1-6.")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()
