"""
OpenAQ API v3 Test Script
Test the API endpoints and parameters to debug 404 errors
"""
import requests
import json
from config import OPENAQ_BASE_URL, HEADERS, TARGET_LOCATIONS, POLLUTANT_PARAMETERS

def test_api_endpoints():
    """Test different OpenAQ API v3 endpoints"""
    
    print("🧪 Testing OpenAQ API v3 Endpoints")
    print("=" * 50)
    
    session = requests.Session()
    session.headers.update(HEADERS)
    
    # Test 1: Basic API health check
    print("\n1. Testing basic API connection...")
    try:
        response = session.get(f"{OPENAQ_BASE_URL}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API is accessible")
        else:
            print(f"   ❌ API error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection error: {str(e)}")
    
    # Test 2: Check available endpoints
    print("\n2. Testing /locations endpoint...")
    try:
        lat, lon, name = TARGET_LOCATIONS[0]  # Mumbai
        params = {
            'coordinates': f"{lat},{lon}",
            'radius': 10000,
            'limit': 10
        }
        response = session.get(f"{OPENAQ_BASE_URL}/locations", params=params)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Found {len(data.get('results', []))} locations")
            if data.get('results'):
                location = data['results'][0]
                print(f"   Sample location: {location.get('name', 'Unknown')}")
                print(f"   Available parameters: {[p.get('name') for p in location.get('parameters', [])[:5]]}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 3: Check parameters endpoint
    print("\n3. Testing /parameters endpoint...")
    try:
        response = session.get(f"{OPENAQ_BASE_URL}/parameters")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            parameters = [p.get('name') for p in data.get('results', [])]
            print(f"   ✅ Available parameters: {parameters[:10]}")
            
            # Check if our parameters are valid
            our_params = POLLUTANT_PARAMETERS
            valid_params = [p for p in our_params if p in parameters]
            invalid_params = [p for p in our_params if p not in parameters]
            
            print(f"   Valid parameters: {valid_params}")
            if invalid_params:
                print(f"   ❌ Invalid parameters: {invalid_params}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 4: Try different measurements endpoint variations
    print("\n4. Testing different measurements endpoints...")
    
    # Test various endpoint paths that might exist in v3
    endpoints_to_test = [
        '/measurements',
        '/latest',
        '/latest/measurements', 
        '/sensors/measurements',
        '/data/measurements',
        '/locations/measurements'
    ]
    
    lat, lon, name = TARGET_LOCATIONS[0]  # Mumbai
    base_params = {
        'coordinates': f"{lat},{lon}",
        'radius': 10000,
        'limit': 5
    }
    
    for endpoint in endpoints_to_test:
        try:
            response = session.get(f"{OPENAQ_BASE_URL}{endpoint}", params=base_params)
            print(f"   {endpoint}: Status {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                print(f"     ✅ Found {len(results)} records")
                if results:
                    sample = results[0]
                    print(f"     Sample keys: {list(sample.keys())[:5]}")
                    break
            elif response.status_code != 404:
                print(f"     ⚠️  Error: {response.text[:100]}")
        except Exception as e:
            print(f"     ❌ Error: {str(e)}")
    
    # Test 5: Check location-specific measurements
    print("\n5. Testing location-specific measurements...")
    try:
        # First get a specific location ID from the locations we found
        locations_response = session.get(f"{OPENAQ_BASE_URL}/locations", params={
            'coordinates': f"{lat},{lon}",
            'radius': 10000,
            'limit': 1
        })
        
        if locations_response.status_code == 200:
            locations_data = locations_response.json()
            if locations_data.get('results'):
                location_id = locations_data['results'][0].get('id')
                location_name = locations_data['results'][0].get('name')
                print(f"   Using location: {location_name} (ID: {location_id})")
                
                # Try measurements for specific location
                if location_id:
                    endpoints_with_location = [
                        f'/locations/{location_id}/measurements',
                        f'/locations/{location_id}/latest',
                        '/measurements'
                    ]
                    
                    for endpoint in endpoints_with_location:
                        try:
                            params = {'limit': 5}
                            if 'measurements' in endpoint and location_id:
                                # Don't add location params if using location-specific endpoint
                                pass
                            else:
                                params.update(base_params)
                                
                            response = session.get(f"{OPENAQ_BASE_URL}{endpoint}", params=params)
                            print(f"   {endpoint}: Status {response.status_code}")
                            
                            if response.status_code == 200:
                                data = response.json()
                                results = data.get('results', [])
                                print(f"     ✅ SUCCESS! Found {len(results)} measurements")
                                if results:
                                    sample = results[0]
                                    print(f"     Sample data structure:")
                                    for key, value in list(sample.items())[:5]:
                                        print(f"       {key}: {value}")
                                    break
                            elif response.status_code != 404:
                                print(f"     ⚠️  Error: {response.text[:100]}")
                        except Exception as e:
                            print(f"     ❌ Error: {str(e)}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 6: Check latest measurements endpoint
    print("\n6. Testing /latest endpoint (common in v3)...")
    try:
        params = {
            'coordinates': f"{lat},{lon}",
            'radius': 10000,
            'limit': 10
        }
        response = session.get(f"{OPENAQ_BASE_URL}/latest", params=params)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            print(f"   ✅ Found {len(results)} latest measurements")
            if results:
                sample = results[0]
                print(f"   Sample latest measurement structure:")
                for key, value in list(sample.items())[:8]:
                    print(f"     {key}: {value}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🔍 API Test Complete")

if __name__ == "__main__":
    test_api_endpoints()
