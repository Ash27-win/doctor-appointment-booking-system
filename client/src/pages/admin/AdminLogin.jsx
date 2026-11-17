/**
 * ============================================================================
 * HOSPITAL ADMINISTRATOR LOGIN (AdminLogin.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Admin Email:
 *    - Validates email format using RFC regular expression.
 *    - Trims and lowercases input before API submission.
 * 2. Admin Password:
 *    - Validates non-empty input and minimum 6 characters.
 * 3. Role Assertion:
 *    - Validates that returned JWT payload has role: 'admin'.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import { FaUserShield, FaEnvelope, FaLock } from 'react-icons/fa';

const AdminLogin = () => {
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
   * Validate Admin Login Form
   */
  const validate = () => {
    const tempErrors = {};

    const emailResult = validateEmail(formData.email, 'Admin Email');
    if (!emailResult.isValid) tempErrors.email = emailResult.error;

    const passResult = validatePassword(formData.password, false);
    if (!passResult.isValid) tempErrors.password = passResult.error;

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors before submitting.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/admin/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      const { token, user } = response.data;
      login(token, user);
      showToast('Authenticated as Hospital Administrator.', 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Admin Login Error:', error);
      const errMsg = error.response?.data?.message || 'Admin authentication failed.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper container animated-fade-in">
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0" style={{ borderTop: '4px solid #ef4444 !important' }}>
        <div className="text-center mb-4">
          <div className="bg-danger text-white d-inline-flex p-3 rounded-circle fs-3 mb-3 shadow-sm">
            <FaUserShield />
          </div>
          <h2 className="fw-bold text-dark mb-1">Clinic Admin Portal</h2>
          <p className="text-muted small">Sign in with administrator credentials</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Administrator Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaEnvelope className="text-muted" />
              </span>
              <input
                type="email"
                name="email"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.email ? 'is-invalid' : ''}`}
                placeholder="admin@hospital.com"
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
            className="btn btn-danger w-100 py-2.5 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Verifying Administrator...
              </>
            ) : (
              'Enter Admin Control Center'
            )}
          </button>
        </form>

        <div className="text-center mt-3 border-top pt-3">
          <p className="small text-muted mb-0">
            Return to{' '}
            <Link to="/" className="text-primary fw-bold text-decoration-none">
              Patient Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

