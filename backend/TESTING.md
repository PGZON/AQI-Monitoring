# AQI Backend API Testing Guide

This guide provides comprehensive instructions for testing the AQI Monitoring Backend API using various tools and methods.

## 🚀 Quick Start

### 1. Environment Setup

First, ensure your `.env` file is configured:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/airquality

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000

# API Keys for AQI data integration
OPENWEATHER_API_KEY=your_openweather_api_key_here
OSM_API_URL=https://nominatim.openstreetmap.org
```

### 2. Start the Server

```bash
cd backend
npm install
npm run dev
```

The server should start on `http://localhost:5000`

## 🧪 Testing with cURL

### Phase 1: Authentication Testing

#### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user",
    "preferences": {...}
  }
}
```

#### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the returned token for subsequent requests.

#### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Phase 2: AQI Data Testing

#### 1. Fetch AQI Data for Coordinates
```bash
curl -X POST http://localhost:5000/api/aqi/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lat": 40.7128,
    "lon": -74.0060,
    "saveToHistory": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "AQI data fetched successfully",
  "data": {
    "aqi": {
      "index": 75,
      "level": "Moderate",
      "category": "Moderate"
    },
    "pollutants": {
      "pm2_5": { "value": 15.2, "unit": "μg/m³" },
      "pm10": { "value": 25.4, "unit": "μg/m³" },
      "co": { "value": 233.4, "unit": "μg/m³" },
      "no2": { "value": 18.7, "unit": "μg/m³" },
      "o3": { "value": 67.8, "unit": "μg/m³" },
      "so2": { "value": 3.2, "unit": "μg/m³" }
    },
    "location": {
      "city": "New York",
      "country": "United States",
      "state": "New York",
      "formatted": "New York, New York, United States"
    },
    "weather": {
      "temperature": 22.5,
      "humidity": 65,
      "pressure": 1013,
      "windSpeed": 3.2,
      "windDirection": 180
    },
    "health": {
      "level": "Moderate",
      "message": "Air quality is acceptable for most people...",
      "recommendations": [...]
    },
    "cached": false
  }
}
```

#### 2. Get AQI History
```bash
curl -X GET "http://localhost:5000/api/aqi/history?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Get Nearby AQI Data
```bash
curl -X GET "http://localhost:5000/api/aqi/nearby?lat=40.7128&lon=-74.0060&radius=10&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get AQI Analytics
```bash
curl -X GET "http://localhost:5000/api/aqi/analytics?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Check Service Health
```bash
curl -X GET http://localhost:5000/api/aqi/health
```

### Phase 3: History & Analytics Testing

#### 1. Get User's Detailed History
```bash
curl -X GET "http://localhost:5000/api/history/user?page=1&limit=20&days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User history retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 98,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 2. Get Heatmap Data (Public)
```bash
curl -X GET "http://localhost:5000/api/history/heatmap?range=7d&limit=50"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Heatmap data retrieved successfully",
  "count": 25,
  "range": "7d",
  "data": [
    {
      "location": "New York, New York, United States",
      "city": "New York",
      "country": "United States",
      "lat": 40.7128,
      "lon": -74.0060,
      "avgAQI": 85.2,
      "maxAQI": 120,
      "minAQI": 45,
      "count": 156,
      "level": "Moderate"
    }
  ]
}
```

#### 3. Get ML-Ready Time Series Data
```bash
curl -X GET "http://localhost:5000/api/history/ml-data?city=Mumbai&days=30&interval=daily" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ML training data retrieved successfully",
  "count": 30,
  "params": {
    "city": "Mumbai",
    "days": 30,
    "interval": "daily",
    "dataPoints": 30
  },
  "data": [
    {
      "timestamp": "2025-07-01T00:00:00.000Z",
      "aqi": 125.5,
      "pollutants": {
        "pm2_5": 65.2,
        "pm10": 85.1,
        "co": 1200.5,
        "no2": 45.3,
        "o3": 67.8,
        "so2": 12.1
      },
      "weather": {
        "temperature": 32.1,
        "humidity": 78.5,
        "pressure": 1008.2,
        "windSpeed": 4.2
      },
      "dataPoints": 24
    }
  ]
}
```

#### 4. Get Trend Analysis
```bash
curl -X GET "http://localhost:5000/api/history/trends?city=Delhi&days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Location Statistics (Public)
```bash
curl -X GET "http://localhost:5000/api/history/location-stats?location=Mumbai&days=30"
```

#### 6. Get Global Statistics (Public)
```bash
curl -X GET "http://localhost:5000/api/history/global-stats?days=7"
```

#### 7. Check History Service Health
```bash
curl -X GET http://localhost:5000/api/history/health
```

### Phase 4: ML Forecasting Testing

