"""
Data Collection Menu - No TensorFlow Dependencies
Focuses on data collection and preprocessing only
"""
import os
import sys
import time
import logging
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import with error handling
try:
    from data_collector import OpenAQDataCollector
    print("✅ data_collector imported successfully")
except Exception as e:
    print(f"❌ Failed to import data_collector: {e}")
    sys.exit(1)

try:
    from historical_collector import HistoricalDataCollector
    print("✅ historical_collector imported successfully")
except Exception as e:
    print(f"❌ Failed to import historical_collector: {e}")
    sys.exit(1)

try:
    from data_preprocessor import AQIDataPreprocessor
    print("✅ data_preprocessor imported successfully")
except Exception as e:
    print(f"❌ Failed to import data_preprocessor: {e}")
    print("⚠️ Continuing without preprocessing capabilities")
    AQIDataPreprocessor = None

try:
    from config import *
    print("✅ config imported successfully")
except Exception as e:
    print(f"❌ Failed to import config: {e}")
    sys.exit(1)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataCollectionPipeline:
    """Data collection and preprocessing pipeline without ML components"""
    
    def __init__(self):
        self.latest_collector = None
        self.historical_collector = None
        self.preprocessor = None
        
        # Create necessary directories
        os.makedirs(DATA_DIR, exist_ok=True)
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        logger.info("🚀 Data Collection Pipeline initialized")
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
    
    def collect_latest_data(self) -> bool:
        """Step 1: Collect latest measurements from all locations"""
        
        logger.info("📊 STEP 1: Latest Data Collection")
        logger.info("=" * 50)
        
        # Check if data already exists
        if os.path.exists(RAW_DATA_FILE):
            logger.info(f"✅ Raw data file exists: {RAW_DATA_FILE}")
            response = input("🤔 Recollect latest data? (y/N): ").lower().strip()
            if response != 'y':
                logger.info("⏭️ Skipping latest data collection")
                return True
        
        # Check API key
        if not self.check_api_key():
            return False
        
        # Initialize collector
        self.latest_collector = OpenAQDataCollector()
        
        # Test API connection
        logger.info("🔌 Testing API connection...")
        test_location = TARGET_LOCATIONS[0]
        location_info = self.latest_collector.get_location_info(test_location[0], test_location[1])
        
        if location_info['total_locations'] == 0:
            logger.error("❌ API connection failed or no monitoring stations found")
            return False
        
        logger.info(f"✅ API connection successful!")
        logger.info(f"📊 Found {location_info['total_locations']} monitoring stations")
        
        # Start data collection
        logger.info("🚀 Starting latest data collection...")
        start_time = time.time()
        
        df = self.latest_collector.collect_data_for_all_locations()
        
        end_time = time.time()
        duration = (end_time - start_time) / 60
        
        if not df.empty:
            logger.info(f"🎉 Latest data collection completed!")
            logger.info(f"⏱️ Duration: {duration:.1f} minutes")
            logger.info(f"📊 Records collected: {len(df)}")
            return True
        else:
            logger.error("❌ Latest data collection failed!")
            return False
    
    def collect_historical_data(self) -> bool:
        """Step 2: Collect historical data over time range"""
        
        logger.info("📅 STEP 2: Historical Data Collection")
        logger.info("=" * 50)
        
        # Check API key
        if not self.check_api_key():
            return False
        
        # Initialize historical collector
        self.historical_collector = HistoricalDataCollector()
        
        # Show date range options with examples
        print(f"📅 Default date range: {DATE_FROM.strftime('%Y-%m-%d')} to {DATE_TO.strftime('%Y-%m-%d')} ({(DATE_TO - DATE_FROM).days} days)")
        print("\n📋 Date Range Options:")
        print("   1. ✅ Use default (10 days) - Recommended for testing")
        print("   2. 📊 Quick options:")
        print("      • 3 days   - Very fast, minimal data")
        print("      • 7 days   - Fast, good for testing")
        print("      • 30 days  - Medium, good for training")
        print("      • 90 days  - Slow, best for ML models")
        print("   3. 🎯 Custom range - Enter your own dates")
        print("\n💡 Examples:")
        print("   • For LSTM training: Need 30+ days per location")
        print("   • For testing: 3-7 days is sufficient")
        print("   • More days = better models but slower collection")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == '1':
            # Use default
            date_from, date_to = DATE_FROM, DATE_TO
            print(f"✅ Using default: {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}")
            
        elif choice == '2':
            # Quick options
            print("\n📊 Quick Options:")
            print("   1. 3 days   (fast)")
            print("   2. 7 days   (medium)")
            print("   3. 30 days  (recommended)")
            print("   4. 90 days  (comprehensive)")
            
            quick_choice = input("Select days (1-4): ").strip()
            
            days_map = {'1': 3, '2': 7, '3': 30, '4': 90}
            days = days_map.get(quick_choice, 10)
            
            date_from = datetime.now() - timedelta(days=days)
            date_to = datetime.now()
            print(f"✅ Selected: {days} days ({date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')})")
            
        elif choice == '3':
            # Custom range
            print("\n🎯 Custom Date Range:")
            print("💡 Format examples:")
            print("   • 7     → Last 7 days")
            print("   • 30    → Last 30 days")
            print("   • 2025-07-01 to 2025-08-01 → Specific range")
            
            custom_input = input("Enter range: ").strip()
            
            try:
                # Try parsing as number of days
                if custom_input.isdigit():
                    days = int(custom_input)
                    if days > 365:
                        print("⚠️ Maximum 365 days allowed")
                        days = 365
                    date_from = datetime.now() - timedelta(days=days)
                    date_to = datetime.now()
                    print(f"✅ Last {days} days: {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}")
                    
                # Try parsing as date range
                elif ' to ' in custom_input:
                    from_str, to_str = custom_input.split(' to ')
                    date_from = datetime.strptime(from_str.strip(), '%Y-%m-%d')
                    date_to = datetime.strptime(to_str.strip(), '%Y-%m-%d')
                    
                    if date_from > date_to:
                        date_from, date_to = date_to, date_from
                        
                    if (date_to - date_from).days > 365:
                        print("⚠️ Range too large, limiting to 365 days")
                        date_from = date_to - timedelta(days=365)
                        
                    print(f"✅ Custom range: {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}")
                    
                else:
                    print("❌ Invalid format, using default")
                    date_from, date_to = DATE_FROM, DATE_TO
                    
            except ValueError:
                print("❌ Invalid date format, using default")
                date_from, date_to = DATE_FROM, DATE_TO
                
        else:
            print("❌ Invalid choice, using default")
            date_from, date_to = DATE_FROM, DATE_TO
        
        # Estimate collection time
        total_locations = len(TARGET_LOCATIONS)
        days_span = (date_to - date_from).days
        estimated_time = (total_locations * days_span * 0.1 * REQUEST_DELAY) / 60  # Rough estimate
        
        print(f"\n📊 Historical collection plan:")
        print(f"   Target areas: {total_locations}")
        print(f"   Date range: {days_span} days ({date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')})")
        print(f"   Estimated time: {estimated_time:.1f} minutes")
        
        if days_span < 7:
            print("   ⚠️ Note: Less than 7 days may not provide enough data for LSTM training")
        elif days_span >= 30:
            print("   ✅ Good: 30+ days should provide sufficient data for ML training")
        
        proceed = input("\n🚀 Start historical data collection? (Y/n): ").lower().strip()
        if proceed == 'n':
            logger.info("⏹️ Historical data collection cancelled")
            return False
        
        # Start collection
        start_time = time.time()
        df = self.historical_collector.collect_historical_data_for_all_locations(date_from, date_to)
        end_time = time.time()
        
        duration = (end_time - start_time) / 60
        
        if not df.empty:
            logger.info(f"🎉 Historical data collection completed!")
            logger.info(f"⏱️ Duration: {duration:.1f} minutes")
            logger.info(f"📊 Total records: {len(df)}")
            logger.info(f"📅 Date range: {df['datetime'].min()} to {df['datetime'].max()}")
            return True
        else:
            logger.error("❌ Historical data collection failed!")
            return False
    
    def preprocess_data(self) -> bool:
        """Step 3: Preprocess collected data"""
        
        logger.info("🔧 STEP 3: Data Preprocessing")
        logger.info("=" * 50)
        
        # Check if preprocessor is available
        if AQIDataPreprocessor is None:
            logger.error("❌ Data preprocessor not available (TensorFlow import issue)")
            logger.info("💡 You can still view raw data, but preprocessing is disabled")
            return False
        
        # Check for data files
        data_files = []
        if os.path.exists(RAW_DATA_FILE):
            data_files.append(RAW_DATA_FILE)
        if os.path.exists(f"{DATA_DIR}/historical_openaq_data.csv"):
            data_files.append(f"{DATA_DIR}/historical_openaq_data.csv")
        
        if not data_files:
            logger.error("❌ No data files found!")
            logger.info("💡 Please run data collection first")
            return False
        
        logger.info(f"📁 Found data files: {data_files}")
        
        # Choose which file to process
        if len(data_files) > 1:
            print("\n📋 Available data files:")
            for i, file in enumerate(data_files, 1):
                file_size = os.path.getsize(file) / 1024  # KB
                print(f"   {i}. {os.path.basename(file)} ({file_size:.1f} KB)")
            
            try:
                choice = int(input("Select file to process (1-2): "))
                selected_file = data_files[choice - 1]
            except (ValueError, IndexError):
                logger.info("Using latest data file")
                selected_file = data_files[0]
        else:
            selected_file = data_files[0]
        
        logger.info(f"📊 Processing: {selected_file}")
        
        # Initialize preprocessor
        self.preprocessor = AQIDataPreprocessor()
        
        # Run preprocessing (without LSTM sequences to avoid TensorFlow)
        try:
            # Load and clean data
            df = self.preprocessor.load_raw_data(selected_file)
            if df.empty:
                logger.error("❌ No data to process")
                return False
            
            # Clean data
            df = self.preprocessor.clean_data(df)
            
            # Pivot parameters
            df = self.preprocessor.pivot_parameters(df)
            
            # Calculate AQI
            df = self.preprocessor.calculate_aqi(df)
            
            # Add temporal features
            df = self.preprocessor.add_temporal_features(df)
            
            # Handle missing values
            df = self.preprocessor.handle_missing_values(df)
            
            # Create feature matrix
            df = self.preprocessor.create_feature_matrix(df)
            
            # Save processed data (without LSTM sequences)
            df.to_csv(PROCESSED_DATA_FILE, index=False)
            logger.info(f"💾 Processed data saved: {PROCESSED_DATA_FILE}")
            
            logger.info(f"🎉 Data preprocessing completed!")
            logger.info(f"📊 Final dataset: {len(df)} records")
            logger.info(f"🧪 Features: {self.preprocessor.feature_columns}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def view_data_summary(self):
        """View summary of collected and processed data"""
        
        logger.info("📊 DATA SUMMARY")
        logger.info("=" * 50)
        
        # Check available files
        files_to_check = [
            (RAW_DATA_FILE, "Latest Raw Data"),
            (f"{DATA_DIR}/historical_openaq_data.csv", "Historical Raw Data"),
            (PROCESSED_DATA_FILE, "Processed Data")
        ]
        
        for file_path, file_desc in files_to_check:
            if os.path.exists(file_path):
                try:
                    df = pd.read_csv(file_path)
                    file_size = os.path.getsize(file_path) / 1024  # KB
                    
                    logger.info(f"\n📁 {file_desc}:")
                    logger.info(f"   File: {os.path.basename(file_path)}")
                    logger.info(f"   Size: {file_size:.1f} KB")
                    logger.info(f"   Records: {len(df)}")
                    logger.info(f"   Columns: {list(df.columns)}")
                    
                    if 'datetime' in df.columns:
                        logger.info(f"   Date range: {df['datetime'].min()} to {df['datetime'].max()}")
                    
                    if 'parameter' in df.columns:
                        params = df['parameter'].value_counts()
                        logger.info(f"   Parameters: {dict(params.head())}")
                    
                    if 'location_name' in df.columns:
                        locations = df['location_name'].nunique()
                        logger.info(f"   Unique locations: {locations}")
                        
                except Exception as e:
                    logger.error(f"   ❌ Error reading {file_desc}: {str(e)}")
            else:
                logger.info(f"\n📁 {file_desc}: ❌ Not found")

def main():
    """Main execution function"""
    
    pipeline = DataCollectionPipeline()
    
    # Show menu
    while True:
        print("\n🎯 AQI DATA COLLECTION PIPELINE")
        print("=" * 50)
        print("1. 📊 Collect Latest Data (current measurements)")
        print("2. 📅 Collect Historical Data (time series)")
        print("3. 🔧 Preprocess Data")
        print("4. 📋 View Data Summary")
        print("5. 🚀 Run Collection + Preprocessing")
        print("6. ❌ Exit")
        print("=" * 50)
        
        choice = input("Select option (1-6): ").strip()
        
        if choice == '1':
            pipeline.collect_latest_data()
        elif choice == '2':
            pipeline.collect_historical_data()
        elif choice == '3':
            pipeline.preprocess_data()
        elif choice == '4':
            pipeline.view_data_summary()
        elif choice == '5':
            # Run collection + preprocessing
            success = True
            success &= pipeline.collect_latest_data()
            if success:
                print("\n" + "="*20)
                use_historical = input("Also collect historical data? (y/N): ").lower().strip()
                if use_historical == 'y':
                    success &= pipeline.collect_historical_data()
            if success:
                success &= pipeline.preprocess_data()
            
            if success:
                print(f"\n🎉 Complete pipeline executed successfully!")
                pipeline.view_data_summary()
        elif choice == '6':
            logger.info("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please select 1-6.")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    # Import pandas here to avoid TensorFlow issues
    import pandas as pd
    main()
