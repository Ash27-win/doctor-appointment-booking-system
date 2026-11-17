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
import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
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
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/doctor/login" element={<DoctorLogin />} />

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
                  path="/doctor/dashboard" 
                  element={
                    <ProtectedRoute allowedRole="doctor">
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 Route */}
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
