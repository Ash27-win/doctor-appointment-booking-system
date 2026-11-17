/**
 * ============================================================================
 * PATIENT LOGIN PAGE (Login.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Email Address:
 *    - Validates presence and RFC-compliant email structure.
 *    - Trims whitespace before API submission.
 * 2. Password:
 *    - Validates minimum length (at least 6 characters).
 *    - Rejects empty input immediately on client side.
 * 3. Error Handling:
 *    - Displays field-specific invalid feedback below input fields.
 *    - Clears validation errors dynamically as the user types.
 *    - Surfaces API response error messages using Toast notifications.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  // Handle typing and real-time field error clearance
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Client-side Form Validation
   * Checks email and password against centralized validator rules.
   */
  const validate = () => {
    const tempErrors = {};

    // 1. Email validation
    const emailResult = validateEmail(formData.email, 'Patient Email');
    if (!emailResult.isValid) {
      tempErrors.email = emailResult.error;
    }

    // 2. Password validation
    const passResult = validatePassword(formData.password, false);
    if (!passResult.isValid) {
      tempErrors.password = passResult.error;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct the validation errors in the form.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/customer/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      const { token, user } = response.data;
      login(token, user);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login Error:', error);
      const errMsg = error.response?.data?.message || 'Login failed. Please verify your email and password.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper container animated-fade-in">
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0">
        <div className="text-center mb-4">
          <div className="bg-primary-light text-primary d-inline-flex p-3 rounded-circle fs-3 mb-3">
            <FaUser />
          </div>
          <h2 className="fw-bold text-dark mb-1">Patient Login</h2>
          <p className="text-muted small">Access your CareSync health profile and bookings</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaEnvelope className="text-muted" />
              </span>
              <input
                type="email"
                name="email"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.email ? 'is-invalid' : ''}`}
                placeholder="yourname@example.com"
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
            className="btn btn-primary-custom w-100 py-2.5 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-3 border-top pt-3">
          <p className="small text-muted mb-1">
            Don't have a patient account?{' '}
            <Link to="/register" className="text-primary fw-bold text-decoration-none">
              Register here
            </Link>
          </p>
          <p className="small text-muted mb-0">
            Are you a clinician?{' '}
            <Link to="/doctor/login" className="text-secondary fw-semibold text-decoration-none">
              Clinician Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
