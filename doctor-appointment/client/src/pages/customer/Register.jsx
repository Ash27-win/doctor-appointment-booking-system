import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FaUserPlus, FaUser, FaEnvelope, FaPhone, FaLock } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (!formData.name.trim()) {
      tempErrors.name = 'Full name is required.';
    }
    if (!formData.email) {
      tempErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address.';
    }
    if (!formData.phone) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      tempErrors.phone = 'Please enter a valid phone number (10-15 digits).';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Send register request without confirmPassword
    const { name, email, phone, password } = formData;
    try {
      await api.post('/api/customer/register', { name, email, phone, password });
      showToast('Registration successful! Please login to continue.', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
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
            <FaUserPlus />
          </div>
          <h2 className="fw-bold text-dark mb-1">Create Patient Account</h2>
          <p className="text-muted small">Register to book medical appointments instantly</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Full Name</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaUser className="text-muted" />
              </span>
              <input
                type="text"
                name="name"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.name ? 'is-invalid' : ''}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
          </div>

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
                placeholder="johndoe@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          {/* Phone input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Phone Number</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaPhone className="text-muted" />
              </span>
              <input
                type="tel"
                name="phone"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
          </div>

          {/* Password input */}
          <div className="mb-3">
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

          {/* Confirm Password input */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-muted">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaLock className="text-muted" />
              </span>
              <input
                type="password"
                name="confirmPassword"
                className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top">
          <p className="small text-muted mb-0">
            Already have an account? <Link to="/login" className="text-primary fw-semibold text-decoration-none">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
