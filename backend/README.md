# AQI Monitoring Backend API

A robust Node.js backend API for the Air Quality Monitoring system with JWT authentication, user management, and real-time AQI data integration.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Role-based access control (User/Admin)
  - Account management (profile updates, password change)

- **Real-time AQI Data Integration**
  - OpenWeatherMap API integration for live air quality data
  - OpenStreetMap integration for location services
  - Support for PM2.5, PM10, CO, NO₂, SO₂, O₃, NH₃ pollutants
  - Weather data correlation with AQI readings
  - Health recommendations based on AQI levels

- **Data Management & Analytics**
  - Historical AQI data storage and retrieval
  - User-specific AQI history tracking
  - Location-based nearby AQI data queries
  - Analytics dashboard with trends and insights
  - Bookmark system for favorite locations
  - User notes and annotations

- **Advanced Analytics & ML Support (Phase 3)**
  - Historical data aggregation with time-series analysis
  - ML-ready data formatting for forecasting models
  - Heatmap data API for geographic visualization
  - Trend analysis with linear regression
  - Location-specific statistical analysis
  - Global AQI statistics and monitoring

- **ML-based AQI Forecasting (Phase 4)**
  - Python microservice integration for ML predictions
  - Multi-model support (Linear Regression, LSTM Neural Networks)
  - 1-7 day AQI forecasting capabilities
  - Automatic model training and retraining
  - Fallback forecasting when ML service unavailable
  - Confidence scoring and trend analysis

- **User Preferences & AQI Alerts (Phase 5)**
  - Personalized user preferences and settings
  - Customizable AQI threshold alerts
  - Multi-channel notifications (Email, SMS, WhatsApp)
  - Scheduled background alert monitoring
  - Forecast-based alerts for predicted air quality
  - Alert history and analytics dashboard
  - Quiet hours and notification frequency controls

- **Security**
  - Helmet.js for security headers
  - CORS configuration
  - Rate limiting ready
  - Input validation with express-validator
  - SQL injection protection

- **Database**
  - MongoDB with Mongoose ODM
  - User model with preferences
  - Automatic timestamps
  - Database connection monitoring

- **Developer Experience**
  - Comprehensive error handling
  - Request logging
  - Environment-based configuration
  - Graceful shutdown handling

## 📋 Prerequisites

- Node.js (v16+)
- npm (v8+)
- MongoDB (local or Atlas)

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/airquality
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   OSM_API_URL=https://nominatim.openstreetmap.org
   ```

4. **Start MongoDB:**
   - **Local MongoDB:** `mongod`
   - **MongoDB Atlas:** Use your connection string in `MONGO_URI`

5. **Run the application:**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/signup` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Private |
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change password | Private |
| POST | `/logout` | User logout | Private |
| DELETE | `/delete-account` | Deactivate account | Private |
| GET | `/stats` | Get user statistics | Admin |
| GET | `/health` | Auth service health | Public |

### AQI Data Routes (`/api/aqi`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/fetch` | Fetch AQI data for coordinates | Private |
| GET | `/history` | Get user's AQI history | Private |
| GET | `/nearby` | Get nearby AQI data | Private |
| GET | `/analytics` | Get user's AQI analytics | Private |
| PATCH | `/:id/bookmark` | Toggle bookmark status | Private |
| PATCH | `/:id/note` | Add/update note | Private |
| DELETE | `/:id` | Delete AQI data record | Private |
| GET | `/health` | AQI service health | Public |
| GET | `/` | API documentation | Private |

### History & Analytics Routes (`/api/history`) - **Phase 3**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/user` | Get user's detailed AQI history | Private |
| GET | `/heatmap` | Get heatmap data for visualization | Public |
| GET | `/ml-data` | Get ML-ready time series data | Private/Public |
| GET | `/trends` | Get trend analysis for user data | Private |
| GET | `/location-stats` | Get statistics for specific location | Public |
| GET | `/global-stats` | Get global AQI statistics | Public |
| GET | `/health` | History service health check | Public |

