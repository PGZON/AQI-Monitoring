"""
Comprehensive Integration Test for AQI Monitoring System
Tests both standalone ML service and main backend integration
"""
import requests
import json
import time
import sys
from datetime import datetime

class AQISystemTester:
    def __init__(self):
        self.ml_service_url = "http://localhost:5001"
        self.main_backend_url = "http://localhost:5000"
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_ml_service_health(self):
        """Test ML service health check"""
        try:
            response = requests.get(f"{self.ml_service_url}/health", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            details = f"Status: {data.get('status', 'unknown')}, Model: {data.get('model_status', 'unknown')}"
            self.log_test("ML Service Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("ML Service Health Check", False, str(e))
            return False
    
    def test_ml_model_info(self):
        """Test ML model information endpoint"""
        try:
            response = requests.get(f"{self.ml_service_url}/model-info", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                model_type = data.get('data', {}).get('model_type', 'unknown')
                details = f"Model: {model_type}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("ML Model Info", success, details)
            return success
        except Exception as e:
            self.log_test("ML Model Info", False, str(e))
            return False
    
    def test_ml_single_prediction(self):
        """Test single AQI prediction"""
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
            
            response = requests.post(
                f"{self.ml_service_url}/predict", 
                json=test_data, 
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                aqi = data.get('data', {}).get('predicted_aqi', 'N/A')
                details = f"Predicted AQI: {aqi}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("ML Single Prediction", success, details)
            return success
        except Exception as e:
            self.log_test("ML Single Prediction", False, str(e))
            return False
    
    def test_ml_batch_prediction(self):
        """Test batch AQI predictions"""
        try:
            test_data = {
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
            
            response = requests.post(
                f"{self.ml_service_url}/batch-predict", 
                json=test_data, 
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                predictions = data.get('data', [])
                details = f"Predictions: {len(predictions)} locations"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("ML Batch Prediction", success, details)
            return success
        except Exception as e:
            self.log_test("ML Batch Prediction", False, str(e))
            return False
    
    def test_main_backend_health(self):
        """Test main backend health"""
        try:
            response = requests.get(f"{self.main_backend_url}/api/health", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                status = data.get('status', 'unknown')
                details = f"Backend Status: {status}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Main Backend Health", success, details)
            return success
        except Exception as e:
            self.log_test("Main Backend Health", False, str(e))
            return False
    
    def test_integrated_lstm_prediction(self):
        """Test integrated LSTM prediction through main backend"""
        try:
            test_data = {
                "lat": 19.0760,  # Mumbai
                "lon": 72.8777,
                "currentData": {
                    "pm25": 35.0,
                    "pm10": 65.0,
                    "no2": 20.0
                }
            }
            
            response = requests.post(
                f"{self.main_backend_url}/api/forecast/lstm-predict", 
                json=test_data, 
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                aqi = data.get('data', {}).get('predicted_aqi', 'N/A')
                category = data.get('data', {}).get('category', {}).get('category', 'N/A')
                details = f"AQI: {aqi}, Category: {category}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:100]}"
            
            self.log_test("Integrated LSTM Prediction", success, details)
            return success
        except Exception as e:
            self.log_test("Integrated LSTM Prediction", False, str(e))
            return False
    
    def test_integrated_batch_prediction(self):
        """Test integrated batch prediction through main backend"""
        try:
            test_data = {
                "locations": [
                    {
                        "lat": 19.0760,  # Mumbai
                        "lon": 72.8777,
                        "currentData": {"pm25": 30.0}
                    },
                    {
                        "lat": 28.6139,  # Delhi
                        "lon": 77.2090,
                        "currentData": {"pm25": 50.0}
                    }
                ]
            }
            
            response = requests.post(
                f"{self.main_backend_url}/api/forecast/batch-predict", 
                json=test_data, 
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                predictions = data.get('data', {}).get('predictions', [])
                details = f"Batch predictions: {len(predictions)} locations"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Integrated Batch Prediction", success, details)
            return success
        except Exception as e:
            self.log_test("Integrated Batch Prediction", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🧪 AQI Monitoring System - Comprehensive Integration Test")
        print("=" * 60)
        print()
        
        # Test ML Service
        print("🔧 Testing ML Service...")
        ml_health = self.test_ml_service_health()
        if ml_health:
            self.test_ml_model_info()
            self.test_ml_single_prediction()
            self.test_ml_batch_prediction()
        else:
            print("⚠️  ML Service not available - skipping ML tests")
        
        print()
        
        # Test Main Backend
        print("🌐 Testing Main Backend...")
        backend_health = self.test_main_backend_health()
        
        print()
        
        # Test Integration
        print("🔗 Testing Integration...")
        if ml_health and backend_health:
            self.test_integrated_lstm_prediction()
            self.test_integrated_batch_prediction()
        else:
            print("⚠️  One or both services unavailable - skipping integration tests")
        
        print()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for test in self.test_results if test['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if total - passed > 0:
            print("\n❌ Failed Tests:")
            for test in self.test_results:
                if not test['success']:
                    print(f"   - {test['test']}: {test['details']}")
        
        print("\n" + "=" * 60)
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Your AQI system is fully integrated!")
        else:
            print("⚠️  Some tests failed. Check the services and try again.")
        
        print("=" * 60)

def main():
    print("⚠️  Make sure both services are running before starting tests:")
    print("   1. ML Service: http://localhost:5001 (python backend/ml/app.py)")
    print("   2. Main Backend: http://localhost:5000 (npm run dev)")
    print()
    
    input("Press Enter when both services are ready...")
    print()
    
    tester = AQISystemTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
