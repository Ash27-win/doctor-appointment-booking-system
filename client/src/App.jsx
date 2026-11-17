/**
 * ============================================================================
 * CARESYNC MAIN APPLICATION ROUTER (App.jsx)
 * ============================================================================
 * 
 * ROUTING ARCHITECTURE & SECURITY POLICIES:
 * 1. Public Routes:
 *    - / : Landing page and specialists directory
 *    - /login : Patient login
 *    - /register : Patient registration
 *    - /doctor/login : Clinician portal login
 *    - /admin/login : Hospital administrator login
 * 2. Protected Patient Routes (allowedRole="customer"):
 *    - /book/:id : Real-time dynamic consultation scheduling
 *    - /my-appointments : Patient appointments tracking, cancel & reschedule
 *    - /profile : Patient medical profile management
 * 3. Protected Clinician Routes (allowedRole="doctor"):
 *    - /doctor/dashboard : Clinician clinical workspace (prescriptions, tests, bills)
 *    - /doctor/profile : Practicing days, visiting hours, fees & profile
 * 4. Protected Administrator Routes (allowedRole="admin"):
 *    - /admin/dashboard : Hospital analytics, clinician directory & appointments oversight
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/customer/Home';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import BookAppointment from './pages/customer/BookAppointment';
import MyAppointments from './pages/customer/MyAppointments';
import CustomerProfile from './pages/customer/CustomerProfile';

import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

import NotFound from './pages/NotFound';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="d-flex flex-column min-vh-100">
            <Navbar />
        
            <main className="flex-shrink-0">
              <Routes>
                {/* Public Guest & Patient Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Doctor Portal Auth */}
                <Route path="/doctor/login" element={<DoctorLogin />} />

                {/* Admin Portal Auth */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Protected Customer (Patient) Routes */}
                <Route 
                  path="/book/:id" 
                  element={
                    <ProtectedRoute allowedRole="customer">
                      <BookAppointment />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-appointments" 
                  element={
                    <ProtectedRoute allowedRole="customer">
                      <MyAppointments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute allowedRole="customer">
                      <CustomerProfile />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Doctor Routes */}
                <Route 
                  path="/doctor/dashboard" 
                  element={
                    <ProtectedRoute allowedRole="doctor">
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/doctor/profile" 
                  element={
                    <ProtectedRoute allowedRole="doctor">
                      <DoctorProfile />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute allowedRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