### ML Forecasting Routes (`/api/forecast`) - **Phase 4**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/predict` | Get ML-based AQI forecast | Public |
| GET | `/:city` | Get forecast for specific city | Public |
| POST | `/train` | Train ML models for location | Admin |
| GET | `/models` | Get ML models information | Admin |
| POST | `/retrain-all` | Retrain all ML models | Admin |
| GET | `/health` | ML service health check | Public |

### General Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API welcome message |
| GET | `/health` | API health check |

## 🔐 Authentication Flow

### 1. User Registration
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "preferences": {...},
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Fetch AQI Data
```bash
POST /api/aqi/fetch
Content-Type: application/json
Authorization: Bearer <token>

{
  "lat": 40.7128,
  "lon": -74.0060,
  "saveToHistory": true
}
```

**Response:**
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
      "formatted": "New York, New York, United States"
    },
    "weather": {
      "temperature": 22.5,
      "humidity": 65,
      "pressure": 1013
    },
    "health": {
      "level": "Moderate",
      "message": "Air quality is acceptable for most people...",
      "recommendations": [...]
    }
  }
}
```
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 3. User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 4. Protected Route Access
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🏗️ Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   └── aqiController.js      # AQI data handling
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   └── errorMiddleware.js    # Error handling
├── models/
│   ├── User.js              # User schema
│   └── AQIData.js           # AQI data schema
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── aqiRoutes.js         # AQI data routes
├── services/
│   └── aqiService.js        # External API integration
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── app.js                  # Express app setup
├── package.json            # Dependencies
├── README.md              # This file
└── TESTING.md             # Testing guide
```

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Express-validator for request validation
- **CORS**: Configured for specific origins
- **Headers**: Security headers via Helmet.js
- **Rate Limiting**: Ready for implementation
- **Account Protection**: Account deactivation instead of deletion

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,                    // User's full name
  email: String,                   // Unique email address
  password: String,                // Hashed password
  role: String,                    // 'user' or 'admin'
  isActive: Boolean,               // Account status
  preferences: {
    notifications: {
      email: Boolean,              // Email notifications
      push: Boolean                // Push notifications
    },
    units: String,                 // 'metric' or 'imperial'
    aqiThreshold: Number           // AQI alert threshold
  },
  lastLogin: Date,                 // Last login timestamp
  createdAt: Date,                 // Account creation date
  updatedAt: Date                  // Last update date
}
```

### AQI Data Model
```javascript
{
  userId: ObjectId,                // Reference to User
  location: {
    city: String,                  // City name
    country: String,               // Country name
    state: String,                 // State/region
    formatted: String              // Full formatted address
  },
  coordinates: {
    latitude: Number,              // Latitude (-90 to 90)
    longitude: Number              // Longitude (-180 to 180)
  },
  aqi: {
    index: Number,                 // AQI index (0-500)
    level: String,                 // Good, Fair, Moderate, Poor, Very Poor
    category: String               // EPA category
  },
  pollutants: {
    pm2_5: { value: Number, unit: String },
    pm10: { value: Number, unit: String },
    co: { value: Number, unit: String },
    no2: { value: Number, unit: String },
    o3: { value: Number, unit: String },
    so2: { value: Number, unit: String },
    nh3: { value: Number, unit: String }
  },
  weather: {
    temperature: Number,           // Temperature in Celsius
    humidity: Number,              // Humidity percentage
    pressure: Number,              // Atmospheric pressure
    windSpeed: Number,             // Wind speed
    windDirection: Number          // Wind direction in degrees
  },
  requestTimestamp: Date,          // When data was requested
  dataTimestamp: Date,             // When data was measured
  isBookmarked: Boolean,           // User bookmark status
  userNotes: String                // User's custom notes
}
```

## 🧪 Testing the API

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Fetch AQI data:**
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

**Get AQI history:**
```bash
curl -X GET "http://localhost:5000/api/aqi/history?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get nearby AQI data:**
```bash
curl -X GET "http://localhost:5000/api/aqi/nearby?lat=40.7128&lon=-74.0060&radius=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Access protected route:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the collection (if available)
2. Set base URL: `http://localhost:5000`
3. For protected routes, add `Authorization: Bearer <token>` header
4. See [TESTING.md](./TESTING.md) for comprehensive testing guide

