# AQI Monitoring System - Complete Setup Guide

## 🔧 Prerequisites

1. **Node.js** (v16.0.0 or higher)
2. **MongoDB** (v4.4 or higher) 
3. **npm** (v8.0.0 or higher)

## 📦 Project Structure
```
aiq_monitoring/
├── backend/           # Node.js API Server
├── src/              # React Frontend 
├── public/           # Frontend assets
├── package.json      # Frontend dependencies
└── README.md
```

## 🚀 Installation & Setup

### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Or use MongoDB Atlas (cloud) - update MONGO_URI in .env

**Alternative - MongoDB Atlas (Recommended):**
1. Go to https://cloud.mongodb.com/
2. Create free account and cluster
3. Get connection string and update MONGO_URI in backend/.env

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env
# Edit .env file with your MongoDB connection string

# Start backend server
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on: http://localhost:5000

### Step 3: Setup Frontend

```bash
# Navigate to root directory (not backend!)
cd ../

# Install frontend dependencies  
npm install

# Start frontend development server
npm start
```

Frontend will run on: http://localhost:3000

### Step 4: Setup ML Service (Optional)

```bash
# Navigate to ML directory
cd backend/ml

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start ML service
python app.py
```

ML Service will run on: http://localhost:5001

## 🔍 Troubleshooting

### Backend won't start:
1. Check MongoDB is running: `mongod --version`
2. Verify .env file exists in backend/ directory
3. Check MONGO_URI in .env file
4. Run: `cd backend && npm install`

### Frontend won't start:
1. Make sure you're in root directory (not backend/)
2. Run: `npm install`
3. Check for port conflicts

### Database connection issues:
1. Check MongoDB service is running
2. Verify MONGO_URI format: `mongodb://localhost:27017/airquality`
3. For Atlas: Use full connection string with credentials

## 📡 API Endpoints

Once backend is running, you can test:
- Health Check: http://localhost:5000/health
- API Documentation: http://localhost:5000/
- Admin Health: http://localhost:5000/api/health/detailed

## 🎯 Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm start
```

**Terminal 2 (Frontend):**
```bash
npm install  
npm start
```

**Terminal 3 (ML Service - Optional):**
```bash
cd backend/ml
python app.py
```

## 🔐 Environment Variables

Backend .env file should contain:
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/airquality
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
OPENWEATHER_API_KEY=your-api-key
```
