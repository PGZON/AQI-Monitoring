"""
Simple Data Collection Test - Test CSV generation
"""
import os
import sys
import pandas as pd
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import config
from config import *

def test_csv_generation():
    """Test if we can generate CSV files"""
    
    print("🧪 Testing CSV Generation")
    print("=" * 40)
    
    # Create directories
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"✅ Data directory created: {DATA_DIR}")
    
    # Test CSV creation
    test_data = {
        'datetime': [datetime.now(), datetime.now() - timedelta(hours=1)],
        'parameter': ['pm25', 'pm10'],
        'value': [25.5, 45.2],
        'location_name': ['Test Location', 'Test Location'],
        'latitude': [19.0760, 19.0760],
        'longitude': [72.8777, 72.8777]
    }
    
    df = pd.DataFrame(test_data)
    test_file = f"{DATA_DIR}/test_data.csv"
    
    try:
        df.to_csv(test_file, index=False)
        print(f"✅ Test CSV created: {test_file}")
        print(f"📊 Records: {len(df)}")
        
        # Verify file exists and is readable
        if os.path.exists(test_file):
            df_read = pd.read_csv(test_file)
            print(f"✅ File readable: {len(df_read)} records")
            return True
        else:
            print("❌ File not created")
            return False
            
    except Exception as e:
        print(f"❌ CSV creation failed: {e}")
        return False

def test_imports():
    """Test if all required imports work"""
    
    print("\n🔍 Testing Imports")
    print("=" * 40)
    
    try:
        from data_collector import OpenAQDataCollector
        print("✅ data_collector imported")
    except Exception as e:
        print(f"❌ data_collector import failed: {e}")
        return False
    
    try:
        from historical_collector import HistoricalDataCollector
        print("✅ historical_collector imported")
    except Exception as e:
        print(f"❌ historical_collector import failed: {e}")
        return False
    
    try:
        from data_preprocessor import AQIDataPreprocessor
        print("✅ data_preprocessor imported")
    except Exception as e:
        print(f"❌ data_preprocessor import failed: {e}")
        return False
    
    return True

def test_config():
    """Test configuration"""
    
    print("\n⚙️ Testing Configuration")
    print("=" * 40)
    
    print(f"API Key configured: {'✅' if OPENAQ_API_KEY != 'your-api-key-here' else '❌'}")
    print(f"Target locations: {len(TARGET_LOCATIONS)}")
    print(f"Data directory: {DATA_DIR}")
    print(f"Raw data file: {RAW_DATA_FILE}")
    print(f"Date range: {DATE_FROM.strftime('%Y-%m-%d')} to {DATE_TO.strftime('%Y-%m-%d')}")
    
    return True

if __name__ == "__main__":
    print("🚀 DATA MENU DIAGNOSTICS")
    print("=" * 50)
    
    # Run tests
    config_ok = test_config()
    csv_ok = test_csv_generation()
    imports_ok = test_imports()
    
    print("\n📋 SUMMARY")
    print("=" * 20)
    print(f"Configuration: {'✅' if config_ok else '❌'}")
    print(f"CSV Generation: {'✅' if csv_ok else '❌'}")
    print(f"Imports: {'✅' if imports_ok else '❌'}")
    
    if all([config_ok, csv_ok, imports_ok]):
        print("\n🎉 All tests passed! Data menu should work.")
    else:
        print("\n❌ Some tests failed. Check errors above.")
