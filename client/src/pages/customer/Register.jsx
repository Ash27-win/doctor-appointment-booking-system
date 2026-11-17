/**
 * ============================================================================
 * PATIENT REGISTRATION PAGE (Register.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Full Name:
 *    - Must be between 2 and 50 characters.
 *    - Contains only letters and spaces (rejects numbers and special symbols).
 * 2. Email Address:
 *    - Validates presence and RFC-compliant syntax.
 * 3. Mobile Number:
 *    - Validates strict 10-digit phone format (digits 6-9 leading).
 * 4. Password (Strong Security Policy):
 *    - Minimum 8 characters.
 *    - Must contain uppercase, lowercase, numeric digit, and special character.
 * 5. Confirm Password:
 *    - Must exactly match password input.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validatePassword 
} from '../../utils/validators';
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate all registration fields
   */
  const validate = () => {
    const tempErrors = {};

    // 1. Full name validation
    const nameResult = validateName(formData.name, 'Full Name');
    if (!nameResult.isValid) tempErrors.name = nameResult.error;

    // 2. Email validation
    const emailResult = validateEmail(formData.email, 'Email Address');
    if (!emailResult.isValid) tempErrors.email = emailResult.error;

    // 3. Phone validation
    const phoneResult = validatePhone(formData.phone, 'Phone Number');
    if (!phoneResult.isValid) tempErrors.phone = phoneResult.error;

    // 4. Strong Password validation
    const passResult = validatePassword(formData.password, true);
    if (!passResult.isValid) tempErrors.password = passResult.error;

    // 5. Confirm password match
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors before registering.', 'warning');
      return;
    }

    setLoading(true);
    const { name, email, phone, password } = formData;

    try {
      await api.post('/api/customer/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password
      });

      showToast('Registration successful! Please login to your account.', 'success');
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
    <div className="auth-page-wrapper container animated-fade-in">
      <div className="card glass-card shadow-lg p-4 p-md-5 max-width-500 w-100 border-0">
        <div className="text-center mb-4">
          <div className="bg-primary-light text-primary d-inline-flex p-3 rounded-circle fs-3 mb-3">
            <FaUserPlus />
          </div>
          <h2 className="fw-bold text-dark mb-1">Create Patient Account</h2>
          <p className="text-muted small">Register to book medical appointments instantly</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
                placeholder="e.g. John Doe"
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
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          {/* Phone input */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Mobile Phone (10 Digits)</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 border-2">
                <FaPhone className="text-muted" />
              </span>
              <input
                type="tel"
                name="phone"
                maxLength="10"
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
            <label className="form-label small fw-bold text-muted">Password (Min 8 Chars, Upper, Lower, Number & Symbol)</label>
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
            className="btn btn-primary-custom w-100 py-2.5 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-3 border-top pt-3">
          <p className="small text-muted mb-0">
            Already registered?{' '}
            <Link to="/login" className="text-primary fw-bold text-decoration-none">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
