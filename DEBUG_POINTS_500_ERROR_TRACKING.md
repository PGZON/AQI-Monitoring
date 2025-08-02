# COMPREHENSIVE DEBUG POINTS FOR 500 ERROR TRACKING

## Debug Points Added

### 1. Frontend API Interceptor (`src/utils/api.js`)
**Enhanced Request Logging:**
- Full request details with timestamp
- Request payload inspection
- Authentication token status

**Enhanced Response Error Logging:**
- Detailed error breakdown with stack traces
- Special 500 error detection and analysis
- Request/response correlation with debug IDs
- Troubleshooting suggestions

### 2. Frontend Forecast Service (`src/services/forecastService.js`)
**Request Flow Tracking:**
- Unique debug ID for each request (`forecast-${timestamp}`)
- Parameter validation at each step
- Coordinate conversion verification
- API call payload logging
- Response structure analysis

**Error Classification:**
- Validation errors vs API errors
- Network errors vs server errors
- 500 error specific troubleshooting

### 3. Backend Forecast Controller (`backend/controllers/forecastController.js`)
**Complete Request Processing:**
- Request method, URL, headers, body logging
- Validation step-by-step tracking
- Parameter extraction verification
- ML service call parameters
- Response formatting process
- Error details with stack traces

### 4. Backend ML Service (`backend/services/mlService.js`)
**ML Pipeline Debugging:**
- ML service health check results
- Coordinate validation details
- ML service URL and payload logging
- External ML API response tracking
- Fallback decision reasoning

## Debug Output Expected

### Successful Flow:
```
Frontend:
🔍 [forecast-1691234567890] Starting getForecastData...
🔍 [forecast-1691234567890] Raw parameters received: {lat: 40.7128, lng: -74.006, hours: 24}
📡 [forecast-1691234567890] Making API call to /forecast/predict...
✅ [forecast-1691234567890] API call successful! Status: 200

Backend Controller:
🔍 [forecast-1691234567891] Starting getForecast controller...
🔍 [forecast-1691234567891] Request body: {lat: 40.7128, lon: -74.006, days: 1}
✅ [forecast-1691234567891] Validation passed
✅ [forecast-1691234567891] Sending response with status: 200

Backend ML Service:
🔍 [ml-forecast-1691234567892] Starting ML getForecast...
🔮 [ml-forecast-1691234567892] Making ML forecast request: {latitude: 40.7128, longitude: -74.006, days: 1}
📥 [ml-forecast-1691234567892] ML service response status: 200
```

### Error Flow (500 Error):
```
Frontend:
❌ [forecast-1691234567890] Failed to fetch forecast data: AxiosError
🚨 [forecast-1691234567890] 500 SERVER ERROR - BACKEND ISSUE:

Backend Controller:
❌ [forecast-1691234567891] Error in getForecast: [Error details]
❌ [forecast-1691234567891] Error stack: [Full stack trace]

Backend ML Service:
❌ [ml-forecast-1691234567892] Error details: [Specific failure point]
```

## Troubleshooting Guide

### Check These Debug Points:

1. **Frontend Parameter Issues:**
   - Look for `❌ [forecast-*] Validation failed`
   - Check coordinate conversion errors
   - Verify parameter types and values

2. **Backend Controller Issues:**
   - Look for `❌ [forecast-*] Error in getForecast`
   - Check request body format
   - Verify validation errors

3. **ML Service Issues:**
   - Look for `❌ [ml-forecast-*]` errors
   - Check ML service health status
   - Verify coordinate validation
   - Check external ML API connectivity

4. **Network/Infrastructure Issues:**
   - Look for network timeout errors
   - Check API base URL configuration
   - Verify backend server is running

## Common 500 Error Causes & Debug Signatures

### 1. Invalid Coordinates
**Debug Signature:**
```
⚠️ [ml-forecast-*] No valid coordinates provided for ML forecast, using fallback
🔍 [ml-forecast-*] Coordinate validation details: {lat: undefined, lon: undefined}
```

### 2. ML Service Down
**Debug Signature:**
```
🔍 [ml-forecast-*] ML service available: false
⚠️ [ml-forecast-*] ML service not available, using fallback
```

### 3. External API Failure
**Debug Signature:**
```
📡 [ml-forecast-*] Sending payload to ML service: {...}
❌ Network Error: connect ECONNREFUSED
```

### 4. Backend Database Issues
**Debug Signature:**
```
❌ [forecast-*] Error in getForecast: MongoError/PostgreSQL Error
```

### 5. Validation Errors
**Debug Signature:**
```
❌ [forecast-*] Validation errors: [{"field": "lat", "message": "required"}]
```

## Next Steps

After adding these debug points:

1. **Reproduce the 500 error**
2. **Check browser console** for detailed frontend debug logs
3. **Check backend console/logs** for server-side debug information
4. **Match debug IDs** between frontend and backend to trace the full request flow
5. **Identify the exact failure point** from the debug signatures

The debug output will show exactly where and why the 500 error is occurring, making it much easier to fix the root cause.
