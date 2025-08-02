"""
Test script for AQI ML Backend Service integration
"""
import requests
import json
import sys
import os

# Add the parent directory to the path to import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_ml_service():
    """Test the ML service endpoints"""
    
    base_url = "http://localhost:5001"
    
    print("🧪 Testing AQI ML Backend Service...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health: {data}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 2: Home endpoint
    print("\n2️⃣ Testing home endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Home: {data}")
        else:
            print(f"❌ Home failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Home error: {e}")
    
    # Test 3: Model info
    print("\n3️⃣ Testing model info endpoint...")
    try:
        response = requests.get(f"{base_url}/model-info")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model Info: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Model info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model info error: {e}")
    
    # Test 4: Single prediction
    print("\n4️⃣ Testing single prediction...")
    try:
        test_data = {
            "latitude": 19.0760,  # Mumbai
            "longitude": 72.8777,
            "current_data": {
                "pm25": 35.0,
                "pm10": 65.0,
                "no2": 20.0,
                "co": 1.5,
                "o3": 25.0,
                "so2": 8.0
            }
        }
        
        response = requests.post(f"{base_url}/predict", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prediction: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Prediction error: {e}")
    
    # Test 5: Batch prediction
    print("\n5️⃣ Testing batch prediction...")
    try:
        batch_data = {
            "locations": [
                {
                    "latitude": 19.0760,  # Mumbai
                    "longitude": 72.8777,
                    "current_data": {"pm25": 30.0, "pm10": 50.0}
                },
                {
                    "latitude": 28.6139,  # Delhi
                    "longitude": 77.2090,
                    "current_data": {"pm25": 45.0, "pm10": 80.0}
                }
            ]
        }
        
        response = requests.post(f"{base_url}/batch-predict", json=batch_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Batch Prediction: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Batch prediction failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete!")

if __name__ == "__main__":
    print("⚠️  Make sure the ML service is running on http://localhost:5001")
    print("Run: python backend/ml/app.py")
    print()
    input("Press Enter when ready to test...")
    test_ml_service()
