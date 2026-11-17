import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaHeartbeat, FaCalendarCheck, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top custom-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-primary" to="/">
          <FaHeartbeat className="text-secondary" style={{ fontSize: '1.8rem', color: '#00a896 !important' }} />
          <span style={{ fontFamily: 'var(--font-heading)' }}>CareSync</span>
        </Link>
        
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
            {/* If NOT authenticated or role is customer, show patient home */}
            {(!isAuthenticated || role === 'customer') && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/" end>Home</NavLink>
              </li>
            )}

            {/* Customer specific links */}
            {isAuthenticated && role === 'customer' && (
              <li className="nav-item">
                <NavLink className="nav-link d-flex align-items-center gap-2" to="/my-appointments">
                  <FaCalendarCheck /> My Appointments
                </NavLink>
              </li>
            )}

            {/* Doctor specific links */}
            {isAuthenticated && role === 'doctor' && (
              <li className="nav-item">
                <NavLink className="nav-link d-flex align-items-center gap-2" to="/doctor/dashboard">
                  Dashboard
                </NavLink>
              </li>
            )}

            {/* Guest Users */}
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="btn btn-secondary-custom btn-sm px-3 ms-lg-2" to="/login">Patient Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary-custom btn-sm px-3" to="/register">Register</Link>
                </li>
                <li className="nav-item border-start ps-3 ms-2 d-none d-lg-block">
                  <Link className="text-muted fw-semibold text-decoration-none" to="/doctor/login">Doctor Portal</Link>
                </li>
                <li className="nav-item d-lg-none mt-2">
                  <Link className="btn btn-outline-secondary w-100" to="/doctor/login">Doctor Portal</Link>
                </li>
              </>
            ) : (
              // Authenticated Users (Patient or Doctor)
              <li className="nav-item dropdown ms-lg-3 w-100 w-lg-auto mt-3 mt-lg-0">
                <div className="d-flex align-items-center gap-2 bg-light p-2 rounded-3 border">
                  <FaUserCircle className="text-primary fs-4" />
                  <div className="d-flex flex-column text-start">
                    <span className="fw-bold text-dark lh-sm" style={{ fontSize: '0.85rem' }}>{user.name}</span>
                    <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>{role}</span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-link text-danger p-1 ms-2" 
                    title="Logout"
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
