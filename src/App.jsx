import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import StudentDashboard from './pages/student/StudentDashboard';
import ElectiveSelectionPage from './pages/student/ElectiveSelectionPage';
import MyAllotmentPage from './pages/student/MyAllotmentPage';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import HelpContactPage from './pages/HelpContactPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#171717] font-sans antialiased selection:bg-crimson-100 selection:text-crimson-800">
          <Navbar />
          <Toast />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/help" element={<HelpContactPage />} />

              {/* Student Password Change Enforcement */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute requiredRole="student">
                    <ChangePasswordPage />
                  </ProtectedRoute>
                }
              />

              {/* Student Protected Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/select"
                element={
                  <ProtectedRoute requiredRole="student">
                    <ElectiveSelectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/allotment"
                element={
                  <ProtectedRoute requiredRole="student">
                    <MyAllotmentPage />
                  </ProtectedRoute>
                }
              />

              {/* Coordinator Protected Routes */}
              <Route
                path="/coordinator"
                element={
                  <ProtectedRoute requiredRole="coordinator">
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
