# Project Overview: AQI-Monitoring

This document provides a comprehensive overview of the AQI-Monitoring project, including the purpose and role of each file and directory in the workspace, as well as details about the backend API and machine learning components.

---

## Root Directory

- **package.json**: Main configuration file for the frontend (React) project. Lists dependencies, scripts, and project metadata.
- **postcss.config.js**: Configuration for PostCSS, used for processing CSS (e.g., with Tailwind CSS).
- **README.md**: General project overview and instructions.
- **run-backend-debug.bat**: Batch script to start the backend server in debug mode (Windows).
- **SETUP_GUIDE.md**: Step-by-step setup instructions for the project.
- **STARTUP_GUIDE.md**: Instructions for starting the project after setup.
- **tailwind.config.js**: Tailwind CSS configuration file.

---

## Backend Directory (`backend/`)

- **app.js**: Main entry point for the backend (Node.js/Express) server. Sets up middleware, routes, and starts the server.
- **package.json**: Backend-specific dependencies and scripts.
- **README.md**: Backend-specific documentation.

### Config (`backend/config/`)
- **db.js**: Database connection and configuration (likely MongoDB).

### Controllers (`backend/controllers/`)
- **adminController.js**: Handles admin-related API logic.
- **alertController.js**: Manages alert creation, updates, and notifications.
- **aqiController.js**: Handles AQI (Air Quality Index) data endpoints.
- **authController.js**: Manages authentication (login, registration, JWT, etc.).
- **forecastController.js**: Provides AQI and weather forecast data.
- **historyController.js**: Handles historical AQI data retrieval.
- **preferenceController.js**: Manages user preferences (e.g., alert thresholds).
- **weatherController.js**: Handles weather data endpoints.

### Jobs (`backend/jobs/`)
- **alertScheduler.js**: Schedules and manages alert jobs (e.g., periodic AQI checks).

### Middleware (`backend/middleware/`)
- **authMiddleware.js**: Authentication and authorization middleware.
- **errorMiddleware.js**: Centralized error handling for API requests.
- **logger-simple.js**: Simple logging utility.
- **logger.js**: Advanced logging utility.
- **rateLimiter.js**: Middleware to limit API request rates.

### ML (`backend/ml/`)
- **app.py**: Main entry for ML-related API (Python Flask or FastAPI likely).
- **fetch.py**: Fetches or scrapes AQI/weather data for ML.
- **models.py**: Defines ML models (e.g., LSTM for AQI prediction).
- **README.md**: ML component documentation.
- **requirements.txt**: Python dependencies for ML.
- **start.bat / start.sh**: Scripts to start the ML server (Windows/Linux).
- **test_integration.py**: Integration tests for ML API.
- **utils.py**: Utility functions for ML tasks.
- **apiML/ModelTraning/**: Likely contains model training scripts and data.

### Models (`backend/models/`)
- **AlertLog.js**: Mongoose model for alert logs.
- **AQIData.js**: Mongoose model for AQI data.
- **Preference.js**: Mongoose model for user preferences.
- **User.js**: Mongoose model for user accounts.

### Routes (`backend/routes/`)
- **adminRoutes.js**: API routes for admin operations.
- **alertRoutes.js**: API routes for alerts.
- **analyticsRoutes.js**: API routes for analytics.
- **aqiRoutes.js**: API routes for AQI data.
- **authRoutes.js**: API routes for authentication.
- **forecastRoutes.js**: API routes for forecasts.
- **healthCheckRoutes.js**: API health check endpoints.
- **historyRoutes.js**: API routes for historical data.
- **preferenceRoutes.js**: API routes for user preferences.
- **userRoutes.js**: API routes for user management.
- **weatherRoutes.js**: API routes for weather data.

### Services (`backend/services/`)
- **adminService.js**: Business logic for admin features.
- **alertService.js**: Business logic for alerts.
- **aqiService.js**: Business logic for AQI data.
- **historyService.js**: Business logic for historical data.
- **mlService.js**: Handles communication with the ML server.
- **notificationService.js**: Manages notifications (email, SMS, etc.).
- **preferenceService.js**: Business logic for user preferences.
- **weatherService.js**: Business logic for weather data.

---

## Public Directory (`public/`)
- **Static assets**: Images, icons, manifest, favicon, service worker, and HTML entry point for the frontend.

---

## Frontend Directory (`src/`)
- **App.js**: Main React component.
- **index.js**: Entry point for React app.
- **App.css, index.css**: Stylesheets.
- **logo.svg**: Logo asset.
- **reportWebVitals.js**: Performance reporting.
- **setupTests.js**: Test setup for React Testing Library.

### Components (`src/components/`)
- **AboutSection.jsx**: About page/section.
- **AlertSettings.jsx**: User alert settings UI.
- **AnimatedBackground.jsx**: Animated background visuals.
- **AQIAlertToast.jsx**: Toast notifications for AQI alerts.
- **AQICard.jsx**: Card component for AQI display.
- **AQIForecastChart.jsx**: Chart for AQI forecast.
- **AQIHeatmap.js / AQIHeatmap_fixed.js / AQIHeatmap_backup.js**: Heatmap visualizations for AQI.
- **AQIStatusCard.jsx**: Card for AQI status.
- **AQIWarningBanner.jsx**: Banner for AQI warnings.
- **ChartsLazy.jsx**: Lazy-loaded charts.
- **CTASection.jsx**: Call-to-action section.
- **Features.jsx**: Features list.
- **Footer.jsx**: Footer component.
- **ForecastChart.jsx**: Forecast chart.
- **ForecastDashboard.jsx**: Dashboard for forecasts.
- **Heatmap.jsx / HeatmapLazy.jsx**: Heatmap components.
- **HeroSection.jsx**: Hero section of landing page.
- **HowItWorks.jsx**: How the app works section.
- **LoadingFallback.jsx / LoadingSpinner.jsx**: Loading indicators.

---

## API Overview

### Backend API (Node.js/Express)
- **Base URL**: `/api/`
- **Key Endpoints:**
  - `/api/aqi` - Get AQI data
  - `/api/forecast` - Get AQI/Weather forecast
  - `/api/history` - Get historical AQI data
  - `/api/alerts` - Manage alerts
  - `/api/auth` - User authentication
  - `/api/preferences` - User preferences
  - `/api/weather` - Weather data
  - `/api/admin` - Admin operations
  - `/api/analytics` - Analytics endpoints

### ML API (Python)
- **Purpose**: Provides AQI prediction using ML models (e.g., LSTM)
- **Endpoints**: Typically `/predict`, `/train`, etc. (see `ml/app.py`)

---

## Summary

This project is a full-stack AQI (Air Quality Index) monitoring and forecasting platform. It features a React frontend, Node.js/Express backend, and a Python-based ML microservice for AQI prediction. The backend exposes RESTful APIs for AQI data, forecasts, alerts, user management, and more. The ML component provides advanced AQI forecasting using deep learning models.

For more details, refer to the respective `README.md` files and the API route files in `backend/routes/`.
