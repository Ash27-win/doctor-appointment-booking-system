/**
 * ============================================================================
 * DOCTOR LOGIN PORTAL (DoctorLogin.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Clinician Email:
 *    - Validates email format using standard RFC regular expression.
 *    - Automatically trims whitespace and converts to lowercase before submission.
 * 2. Password:
 *    - Enforces non-empty check and minimum 6 characters.
 * 3. Error Feedback:
 *    - Real-time field error clearing as the clinician types.
 *    - Displays server validation errors cleanly with Toast messages.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import { FaUserMd, FaEnvelope, FaLock } from 'react-icons/fa';

const DoctorLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate Doctor Login Form
   */
  const validate = () => {
    const tempErrors = {};

    const emailResult = validateEmail(formData.email, 'Clinician Email');
    if (!emailResult.isValid) tempErrors.email = emailResult.error;

    const passResult = validatePassword(formData.password, false);
    if (!passResult.isValid) tempErrors.password = passResult.error;

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors before proceeding.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/doctor/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      const { token, user } = response.data;
      login(token, user);
      showToast(`Welcome back, Dr. ${user.name.replace('Dr. ', '')}!`, 'success');
      navigate('/doctor/dashboard', { replace: true });
    } catch (error) {
      console.error('Doctor Login Error:', error);
      const errMsg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper container animated-fade-in">
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0" style={{ borderTop: '4px solid var(--color-secondary) !important' }}>
        <div className="text-center mb-4">
          <div className="text-white d-inline-flex p-3 rounded-circle fs-3 mb-3" style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0d9488 100%)' }}>
            <FaUserMd />
          </div>
          <h2 className="fw-bold text-dark mb-1">Doctor Portal</h2>
          <p className="text-muted small">Log in to manage appointments, prescriptions, and patient charts</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Clinician Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaEnvelope className="text-muted" />
              </span>
              <input
                type="email"
                name="email"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.email ? 'is-invalid' : ''}`}
                placeholder="doctor@hospital.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          {/* Password input */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-muted">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaLock className="text-muted" />
              </span>
              <input
                type="password"
                name="password"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-secondary-custom w-100 py-2.5 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Authenticating Doctor...
              </>
            ) : (
              'Enter Clinician Workspace'
            )}
          </button>
        </form>

        <div className="text-center mt-3 border-top pt-3">
          <p className="small text-muted mb-1">
            Need to book an appointment as a patient?{' '}
            <Link to="/login" className="text-primary fw-bold text-decoration-none">
              Patient Login
            </Link>
          </p>
          <p className="small text-muted mb-0">
            System Administrator?{' '}
            <Link to="/admin/login" className="text-danger fw-semibold text-decoration-none">
              Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