## 🚦 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## 📊 Logging

- **Development**: Detailed Morgan logs + custom request logging
- **Production**: Custom request logging with error tracking
- **Database**: Connection status monitoring

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/airquality |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | - |
| `OSM_API_URL` | OpenStreetMap API URL | https://nominatim.openstreetmap.org |

## 🚀 Deployment

### Development
```bash
npm run dev
```

## 🛣️ Phase 5 API Endpoints - User Preferences & Alerts

### Preference Management

#### Get User Preferences
```http
GET /api/preferences
Authorization: Bearer <token>
```

#### Update User Preferences
```http
PUT /api/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertSettings": {
    "enabled": true,
    "thresholds": {
      "aqi": {
        "moderate": 100,
        "unhealthy": 150,
        "veryUnhealthy": 200,
        "hazardous": 300
      }
    },
    "notifications": {
      "email": true,
      "sms": false,
      "whatsapp": false,
      "push": true
    }
  },
  "forecastAlerts": {
    "enabled": true,
    "daysAhead": 2,
    "threshold": 150
  }
}
```

#### Add Preferred Location
```http
POST /api/preferences/locations
Authorization: Bearer <token>
Content-Type: application/json

{
  "city": "Mumbai",
  "country": "India",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "isActive": true
}
```

#### Remove Preferred Location
```http
DELETE /api/preferences/locations/Mumbai
Authorization: Bearer <token>
```

#### Update Alert Thresholds
```http
PUT /api/preferences/thresholds
Authorization: Bearer <token>
Content-Type: application/json

{
  "aqi": {
    "moderate": 120,
    "unhealthy": 160,
    "veryUnhealthy": 220,
    "hazardous": 320
  },
  "pollutants": {
    "pm2_5": 25.0,
    "pm10": 45.0,
    "no2": 35.0
  }
}
```

#### Update Contact Information
```http
PUT /api/preferences/contact
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "whatsappNumber": "+1234567890"
}
```

#### Test Notification
```http
POST /api/preferences/test-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "method": "email"
}
```

### Alert Management

#### Send Manual Alert
```http
POST /api/alerts/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "Delhi",
  "message": "High pollution levels detected. Please take precautions.",
  "alertLevel": "unhealthy"
}
```

#### Get Alert History
```http
GET /api/alerts/history?page=1&limit=20&alertType=aqi_threshold&isRead=false
Authorization: Bearer <token>
```

#### Get Alert Statistics
```http
GET /api/alerts/stats?days=30
Authorization: Bearer <token>
```

#### Mark Alerts as Read
```http
PUT /api/alerts/mark-read
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertIds": ["64f123456789abcd12345678", "64f123456789abcd12345679"]
}
```

#### Get Unread Alerts Count
```http
GET /api/alerts/unread-count
Authorization: Bearer <token>
```

#### Trigger Alert Check (Admin)
```http
POST /api/alerts/check-now
Authorization: Bearer <token>
```

#### Get Scheduler Status (Admin)
```http
GET /api/alerts/scheduler-status
Authorization: Bearer <token>
```

### Production
```bash
npm start
```

### Docker (Future)
```bash
docker build -t aqi-backend .
docker run -p 5000:5000 aqi-backend
```

## 🛣️ Next Steps (Phase 6)

- [ ] Push notification service integration
- [ ] Advanced alert rules engine
- [ ] Geofencing-based alerts
- [ ] Air quality forecast accuracy improvements
- [ ] Social features and community alerts
- [ ] Mobile app push notifications
- [ ] Advanced analytics dashboard
- [ ] API rate limiting optimization
- [ ] Multi-language support
- [ ] Integration with wearable devices

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing instructions including:
- Authentication flow testing
- AQI data fetching and validation
- Error scenario testing
- Performance testing
- Database validation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@aqimonitoring.com or join our Slack channel.

---

**Made with ❤️ for cleaner air monitoring**
