import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { AlertProvider } from './context/AlertContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import LoadingFallback from './components/LoadingFallback';
import './App.css';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ForecastPage = React.lazy(() => import('./pages/ForecastPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const AlertSettingsPage = React.lazy(() => import('./pages/AlertSettingsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const OfflinePage = React.lazy(() => import('./pages/OfflinePage'));

// Admin panel pages - lazy loaded separately
const AdminDashboard = React.lazy(() => import('./pages/AdminPanel/AdminDashboard'));
const UserInsights = React.lazy(() => import('./pages/AdminPanel/UserInsights'));
const MLStatusPanel = React.lazy(() => import('./pages/AdminPanel/MLStatusPanel'));
const DataReview = React.lazy(() => import('./pages/AdminPanel/DataReview'));
const LogsViewer = React.lazy(() => import('./pages/AdminPanel/LogsViewer'));
const ProtectedAdminRoute = React.lazy(() => import('./components/admin/ProtectedAdminRoute'));

function App() {
  console.log('🚀 [App] App component mounting');
  
  return (
    <AuthProvider>
      <UserProvider>
        <AlertProvider>
          <Router>
            <div className="App">
              <Suspense fallback={<LoadingFallback message="Loading application..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/" 
                    element={
                      <PublicRoute>
                        <Suspense fallback={<LoadingFallback message="Loading home page..." />}>
                          <LandingPage />
                        </Suspense>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Suspense fallback={<LoadingFallback message="Loading login..." />}>
                          <LoginPage />
                        </Suspense>
                      </PublicRoute>
                    } 
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
                          <DashboardPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/forecast"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback message="Loading forecast..." />}>
                          <ForecastPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback message="Loading analytics..." />}>
                          <AnalyticsPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/alerts"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback message="Loading alerts..." />}>
                          <AlertSettingsPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback message="Loading profile..." />}>
                          <ProfilePage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading admin panel..." />}>
                        <ProtectedAdminRoute>
                          <AdminDashboard />
                        </ProtectedAdminRoute>
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/admin/users"
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading user management..." />}>
                        <ProtectedAdminRoute>
                          <UserInsights />
                        </ProtectedAdminRoute>
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/admin/ml"
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading ML monitoring..." />}>
                        <ProtectedAdminRoute>
                          <MLStatusPanel />
                        </ProtectedAdminRoute>
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/admin/data"
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading data review..." />}>
                        <ProtectedAdminRoute>
                          <DataReview />
                        </ProtectedAdminRoute>
                      </Suspense>
                    }
                  />
                  
                  <Route
                    path="/admin/logs"
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading system logs..." />}>
                        <ProtectedAdminRoute>
                          <LogsViewer />
                        </ProtectedAdminRoute>
                      </Suspense>
                    }
                  />

                  {/* Offline page */}
                  <Route 
                    path="/offline" 
                    element={
                      <Suspense fallback={<LoadingFallback message="Loading offline page..." />}>
                        <OfflinePage />
                      </Suspense>
                    } 
                  />

                  {/* Catch all route - redirect to dashboard if authenticated, otherwise to landing */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </AlertProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
