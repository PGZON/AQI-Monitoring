import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { AlertProvider } from './context/AlertContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import './App.css';

// Direct imports - NO lazy loading to prevent "Element type is invalid" errors
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModernDashboard from './pages/ModernDashboard'; // NEW: Modern premium UI dashboard
import WeatherDashboard from './components/WeatherDashboard'; // NEW: Weather dashboard component
import ForecastPage from './pages/ForecastPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertSettingsPage from './pages/AlertSettingsPage';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import OfflinePage from './pages/OfflinePage';

// Admin panel pages - direct imports
import AdminDashboard from './pages/AdminPanel/AdminDashboard';
import UserInsights from './pages/AdminPanel/UserInsights';
import MLStatusPanel from './pages/AdminPanel/MLStatusPanel';
import DataReview from './pages/AdminPanel/DataReview';
import LogsViewer from './pages/AdminPanel/LogsViewer';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

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
