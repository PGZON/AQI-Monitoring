"""
Enhanced debug script to get sensor and parameter information
"""
import requests
import json
from config import OPENAQ_BASE_URL, HEADERS, TARGET_LOCATIONS

def debug_sensors_and_parameters():
    """Debug sensor information to get parameter mappings"""
    
    print("🔍 Debugging Sensors and Parameters")
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
        print(f"📊 Location structure:")
        print(json.dumps(location, indent=2))
        
        # Get latest measurements to get sensor IDs
        print(f"\n📊 Getting sensor IDs from measurements...")
        measurements_response = session.get(f"{OPENAQ_BASE_URL}/locations/{location_id}/latest")
        
        if measurements_response.status_code == 200:
            measurements_data = measurements_response.json()
            measurements = measurements_data.get('results', [])
            
            # Collect unique sensor IDs
            sensor_ids = list(set([m.get('sensorsId') for m in measurements if m.get('sensorsId')]))
            print(f"✅ Found {len(sensor_ids)} unique sensors: {sensor_ids[:5]}...")
            
            # Test sensors endpoint
            print(f"\n🔧 Testing /sensors endpoint...")
            sensors_response = session.get(f"{OPENAQ_BASE_URL}/sensors")
            print(f"Sensors endpoint status: {sensors_response.status_code}")
            
            if sensors_response.status_code == 200:
                sensors_data = sensors_response.json()
                print(f"Sensors response keys: {list(sensors_data.keys())}")
                if 'results' in sensors_data:
                    print(f"Number of sensors: {len(sensors_data['results'])}")
                    if sensors_data['results']:
                        sample_sensor = sensors_data['results'][0]
                        print(f"Sample sensor structure:")
                        print(json.dumps(sample_sensor, indent=2))
            
            # Try to get specific sensor info
            if sensor_ids:
                sample_sensor_id = sensor_ids[0]
                print(f"\n🔧 Testing specific sensor endpoint: /sensors/{sample_sensor_id}")
                
                sensor_response = session.get(f"{OPENAQ_BASE_URL}/sensors/{sample_sensor_id}")
                print(f"Specific sensor status: {sensor_response.status_code}")
                
                if sensor_response.status_code == 200:
                    sensor_data = sensor_response.json()
                    print(f"Specific sensor data:")
                    print(json.dumps(sensor_data, indent=2))
                else:
                    print(f"Sensor error: {sensor_response.text}")
        
        # Test different approaches to get parameters
        print(f"\n🧪 Testing different parameter approaches...")
        
        # Approach 1: Check if location has parameter info
        location_params = location.get('parameters', [])
        print(f"Location parameters: {location_params}")
        
        # Approach 2: Try parameters endpoint with location filter
        params_response = session.get(f"{OPENAQ_BASE_URL}/parameters", params={
            'location_id': location_id
        })
        print(f"Parameters with location filter status: {params_response.status_code}")
        if params_response.status_code == 200:
            params_data = params_response.json()
            print(f"Parameters data: {params_data}")
        
        # Approach 3: Try to infer from measurement values
        print(f"\n🔍 Attempting to infer parameters from measurement patterns...")
        if measurements:
            values = [m.get('value') for m in measurements]
            print(f"Measurement values: {values}")
            
            # Common AQI parameter value ranges for inference
            value_ranges = {
                'pm25': (0, 300),
                'pm10': (0, 500), 
                'co': (0, 50),
                'no2': (0, 200),
                'o3': (0, 300),
                'so2': (0, 100),
                'aqi': (0, 500)
            }
            
            print(f"Possible parameter inference:")
            for i, value in enumerate(values[:10]):
                if value is not None:
                    possible_params = []
                    for param, (min_val, max_val) in value_ranges.items():
                        if min_val <= value <= max_val:
                            possible_params.append(param)
                    print(f"  Value {value}: could be {possible_params}")

if __name__ == "__main__":
    debug_sensors_and_parameters()
