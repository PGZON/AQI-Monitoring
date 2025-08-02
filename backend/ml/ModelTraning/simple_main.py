"""
Simple Main - Data Processing Only (No TensorFlow)
Focuses on data collection and preprocessing without ML training
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
    sys.exit(1)

try:
    from config import *
    print("✅ config imported successfully")
except Exception as e:
    print(f"❌ Failed to import config: {e}")
    sys.exit(1)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleAQIPipeline:
    """Simple AQI data processing pipeline without ML components"""
    
    def __init__(self):
        self.preprocessor = None
        
        # Create necessary directories
        os.makedirs(DATA_DIR, exist_ok=True)
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        logger.info("🚀 Simple AQI Pipeline initialized")
        logger.info(f"📁 Data directory: {DATA_DIR}")
    
    def process_existing_data(self) -> bool:
        """Process existing data files"""
        
        logger.info("🔧 PROCESSING EXISTING DATA")
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
        
        # Show available files and let user choose
        if len(data_files) > 1:
            logger.info("📁 Multiple data files found:")
            for i, (file_path, desc) in enumerate(data_files, 1):
                file_size = os.path.getsize(file_path) / 1024  # KB
                logger.info(f"   {i}. {desc}: {os.path.basename(file_path)} ({file_size:.1f} KB)")
            
            # Auto-select the largest file
            selected_file = max(data_files, key=lambda x: os.path.getsize(x[0]))[0]
            logger.info(f"✅ Auto-selected largest file: {os.path.basename(selected_file)}")
        else:
            selected_file = data_files[0][0]
            logger.info(f"✅ Using data file: {os.path.basename(selected_file)}")
        
        # Initialize preprocessor
        self.preprocessor = AQIDataPreprocessor()
        
        # Load and analyze data
        try:
            logger.info(f"📊 Loading data from: {selected_file}")
            df = self.preprocessor.load_raw_data(selected_file)
            
            if df.empty:
                logger.error("❌ No data loaded")
                return False
            
            # Clean data
            df_cleaned = self.preprocessor.clean_data(df)
            logger.info(f"🧹 Cleaned data: {len(df_cleaned)} records")
            
            # Pivot parameters
            df_pivoted = self.preprocessor.pivot_parameters(df_cleaned)
            logger.info(f"🔄 Pivoted data: {df_pivoted.shape}")
            
            if df_pivoted.empty:
                logger.error("❌ No data after pivoting")
                return False
            
            # Calculate AQI
            df_aqi = self.preprocessor.calculate_aqi(df_pivoted)
            logger.info(f"🧮 AQI calculated: {len(df_aqi)} records")
            
            # Add temporal features
            df_temporal = self.preprocessor.add_temporal_features(df_aqi)
            logger.info(f"⏰ Temporal features added: {df_temporal.shape}")
            
            # Handle missing values
            df_clean = self.preprocessor.handle_missing_values(df_temporal)
            logger.info(f"🔧 Missing values handled: {df_clean.shape}")
            
            # Create feature matrix
            df_features = self.preprocessor.create_feature_matrix(df_clean)
            logger.info(f"🎯 Feature matrix created: {df_features.shape}")
            
            if df_features.empty:
                logger.error("❌ No features available")
                return False
            
            # Save processed data
            processed_file = PROCESSED_DATA_FILE
            df_features.to_csv(processed_file, index=False)
            logger.info(f"💾 Processed data saved: {processed_file}")
            
            # Summary
            logger.info("📊 PROCESSING SUMMARY:")
            logger.info(f"   Original records: {len(df)}")
            logger.info(f"   Final records: {len(df_features)}")
            logger.info(f"   Features: {self.preprocessor.feature_columns}")
            logger.info(f"   Date range: {df_features['datetime'].min()} to {df_features['datetime'].max()}")
            
            # Check if suitable for LSTM
            locations = df_features['location_name'].nunique()
            avg_records_per_location = len(df_features) / locations if locations > 0 else 0
            
            logger.info(f"   Locations: {locations}")
            logger.info(f"   Avg records per location: {avg_records_per_location:.1f}")
            
            if avg_records_per_location >= 25:
                logger.info("✅ Data suitable for LSTM training!")
            else:
                logger.warning("⚠️ Need more data for LSTM training (25+ records per location)")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Data processing failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main execution function"""
    
    print("\n🎯 SIMPLE AQI DATA PROCESSOR")
    print("=" * 50)
    print("This tool processes existing AQI data without ML training")
    print("Perfect for systems with TensorFlow issues")
    print("=" * 50)
    
    # Initialize pipeline
    pipeline = SimpleAQIPipeline()
    
    # Process data
    if pipeline.process_existing_data():
        print("\n🎉 SUCCESS! Data processing completed.")
        print(f"📁 Check output: {PROCESSED_DATA_FILE}")
    else:
        print("\n❌ FAILED! Data processing encountered errors.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    input("\nPress Enter to exit...")
    sys.exit(exit_code)
