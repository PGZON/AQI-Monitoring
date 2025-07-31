# AQI Monitoring System - Complete Startup Guide

This guide walks you through starting the complete AQI Monitoring system with all Phase 4 features including ML forecasting.

## 🚀 System Architecture

```
Frontend (React)     ←→     Backend (Node.js)     ←→     ML Service (Python Flask)
     ↓                           ↓                            ↓
Port 3000                   Port 5000                   Port 5001
                                ↓
                         MongoDB Database
                         (Port 27017)
```

## 📋 Prerequisites

- **Node.js** (v16+)
- **Python** (v3.8+)
- **MongoDB** (v4.4+)
- **Git**
- **OpenWeatherMap API Key**

## 🛠️ Step-by-Step Startup

### 1. Database Setup

**Start MongoDB:**
```bash
# Windows (if MongoDB installed as service)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# or
mongod --dbpath /path/to/your/db

# Docker alternative
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Verify MongoDB Connection:**
```bash
mongo
> show dbs
> use airquality
> exit
```

### 2. Backend Setup (Node.js API)

**Navigate to backend directory:**
```bash
cd backend
```

**Install dependencies:**
```bash
npm install
```

**Configure environment:**
```bash
# Ensure .env file has correct values:
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/airquality
JWT_SECRET=your_jwt_secret_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
ML_SERVICE_URL=http://localhost:5001
```

**Start backend server:**
```bash
npm run dev
```

**Verify backend is running:**
```bash
curl http://localhost:5000/health
```

### 3. ML Service Setup (Python Flask)

**Navigate to ML directory:**
```bash
cd backend/ml
```

**Quick start (Windows):**
```cmd
start.bat
```

**Quick start (Linux/Mac):**
```bash
chmod +x start.sh
./start.sh
```

**Manual setup:**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML service
python app.py
```

**Verify ML service is running:**
```bash
curl http://localhost:5001/health
```

### 4. Frontend Setup (React)

**Navigate to frontend directory:**
```bash
cd ../../  # Go back to project root
npm install
```

**Start frontend development server:**
```bash
npm start
```

**Verify frontend is running:**
- Open browser to `http://localhost:3000`

## ✅ System Health Check

Once everything is running, verify all services:

### 1. Backend Health
```bash
curl http://localhost:5000/health
```

### 2. ML Service Health
```bash
curl http://localhost:5001/health
```

### 3. Integration Test
```bash
curl http://localhost:5000/api/forecast/health
```

### 4. Complete Forecast Test
```bash
curl -X GET "http://localhost:5000/api/forecast/Mumbai?days=3"
```

## 🧪 Testing the Complete System

### Phase 1: Authentication
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "TestPass123"}'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123"}'
```

### Phase 2: AQI Data
```bash
curl -X POST http://localhost:5000/api/aqi/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"lat": 19.0760, "lon": 72.8777, "saveToHistory": true}'
```

### Phase 3: History & Analytics
```bash
curl -X GET "http://localhost:5000/api/history/heatmap?range=7d"
```

### Phase 4: ML Forecasting
```bash
curl -X GET "http://localhost:5000/api/forecast/Mumbai?days=3"
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check if MongoDB is running
   ps aux | grep mongod
   # Windows:
   tasklist | findstr mongod
   ```

2. **Backend Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Windows:
   netstat -ano | findstr :5000
   ```

3. **ML Service Import Errors**
   ```bash
   # Reinstall Python dependencies
   cd backend/ml
   pip install -r requirements.txt --force-reinstall
   ```

4. **Frontend Build Issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Service Dependencies

| Service | Depends On | Port | Status Check |
|---------|------------|------|--------------|
| MongoDB | None | 27017 | `mongo --eval "db.stats()"` |
| Backend | MongoDB | 5000 | `curl localhost:5000/health` |
| ML Service | Backend (optional) | 5001 | `curl localhost:5001/health` |
| Frontend | Backend | 3000 | Browser: `localhost:3000` |

## 📈 Performance Monitoring

### Backend Monitoring
```bash
# Check Node.js memory usage
curl http://localhost:5000/health
```

### ML Service Monitoring
```bash
# Check Python service status
curl http://localhost:5001/health
```

### Database Monitoring
```javascript
// Connect to MongoDB
mongo
use airquality
db.stats()
db.aqidatas.count()
db.users.count()
```

## 🚀 Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `FLASK_ENV=production`
- [ ] Use production MongoDB instance
- [ ] Configure HTTPS
- [ ] Set up reverse proxy (nginx)
- [ ] Configure environment secrets
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Test disaster recovery
- [ ] Set up CI/CD pipeline

## 📚 API Documentation

- **Backend API**: `http://localhost:5000/`
- **ML Service API**: `http://localhost:5001/`
- **Health Checks**: All services provide `/health` endpoints
- **Swagger/OpenAPI**: Available in development mode

## 🎯 Next Steps

1. **Set up user accounts** via the frontend
2. **Fetch AQI data** for your locations
3. **View historical trends** in the dashboard
4. **Generate ML forecasts** for future planning
5. **Configure alerts** for air quality changes
6. **Explore data analytics** and insights

---

**🌟 Your complete AQI Monitoring system with ML forecasting is now ready! 🌟**

For specific phase testing, refer to `TESTING.md` in the backend directory.
