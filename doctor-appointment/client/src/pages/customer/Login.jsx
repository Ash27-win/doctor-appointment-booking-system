import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path after successful login
  const from = location.state?.from || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear validation error when typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.email) {
      tempErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address.';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/customer/login', formData);
      const { token, user } = response.data;
      
      login(token, user);
      showToast('Logged in successfully!', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login Error:', error);
      const errMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-5 animated-fade-in" style={{ paddingTop: '8rem' }}>
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0">
        <div className="text-center mb-4">
          <div className="bg-primary-light text-primary d-inline-flex p-3 rounded-circle fs-3 mb-3">
            <FaUser />
          </div>
          <h2 className="fw-bold text-dark mb-1">Patient Login</h2>
          <p className="text-muted small">Access your CareSync health profile and bookings</p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top">
          <p className="small text-muted mb-2">
            New to CareSync? <Link to="/register" className="text-primary fw-semibold text-decoration-none">Create a patient account</Link>
          </p>
          <p className="small text-muted mb-0">
            Are you a clinician? <Link to="/doctor/login" className="text-secondary fw-semibold text-decoration-none" style={{ color: 'var(--color-secondary)' }}>Access Doctor Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
