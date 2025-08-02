"""
Test the updated data collector with correct API endpoints
"""
from data_collector import OpenAQDataCollector
from config import TARGET_LOCATIONS
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_updated_collector():
    """Test the updated data collector"""
    
    print("🧪 Testing Updated OpenAQ Data Collector")
    print("=" * 50)
    
    collector = OpenAQDataCollector()
    
    # Test with Mumbai coordinates
    lat, lon, name = TARGET_LOCATIONS[0]  # Mumbai
    
    print(f"📍 Testing with {name} ({lat:.4f}, {lon:.4f})")
    
    # Test 1: Get location info
    print("\n1. Getting location information...")
    location_info = collector.get_location_info(lat, lon)
    
    if location_info['total_locations'] > 0:
        print(f"✅ Found {location_info['total_locations']} monitoring stations")
        print(f"📊 Available parameters: {location_info['parameters_available']}")
        print(f"🏢 Sample stations: {location_info['sample_location_names']}")
    else:
        print("❌ No monitoring stations found")
        return
    
    # Test 2: Get locations near coordinates
    print("\n2. Getting detailed location list...")
    locations = collector.get_locations_near_coordinates(lat, lon)
    
    if locations:
        sample_location = locations[0]
        location_id = sample_location.get('id')
        location_name = sample_location.get('name')
        
        print(f"✅ Sample location: {location_name} (ID: {location_id})")
        
        # Test 3: Get latest measurements
        if location_id:
            print(f"\n3. Getting latest measurements for {location_name}...")
            # Use the full location data instead of just ID and name
            measurements = collector.get_latest_measurements_for_location(sample_location)
            
            if measurements:
                print(f"✅ Retrieved {len(measurements)} measurements")
                
                # Show sample measurements
                print("\n📊 Sample measurements:")
                for i, measurement in enumerate(measurements[:5]):
                    param = measurement.get('parameter', 'Unknown')
                    value = measurement.get('value', 'N/A')
                    unit = measurement.get('unit', '')
                    datetime_str = measurement.get('datetime', 'Unknown')
                    print(f"   {i+1}. {param}: {value} {unit} at {datetime_str}")
                
                # Test 4: Try mini data collection (just one location)
                print(f"\n4. Testing mini data collection...")
                mini_target_locations = [(lat, lon, name)]
                
                # Temporarily modify target locations for test
                original_locations = TARGET_LOCATIONS.copy()
                TARGET_LOCATIONS.clear()
                TARGET_LOCATIONS.extend(mini_target_locations)
                
                try:
                    df = collector.collect_data_for_all_locations()
                    
                    if not df.empty:
                        print(f"✅ Mini collection successful!")
                        print(f"   Records collected: {len(df)}")
                        print(f"   Unique parameters: {df['parameter'].nunique()}")
                        print(f"   Parameter types: {df['parameter'].unique()[:5]}")
                    else:
                        print("❌ No data collected")
                        
                finally:
                    # Restore original locations
                    TARGET_LOCATIONS.clear()
                    TARGET_LOCATIONS.extend(original_locations)
            else:
                print("❌ No measurements retrieved")
        else:
            print("❌ No location ID found")
    else:
        print("❌ No detailed locations found")
    
    print("\n" + "=" * 50)
    print("🔍 Updated Collector Test Complete")

if __name__ == "__main__":
    test_updated_collector()