#### 1. Check ML Service Health
```bash
curl -X GET http://localhost:5000/api/forecast/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ML service health check completed",
  "ml_service": {
    "available": true,
    "url": "http://localhost:5001",
    "last_check": "2025-07-30T15:30:00.000Z"
  },
  "features": [
    "AQI forecasting (1-7 days)",
    "Multiple ML models (Linear, LSTM)",
    "Auto-training capabilities",
    "Location-based predictions",
    "Fallback forecasting"
  ]
}
```

#### 2. Get AQI Forecast by City (GET)
```bash
curl -X GET "http://localhost:5000/api/forecast/Mumbai?days=3"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Forecast generated successfully",
  "source": "ml_service",
  "city": "Mumbai",
  "forecast": {
    "generated_at": "2025-07-30T15:30:00.000Z",
    "model_used": "lstm",
    "forecast_days": 3,
    "overall_confidence": "medium",
    "trend": "increasing",
    "predictions": [
      {
        "date": "2025-07-31",
        "aqi": 125.3,
        "confidence": "high"
      },
      {
        "date": "2025-08-01", 
        "aqi": 132.1,
        "confidence": "medium"
      },
      {
        "date": "2025-08-02",
        "aqi": 128.7,
        "confidence": "medium"
      }
    ]
  },
  "ml_service_status": true
}
```

#### 3. Get Forecast by Coordinates (POST)
```bash
curl -X POST http://localhost:5000/api/forecast/predict \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 19.0760,
    "lon": 72.8777,
    "days": 5,
    "autoTrain": true
  }'
```

#### 4. Train ML Model (Admin Only)
```bash
curl -X POST http://localhost:5000/api/forecast/train \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "city": "Delhi",
    "days": 30,
    "forceRetrain": true
  }'
```

#### 5. Get ML Models Information (Admin Only)
```bash
curl -X GET http://localhost:5000/api/forecast/models \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### 6. Test Fallback Forecasting
Stop the ML service (port 5001) and test:
```bash
curl -X GET "http://localhost:5000/api/forecast/Mumbai?days=3"
```

**Expected Response (Fallback):**
```json
{
  "success": true,
  "message": "Forecast generated successfully",
  "source": "fallback",
  "city": "Mumbai",
  "forecast": {
    "generated_at": "2025-07-30T15:30:00.000Z",
    "model_used": "fallback",
    "forecast_days": 3,
    "overall_confidence": "low",
    "trend": "stable",
    "predictions": [...]
  },
  "ml_service_status": false
}
```

## 🔧 Testing with Postman

### 1. Import Collection

Create a Postman collection with the following requests:

#### Environment Variables
- `baseUrl`: `http://localhost:5000`
- `token`: `{{token}}` (set after login)

#### Collection Structure

```
AQI Monitoring API/
├── Authentication/
│   ├── Signup
│   ├── Login
│   ├── Get Current User
│   ├── Update Profile
│   └── Logout
├── AQI Data/
│   ├── Fetch AQI Data
│   ├── Get History
│   ├── Get Nearby Data
│   ├── Get Analytics
│   ├── Bookmark Data
│   ├── Add Note
│   └── Delete Data
├── History & Analytics (Phase 3)/
│   ├── Get User History
│   ├── Get Heatmap Data
│   ├── Get ML Training Data
│   ├── Get Trend Analysis
│   ├── Get Location Stats
│   ├── Get Global Stats
│   └── History Health Check
├── ML Forecasting (Phase 4)/
│   ├── Get Forecast by City
│   ├── Get Forecast by Coordinates
│   ├── Train ML Model (Admin)
│   ├── Get Models Info (Admin)
│   ├── Retrain All Models (Admin)
│   └── ML Health Check
└── Health Checks/
    ├── API Health
    ├── AQI Service Health
    ├── History Service Health
    └── ML Service Health
```

#### Sample Postman Request: Fetch AQI Data

- **Method**: POST
- **URL**: `{{baseUrl}}/api/aqi/fetch`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{token}}`
- **Body** (raw JSON):
```json
{
  "lat": 40.7128,
  "lon": -74.0060,
  "saveToHistory": true
}
```

#### Pre-request Script for Authentication
```javascript
// For requests that need authentication
if (pm.globals.get("token")) {
    pm.request.headers.add({
        key: "Authorization", 
        value: "Bearer " + pm.globals.get("token")
    });
}
```

#### Test Script for Login
```javascript
// Save token from login response
if (pm.response.to.have.status(200)) {
    const response = pm.response.json();
    if (response.token) {
        pm.globals.set("token", response.token);
        console.log("Token saved:", response.token);
    }
}
```

## 🐛 Testing Error Scenarios

### 1. Invalid Coordinates
```bash
curl -X POST http://localhost:5000/api/aqi/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lat": 200,
    "lon": -74.0060
  }'
```

**Expected**: 400 Bad Request with validation error

### 2. Missing Authentication
```bash
curl -X POST http://localhost:5000/api/aqi/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 40.7128,
    "lon": -74.0060
  }'
```

**Expected**: 401 Unauthorized

### 3. Invalid API Key
Set `OPENWEATHER_API_KEY` to an invalid value and test:
```bash
curl -X POST http://localhost:5000/api/aqi/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lat": 40.7128,
    "lon": -74.0060
  }'
