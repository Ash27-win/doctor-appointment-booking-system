import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FaUserMd, FaEnvelope, FaLock } from 'react-icons/fa';

const DoctorLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.email) {
      tempErrors.email = 'Clinician email is required.';
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
      const response = await api.post('/api/doctor/login', formData);
      const { token, user } = response.data;
      
      login(token, user);
      showToast(`Welcome back, ${user.name}!`, 'success');
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
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-5 animated-fade-in" style={{ paddingTop: '8rem' }}>
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0" style={{ borderTop: '4px solid var(--color-secondary) !important' }}>
        <div className="text-center mb-4">
          <div className="text-white d-inline-flex p-3 rounded-circle fs-3 mb-3" style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0d9488 100%)' }}>
            <FaUserMd />
          </div>
          <h2 className="fw-bold text-dark mb-1">Doctor Portal</h2>
          <p className="text-muted small">Log in to manage appointments and patient charts</p>
        </div>

        <form onSubmit={handleSubmit}>
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
            className="btn w-100 py-3 text-white fw-bold d-flex align-items-center justify-content-center gap-2 mb-3 border-0"
            style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0d9488 100%)', boxShadow: '0 4px 15px rgba(0, 168, 150, 0.2)' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in to Portal...
              </>
            ) : (
              'Log In to Dashboard'
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top">
          <p className="small text-muted mb-0">
            Are you a patient? <Link to="/login" className="text-primary fw-semibold text-decoration-none">Access Patient Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
