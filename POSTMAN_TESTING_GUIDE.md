# 🧪 ML API Testing Guide for Postman

## 📋 Quick Start

1. **Import Collection**: Import `ML_API_Tests.postman_collection.json` into Postman
2. **Set Environment**: Create environment variables:
   - `ml_service_url` = `http://localhost:5001`
   - `main_backend_url` = `http://localhost:5000`

## 🎯 Test Endpoints

### **1. Health Checks**
- **GET** `http://localhost:5001/health` - ML service health
- **GET** `http://localhost:5001/` - Service info & model status
- **GET** `http://localhost:5001/model-info` - Detailed model information

### **2. Direct ML Service (Port 5001)**

#### Single Prediction
```
POST http://localhost:5001/predict
Content-Type: application/json

{
    "latitude": 19.0760,
    "longitude": 72.8777,
    "current_data": {
        "pm25": 35.0,
        "pm10": 65.0,
        "no2": 20.0,
        "co": 1.5,
        "o3": 30.0,
        "so2": 8.0
    }
}
```

#### Batch Prediction
```
POST http://localhost:5001/batch-predict
Content-Type: application/json

{
    "locations": [
        {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "current_data": {"pm25": 35.0, "pm10": 65.0}
        },
        {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "current_data": {"pm25": 50.0, "pm10": 85.0}
        }
    ]
}
```

### **3. Main Backend Integration (Port 5000)**

#### LSTM Prediction
```
POST http://localhost:5000/api/forecast/lstm-predict
Content-Type: application/json

{
    "lat": 19.0760,
    "lon": 72.8777,
    "currentData": {
        "pm25": 40.0,
        "pm10": 70.0,
        "no2": 22.0
    }
}
```

#### Batch Predictions
```
POST http://localhost:5000/api/forecast/batch-predict
Content-Type: application/json

{
    "locations": [
        {
            "lat": 19.0760,
            "lon": 72.8777,
            "currentData": {"pm25": 35.0}
        }
    ]
}
```

## 📊 Expected Responses

### ✅ Successful Prediction Response
```json
{
    "success": true,
    "data": {
        "predicted_aqi": 85.3,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "prediction_time": "2025-08-02T10:30:00.000Z",
        "input_data": {
            "pm25": 35.0,
            "pm10": 65.0
        },
        "status": "success"
    }
}
```

### 📋 Model Info Response
```json
{
    "success": true,
    "data": {
        "model_type": "Location-Aware LSTM",
        "input_features": 15,
        "sequence_length": 24,
        "model_loaded": true,
        "performance": {
            "validation_mae": "32.75 AQI units",
            "test_mae": "44.60 AQI units",
            "accuracy_30_aqi": "45.9%"
        }
    }
}
```

## 🧪 Test Scenarios

### **Test 1: Basic Health Check**
- Run `Health Check` request
- Should return `"status": "healthy"`

### **Test 2: Model Information**
- Run `Model Information` request
- Should show model is loaded and performance metrics

### **Test 3: Mumbai Prediction**
- Run `Single AQI Prediction - Mumbai`
- Should return AQI prediction for Mumbai coordinates

### **Test 4: Delhi with Pollution Data**
- Run `Single AQI Prediction - Delhi with Pollution Data`
- Should use provided pollution values in prediction

### **Test 5: Batch Predictions**
- Run `Batch Predictions - Multiple Cities`
- Should return array of predictions for Mumbai, Delhi, Bangalore

### **Test 6: Main Backend Integration**
- Run `Main Backend - LSTM Prediction`
- Should work through main backend API (port 5000)

### **Test 7: Error Handling**
- Run `Error Test - Invalid Coordinates`
- Should return validation error for coordinates > 90/-90

## 🔍 Debugging Tips

1. **Model Not Loaded**: Check if `best_lstm_model.keras` exists in `backend/ml/saved_models/`
2. **Service Unavailable**: Verify ML service is running on port 5001
3. **Validation Errors**: Check latitude (-90 to 90) and longitude (-180 to 180) ranges
4. **Integration Issues**: Ensure main backend (port 5000) can reach ML service (port 5001)

## 📈 Performance Benchmarks

- **Response Time**: < 2 seconds for single prediction
- **Batch Processing**: < 5 seconds for 5 locations
- **Model Accuracy**: ~33 AQI units MAE (validation)
- **Memory Usage**: ~500MB for loaded model

## 🚀 Quick Test Commands

**cURL Examples:**
```bash
# Health check
curl http://localhost:5001/health

# Single prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude":19.076,"longitude":72.8777}'

# Model info
curl http://localhost:5001/model-info
```

Happy Testing! 🎉