```

**Expected**: Error message about API key

## 📊 Performance Testing

### 1. Concurrent Requests Test
Use `ab` (Apache Bench) to test concurrent requests:

```bash
# Test with 10 concurrent requests, 100 total
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
   -T "application/json" \
   -p post_data.json \
   http://localhost:5000/api/aqi/fetch
```

Create `post_data.json`:
```json
{"lat": 40.7128, "lon": -74.0060}
```

### 2. Load Testing with Artillery
Create `artillery-config.yml`:
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      Authorization: 'Bearer YOUR_JWT_TOKEN'

scenarios:
  - name: "Fetch AQI Data"
    requests:
      - post:
          url: "/api/aqi/fetch"
          json:
            lat: 40.7128
            lon: -74.0060
```

Run: `artillery run artillery-config.yml`

## 🔍 Database Testing

### 1. MongoDB Queries

Connect to MongoDB and verify data storage:

```javascript
// Connect to MongoDB
use airquality

// Check users collection
db.users.find().pretty()

// Check AQI data collection
db.aqidatas.find().limit(5).pretty()

// Count total AQI records
db.aqidatas.countDocuments()

// Find recent AQI data
db.aqidatas.find({
  requestTimestamp: {
    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
}).sort({ requestTimestamp: -1 }).limit(10)

// Get AQI data by user
db.aqidatas.find({ userId: ObjectId("YOUR_USER_ID") })
```

### 2. Data Validation

Test data integrity:
- Verify coordinates are within valid ranges
- Check AQI values are between expected ranges
- Ensure timestamps are recent and correctly formatted
- Validate pollutant values are non-negative

## 🚨 Error Monitoring

### 1. Log Analysis

Monitor the console output for:
- Database connection status
- API call success/failure rates
- Response times
- Error patterns

### 2. Health Check Monitoring

Set up automated health checks:
```bash
# Simple health check script
#!/bin/bash
while true; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
  if [ $response != "200" ]; then
    echo "$(date): Health check failed with status $response"
  else
    echo "$(date): Health check passed"
  fi
  sleep 30
done
```

## ✅ Test Checklist

### Phase 1: Authentication
- [ ] User registration works
- [ ] Duplicate email prevention
- [ ] User login works
- [ ] Invalid credentials rejected
- [ ] JWT token generation
- [ ] Protected route access
- [ ] Token expiration handling
- [ ] User profile updates
- [ ] Password change functionality

### Phase 2: AQI Data
- [ ] AQI data fetching works
- [ ] Invalid coordinates rejected
- [ ] Location name resolution
- [ ] Weather data integration
- [ ] Data caching works
- [ ] Historical data storage
- [ ] History retrieval with pagination
- [ ] Nearby data queries
- [ ] Analytics generation
- [ ] Bookmark functionality
- [ ] Note management
- [ ] Data deletion

### Phase 3: History & Analytics
- [ ] User history with pagination works
- [ ] Heatmap data aggregation works
- [ ] ML-ready time series data format
- [ ] Trend analysis calculation
- [ ] Location statistics retrieval
- [ ] Global statistics aggregation
- [ ] History service health check
- [ ] Advanced filtering (date range, AQI range)
- [ ] Geographic bounds filtering
- [ ] Time interval grouping (hourly/daily)

### Phase 4: ML Forecasting
- [ ] ML service health check works
- [ ] City-based forecast (GET endpoint)
- [ ] Coordinate-based forecast (POST endpoint)
- [ ] Fallback forecasting when ML unavailable
- [ ] Admin model training functionality
- [ ] Models information retrieval
- [ ] Bulk model retraining
- [ ] Forecast validation and confidence scoring
- [ ] Trend analysis in predictions
- [ ] Auto-training capabilities

### Performance & Reliability
- [ ] Response times < 2 seconds
- [ ] Handles concurrent requests
- [ ] Graceful error handling
- [ ] Database connection resilience
- [ ] External API failure handling
- [ ] Memory leak monitoring

### Security
- [ ] SQL injection protection
- [ ] XSS prevention
- [ ] Rate limiting (when implemented)
- [ ] CORS configuration
- [ ] Secure headers
- [ ] Input validation
- [ ] Authentication bypass testing

## 🎯 Sample Test Coordinates

Use these coordinates for consistent testing:

```javascript
const testLocations = [
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { name: "Beijing", lat: 39.9042, lon: 116.4074 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 }
];
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check firewall settings

2. **OpenWeatherMap API Errors**
   - Verify API key is correct
   - Check API quota limits
   - Ensure internet connectivity

3. **CORS Issues**
   - Check `CLIENT_URL` in `.env`
   - Verify CORS configuration in `app.js`

4. **JWT Token Issues**
   - Check `JWT_SECRET` is set
   - Verify token format in requests
   - Check token expiration

---

**Happy Testing! 🧪**
