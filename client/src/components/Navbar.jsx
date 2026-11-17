/**
 * ============================================================================
 * UNIFIED NAVIGATION BAR (Navbar.jsx)
 * ============================================================================
 * 
 * ROLE-BASED NAVIGATION INSTRUCTIONS:
 * 1. Guest Users (Unauthenticated):
 *    - Displays Patient Login, Register, Clinician Portal, and Admin Portal.
 * 2. Patient / Customer Role:
 *    - Displays: Home, My Appointments, and My Medical Profile.
 * 3. Clinician / Doctor Role:
 *    - Displays: Clinician Workspace (Dashboard) and Schedule & Profile.
 * 4. Hospital Administrator Role:
 *    - Displays: Admin Control Center (Stats, Doctors Directory, All Appointments).
 * 5. Logout:
 *    - Safely clears JWT tokens and user session data from localStorage.
 */

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FaHeartbeat, FaCalendarCheck, FaUserCircle, FaSignOutAlt, 
  FaUserMd, FaUserShield, FaCog, FaUser 
} from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'success');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top custom-navbar">
      <div className="container">
        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-primary" to="/">
          <FaHeartbeat className="text-secondary" style={{ fontSize: '1.8rem', color: '#00a896 !important' }} />
          <span style={{ fontFamily: 'var(--font-heading)' }}>CareSync</span>
        </Link>
        
        {/* Mobile Toggle Button */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center gap-2 mt-2 mt-lg-0">
            {/* Common Public Home Link for Guests & Patients */}
            {(!isAuthenticated || role === 'customer') && (
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold" to="/" end>Home</NavLink>
              </li>
            )}

            {/* CUSTOMER (PATIENT) ROLE LINKS */}
            {isAuthenticated && role === 'customer' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-1.5 fw-semibold" to="/my-appointments">
                    <FaCalendarCheck /> My Appointments
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-1.5 fw-semibold" to="/profile">
                    <FaUser /> My Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* DOCTOR ROLE LINKS */}
            {isAuthenticated && role === 'doctor' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-1.5 fw-semibold" to="/doctor/dashboard">
                    <FaUserMd /> Clinician Workspace
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-1.5 fw-semibold" to="/doctor/profile">
                    <FaCog /> Schedule & Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* ADMIN ROLE LINKS */}
            {isAuthenticated && role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link d-flex align-items-center gap-1.5 fw-semibold text-danger" to="/admin/dashboard">
                  <FaUserShield /> Admin Center
                </NavLink>
              </li>
            )}

            {/* GUEST USERS (UNAUTHENTICATED) */}
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="btn btn-secondary-custom btn-sm px-3 ms-lg-2" to="/login">Patient Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary-custom btn-sm px-3" to="/register">Register</Link>
                </li>
                <li className="nav-item border-start ps-3 ms-2 d-none d-lg-block">
                  <Link className="text-muted fw-semibold text-decoration-none small me-2" to="/doctor/login">Doctor Portal</Link>
                  <Link className="text-danger fw-semibold text-decoration-none small border-start ps-2" to="/admin/login">Admin</Link>
                </li>
                <li className="nav-item d-lg-none mt-2 w-100">
                  <Link className="btn btn-outline-secondary btn-sm w-100 mb-1" to="/doctor/login">Doctor Portal</Link>
                  <Link className="btn btn-outline-danger btn-sm w-100" to="/admin/login">Admin Portal</Link>
                </li>
              </>
            ) : (
              // AUTHENTICATED USER SESSION BADGE
              <li className="nav-item ms-lg-3 w-100 w-lg-auto mt-3 mt-lg-0">
                <div className="d-flex align-items-center gap-2 bg-light p-2 rounded-3 border">
                  {role === 'admin' ? (
                    <FaUserShield className="text-danger fs-4" />
                  ) : role === 'doctor' ? (
                    <FaUserMd className="text-secondary fs-4" />
                  ) : (
                    <FaUserCircle className="text-primary fs-4" />
                  )}
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold text-dark lh-sm" style={{ fontSize: '0.85rem' }}>{user.name}</span>
                    <span className={`text-uppercase fw-semibold ${role === 'admin' ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                      {role}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-link text-danger p-1 ms-2" 
                    title="Sign Out"
                  >
                    <FaSignOutAlt />
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
