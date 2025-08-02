"""
Debug script to examine the exact structure of OpenAQ API responses
"""
import requests
import json
from config import OPENAQ_BASE_URL, HEADERS, TARGET_LOCATIONS

def debug_api_response():
    """Debug the actual API response structure"""
    
    print("🔍 Debugging OpenAQ API Response Structure")
    print("=" * 60)
    
    session = requests.Session()
    session.headers.update(HEADERS)
    
    # Get Mumbai location
    lat, lon, name = TARGET_LOCATIONS[0]  # Mumbai
    
    # Get locations first
    print(f"📍 Getting locations near {name}...")
    locations_response = session.get(f"{OPENAQ_BASE_URL}/locations", params={
        'coordinates': f"{lat},{lon}",
        'radius': 10000,
        'limit': 1
    })
    
    if locations_response.status_code == 200:
        locations_data = locations_response.json()
        location = locations_data['results'][0]
        location_id = location.get('id')
        location_name = location.get('name')
        
        print(f"✅ Sample location: {location_name} (ID: {location_id})")
        
        # Get latest measurements
        print(f"\n📊 Getting latest measurements...")
        measurements_response = session.get(f"{OPENAQ_BASE_URL}/locations/{location_id}/latest")
        
        if measurements_response.status_code == 200:
            measurements_data = measurements_response.json()
            measurements = measurements_data.get('results', [])
            
            print(f"✅ Found {len(measurements)} measurements")
            
            if measurements:
                print(f"\n🔍 RAW API Response Structure:")
                print("=" * 40)
                
                # Show first measurement in detail
                sample_measurement = measurements[0]
                print(f"Sample measurement (full structure):")
                print(json.dumps(sample_measurement, indent=2))
                
                print(f"\n📋 All measurements summary:")
                print("=" * 40)
                
                for i, measurement in enumerate(measurements[:10]):  # First 10
                    print(f"\nMeasurement {i+1}:")
                    print(f"  Keys: {list(measurement.keys())}")
                    print(f"  Value: {measurement.get('value')}")
                    print(f"  Unit: {measurement.get('unit')}")
                    print(f"  Parameter field: {measurement.get('parameter')}")
                    print(f"  Parameter type: {type(measurement.get('parameter'))}")
                    
                    # Check for parameter in sensor field
                    sensor = measurement.get('sensor', {})
                    if sensor:
                        print(f"  Sensor keys: {list(sensor.keys()) if isinstance(sensor, dict) else 'Not a dict'}")
                        if isinstance(sensor, dict):
                            sensor_param = sensor.get('parameter')
                            print(f"  Sensor parameter: {sensor_param}")
                            print(f"  Sensor parameter type: {type(sensor_param)}")
                    
                    # Check datetime structure
                    datetime_info = measurement.get('datetime')
                    print(f"  Datetime: {datetime_info}")
                    print(f"  Datetime type: {type(datetime_info)}")
                    
                    print(f"  " + "-" * 30)
                
        else:
            print(f"❌ Measurements request failed: {measurements_response.status_code}")
            print(f"Error: {measurements_response.text}")
    else:
        print(f"❌ Locations request failed: {locations_response.status_code}")
        print(f"Error: {locations_response.text}")

if __name__ == "__main__":
    debug_api_response()
