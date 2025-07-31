# AQI ML Forecasting Service

A Python-based Machine Learning microservice for predicting Air Quality Index (AQI) values using historical data. This service provides forecasting capabilities for the AQI Monitoring backend through a REST API.

## 🚀 Features

- **Multiple ML Models**
  - Linear Regression for simple, fast predictions
  - LSTM Neural Networks for complex time-series forecasting
  - Automatic model selection based on data availability and performance

- **Smart Training**
  - Auto-training based on data availability
  - Configurable retraining intervals
  - Bulk retraining for multiple locations

- **Robust Predictions**
  - Support for 1-7 day forecasts
  - Confidence scoring for predictions
  - Trend analysis and direction detection
  - Fallback mechanisms when training data is insufficient

- **Production Ready**
  - RESTful API with comprehensive error handling
  - Input validation and sanitization
  - Health monitoring and service status
  - Caching and performance optimization

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)
- Access to Node.js backend API for training data

## 🛠️ Installation

### Quick Start (Windows)

1. **Navigate to ML directory:**
   ```cmd
   cd backend\ml
   ```

2. **Run the startup script:**
   ```cmd
   start.bat
   ```

### Quick Start (Linux/Mac)

1. **Navigate to ML directory:**
   ```bash
   cd backend/ml
   ```

2. **Make script executable and run:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Manual Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   
   Windows:
   ```cmd
   venv\Scripts\activate
   ```
   
   Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the service:**
   ```bash
   python app.py
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_PORT=5001
FLASK_HOST=0.0.0.0

# Node.js Backend Connection
NODE_BACKEND_URL=http://localhost:5000

# MongoDB Configuration (optional, for direct access)
MONGO_URI=mongodb://localhost:27017/airquality

# Model Configuration
MODEL_RETRAIN_HOURS=24
FORECAST_DAYS_MAX=7
MIN_DATA_POINTS=50

# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Model Parameters

- **Linear Regression**: Fast training, works with small datasets (≥50 points)
- **LSTM**: Advanced forecasting, requires more data (≥20 sequences)
- **Auto-selection**: Chooses best performing model based on validation metrics

## 🌐 API Endpoints

### Health Check
```http
GET /health
```
Returns service status and available models.

### Train Models
```http
POST /train
Content-Type: application/json

{
  "city": "Mumbai",
  "days": 30,
  "force_retrain": false
}
```

### Get Predictions
```http
POST /predict
Content-Type: application/json

{
  "city": "Mumbai",
  "days": 3,
  "auto_train": true
}
```

### City Forecast (Convenience)
```http
GET /forecast/Mumbai?days=3
```

### Models Information
```http
GET /models
```

### Bulk Retraining
```http
POST /retrain-all
```

## 📊 Model Architecture

### Linear Regression Model
- **Use Case**: Quick predictions with limited data
- **Features**: AQI, pollutants (PM2.5, PM10, CO, NO₂, O₃, SO₂), weather data
- **Training Time**: < 1 second
- **Memory**: Low
- **Accuracy**: Good for short-term trends

### LSTM Model
- **Use Case**: Complex time-series forecasting
- **Architecture**: 
  - 2 LSTM layers (50 units each)
  - Dropout layers (0.2) for regularization
  - Dense output layer
- **Training Time**: 30-60 seconds
- **Memory**: Moderate
- **Accuracy**: Excellent for long-term patterns

## 🔄 Integration with Node.js Backend

The ML service integrates seamlessly with the Node.js backend:

1. **Data Fetching**: Retrieves historical data via `/api/history/ml-data`
2. **Automatic Training**: Trains models when insufficient historical predictions exist
3. **Fallback Support**: Node.js provides simple forecasting if ML service is unavailable
4. **Health Monitoring**: Regular health checks ensure service availability

## 📈 Usage Examples

### Python Client Example
```python
import requests

# Train a model
train_response = requests.post('http://localhost:5001/train', json={
    'city': 'Mumbai',
    'days': 30
})

# Get forecast
forecast_response = requests.post('http://localhost:5001/predict', json={
    'city': 'Mumbai', 
    'days': 5
})

print(forecast_response.json())
```

### cURL Examples
```bash
# Health check
curl http://localhost:5001/health

# Train model
curl -X POST http://localhost:5001/train \
  -H "Content-Type: application/json" \
  -d '{"city": "Mumbai", "days": 30}'

# Get forecast
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"city": "Mumbai", "days": 3}'
```

## 🧪 Testing

### Unit Tests
```bash
python -m pytest tests/ -v
```

### Integration Tests
```bash
# Test with Node.js backend running
python test_integration.py
```

### Load Testing
```bash
# Test concurrent requests
python test_performance.py
```

## 📝 Data Requirements

### Training Data Format
```json
[
  {
    "timestamp": "2025-07-30T00:00:00Z",
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
    }
  }
]
```

### Minimum Requirements
- **Linear Model**: 50+ data points
- **LSTM Model**: 20+ sequential data points
- **Optimal Training**: 30+ days of hourly/daily data

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt --force-reinstall
   ```

2. **TensorFlow Issues**
   ```bash
   # For CPU-only installation
   pip install tensorflow-cpu==2.13.0
   ```

3. **Memory Issues**
   ```bash
   # Reduce LSTM epochs or use Linear model only
   export TF_CPP_MIN_LOG_LEVEL=2
   ```

4. **Connection Issues**
   ```bash
   # Check Node.js backend is running
   curl http://localhost:5000/health
   ```

### Logs and Debugging

- Service logs: Check console output
- Model files: Saved in `saved_models/` directory
- Error logs: Available in Flask debug mode

## 🚀 Deployment

### Production Deployment

1. **Use Production WSGI Server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5001 app:app
   ```

2. **Docker Deployment:**
   ```dockerfile
   FROM python:3.9-slim
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   EXPOSE 5001
   CMD ["python", "app.py"]
   ```

3. **Environment Configuration:**
   - Set `FLASK_ENV=production`
   - Configure proper logging
   - Set up monitoring and alerts

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple instances behind load balancer
- **Model Caching**: Save trained models to shared storage
- **Database**: Use dedicated database for model metadata
- **Monitoring**: Implement health checks and performance metrics

## 📚 API Documentation

Complete API documentation is available at:
- Service root: `http://localhost:5001/`
- Health endpoint: `http://localhost:5001/health`
- Models info: `http://localhost:5001/models`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

This ML forecasting service is part of the AQI Monitoring system and follows the same licensing terms.

---

**🌟 Ready to predict the future of air quality! 🌟**
