import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { AlertProvider } from './context/AlertContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoute.jsx';
import './App.css';

// Direct imports - NO lazy loading to prevent "Element type is invalid" errors
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ModernDashboard from './pages/ModernDashboard.jsx'; // NEW: Modern premium UI dashboard
import WeatherDashboard from './components/WeatherDashboard.jsx'; // NEW: Weather dashboard component
import ForecastPage from './pages/ForecastPage.jsx';
import MLDashboard from './pages/MLDashboard.jsx'; // NEW: ML Dashboard with predictions and heatmap
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AlertSettingsPage from './pages/AlertSettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import OfflinePage from './pages/OfflinePage.jsx';

// Admin panel pages - direct imports
import AdminDashboard from './pages/AdminPanel/AdminDashboard.jsx';
import UserInsights from './pages/AdminPanel/UserInsights.jsx';
import MLStatusPanel from './pages/AdminPanel/MLStatusPanel.jsx';
import DataReview from './pages/AdminPanel/DataReview.jsx';
import LogsViewer from './pages/AdminPanel/LogsViewer.jsx';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute.jsx';

// Catch-all route component to prevent infinite redirects
const CatchAllRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  console.log('🚀 [App] App component mounting - NO LAZY LOADING');
  
  return (
    <AuthProvider>
      <UserProvider>
        <AlertProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ModernDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Legacy dashboard route for backward compatibility */}
                <Route
                  path="/dashboard-old"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/forecast"
                  element={
                    <ProtectedRoute>
                      <ForecastPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/ml"
                  element={
                    <ProtectedRoute>
                      <MLDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/weather"
                  element={
                    <ProtectedRoute>
                      <WeatherDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertSettingsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedAdminRoute>
                      <UserInsights />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="/admin/ml"
                  element={
                    <ProtectedAdminRoute>
                      <MLStatusPanel />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="/admin/data"
                  element={
                    <ProtectedAdminRoute>
                      <DataReview />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="/admin/logs"
                  element={
                    <ProtectedAdminRoute>
                      <LogsViewer />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Offline page */}
                <Route 
                  path="/offline" 
                  element={<OfflinePage />} 
                />

                {/* Catch all route - redirect appropriately based on auth status */}
                <Route path="*" element={<CatchAllRoute />} />
              </Routes>
            </div>
          </Router>
        </AlertProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
