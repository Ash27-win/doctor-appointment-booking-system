/**
 * ============================================================================
 * PATIENT PROFILE MANAGEMENT PAGE (CustomerProfile.jsx)
 * ============================================================================
 * 
 * DESIGN & USABILITY SPECIFICATIONS:
 * 1. Two-State Architecture (View Mode & Edit Mode):
 *    - View Mode: Shows clean clinical summary with an "Edit Personal Information" button.
 *    - Edit Mode: Enables input editing with "Save Changes" and "Cancel".
 *    - Once saved, returns to View Mode immediately with updated details.
 *    - Users can toggle and update their profile repeatedly ("again and again") without conflicts.
 * 2. Real-Time Validations:
 *    - Name: 2-50 alphabetic characters.
 *    - Phone: 10-digit mobile number.
 *    - Date of Birth: Cannot be in future.
 *    - Password Change: Strong policy check.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  validateName, 
  validatePhone, 
  validatePassword 
} from '../../utils/validators';
import { 
  FaUserCircle, FaPhone, FaEnvelope, FaCalendarAlt, 
  FaHeartbeat, FaMapMarkerAlt, FaLock, FaSave, FaShieldAlt,
  FaEdit, FaTimes, FaCalendarCheck, FaIdCard, FaCheckCircle
} from 'react-icons/fa';

const CustomerProfile = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    blood_group: '',
    dob: '',
    address: '',
    emergency_contact: ''
  });

  // Backup of saved data to restore on cancel
  const [savedBackup, setSavedBackup] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});

  // Password Form States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch current patient profile from database
  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/customer/profile');
      const data = res.data;
      const loaded = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        dob: data.dob ? data.dob.split('T')[0] : '',
        address: data.address || '',
        emergency_contact: data.emergency_contact || ''
      };
      setProfileData(loaded);
      setSavedBackup(loaded);
    } catch (err) {
      console.error('Fetch profile error:', err);
      showToast('Error loading profile information.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCancelEdit = () => {
    if (savedBackup) {
      setProfileData(savedBackup);
    }
    setProfileErrors({});
    setIsEditing(false);
  };

  /**
   * Calculate age from Date of Birth
   */
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  /**
   * Validate Profile Details Form
   */
  const validateProfile = () => {
    const errors = {};

    const nameVal = validateName(profileData.name, 'Full Name');
    if (!nameVal.isValid) errors.name = nameVal.error;

    const phoneVal = validatePhone(profileData.phone, 'Mobile Number');
    if (!phoneVal.isValid) errors.phone = phoneVal.error;

    if (profileData.dob) {
      const dobDate = new Date(profileData.dob);
      if (dobDate > new Date()) {
        errors.dob = 'Date of birth cannot be in the future.';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate Password Change Form
   */
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    const passVal = validatePassword(passwordData.newPassword, true);
    if (!passVal.isValid) errors.newPassword = passVal.error;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Profile Changes (Can be performed again and again)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      showToast('Please correct validation errors in personal details.', 'warning');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put('/api/customer/profile', profileData);
      showToast('Personal information updated successfully!', 'success');
      
      const updatedUser = res.data.user || profileData;
      const formatted = {
        name: updatedUser.name || profileData.name,
        email: profileData.email,
        phone: updatedUser.phone || profileData.phone,
        gender: updatedUser.gender || profileData.gender,
        blood_group: updatedUser.blood_group || profileData.blood_group,
        dob: updatedUser.dob ? updatedUser.dob.split('T')[0] : profileData.dob,
        address: updatedUser.address || profileData.address,
        emergency_contact: updatedUser.emergency_contact || profileData.emergency_contact
      };

      setProfileData(formatted);
      setSavedBackup(formatted);

      // Update AuthContext session storage
      const storedToken = localStorage.getItem('token');
      if (storedToken && user) {
        login(storedToken, { ...user, name: formatted.name, phone: formatted.phone });
      }

      // Return to clean View Mode (can be re-edited anytime by clicking Edit)
      setIsEditing(false);
    } catch (err) {
      console.error('Update profile error:', err);
      const errMsg = err.response?.data?.message || 'Failed to update profile.';
      showToast(errMsg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      showToast('Please fix password requirements.', 'warning');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/api/customer/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast('Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Change password error:', err);
      const errMsg = err.response?.data?.message || 'Failed to change password.';
      showToast(errMsg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner message="Loading patient profile..." />;
  }

  const patientAge = calculateAge(profileData.dob);

  return (
    <div className="page-container container animated-fade-in">
      
      {/* 1. Profile Hero Summary Card */}
      <div className="card glass-card p-4 p-md-5 border-0 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
          <div className="d-flex align-items-center gap-3">
            <div className="profile-avatar-circle flex-shrink-0">
              {getInitials(profileData.name)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h3 className="fw-bold text-dark mb-0">{profileData.name || 'Patient'}</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill small">
                  <FaCheckCircle className="me-1" /> Active Patient
                </span>
                {profileData.blood_group && (
                  <span className="badge bg-danger text-white px-2.5 py-1 rounded-pill small">
                    <FaHeartbeat className="me-1" /> {profileData.blood_group}
                  </span>
                )}
              </div>
              <p className="text-muted small mb-1">
                Patient Account ID: <strong>#PAT-{user?.id ? String(user.id).padStart(4, '0') : '0001'}</strong> • CareSync Health Registry
              </p>
              <div className="d-flex flex-wrap gap-3 text-secondary small">
                <span><FaEnvelope className="text-primary me-1" /> {profileData.email}</span>
                <span><FaPhone className="text-primary me-1" /> {profileData.phone}</span>
                {patientAge !== null && <span><FaCalendarAlt className="text-primary me-1" /> {patientAge} Years Old</span>}
              </div>
            </div>
          </div>

          {/* Edit Profile Toggle Button */}
          <div className="flex-shrink-0 text-md-end">
            {!isEditing ? (
              <button
                type="button"
                className="btn btn-primary-custom d-inline-flex align-items-center gap-2 px-4 py-2.5"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> Edit Personal Information
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2"
                onClick={handleCancelEdit}
              >
                <FaTimes /> Cancel Editing
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Personal Information (View Mode vs Edit Mode) */}
        <div className="col-lg-8">
          <div className="card glass-card p-4 p-md-5 border-0 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <FaIdCard className="text-primary" /> Personal & Clinical Records
              </h4>
              {isEditing && (
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2.5 py-1 rounded-pill small">
                  ✏️ Editing Mode Active
                </span>
              )}
            </div>
            <p className="text-muted small mb-4">
              {isEditing 
                ? 'Update your personal or emergency details below. Click "Save Changes" when done.' 
                : 'Your current saved patient records. Click "Edit Personal Information" above to make changes at any time.'}
            </p>

            {/* --- VIEW MODE: Clean, readable information grid --- */}
            {!isEditing ? (
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Full Name</span>
                    <strong className="text-dark fs-6">{profileData.name || 'Not provided'}</strong>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Email Address</span>
                    <strong className="text-dark fs-6">{profileData.email}</strong>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Contact Phone</span>
                    <strong className="text-dark fs-6">{profileData.phone || 'Not provided'}</strong>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Date of Birth</span>
                    <strong className="text-dark fs-6">
                      {profileData.dob ? `${profileData.dob} (${patientAge} yrs)` : 'Not provided'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Gender</span>
                    <strong className="text-dark fs-6">{profileData.gender || 'Not specified'}</strong>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Blood Group</span>
                    <strong className="text-danger fs-6">{profileData.blood_group || 'Not recorded'}</strong>
                  </div>
                </div>

                <div className="col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Residential Address</span>
                    <span className="text-dark">{profileData.address || 'No residential address on file.'}</span>
                  </div>
                </div>

                <div className="col-12">
                  <div className="profile-field-box">
                    <span className="d-block text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Emergency Contact</span>
                    <span className="text-dark fw-medium">{profileData.emergency_contact || 'No emergency contact registered.'}</span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="col-12 mt-4 pt-3 border-top d-flex gap-2 flex-wrap">
                  <Link to="/my-appointments" className="btn btn-outline-primary btn-sm px-3 d-inline-flex align-items-center gap-1.5">
                    <FaCalendarCheck /> View My Consultations
                  </Link>
                  <Link to="/" className="btn btn-light border btn-sm px-3">
                    Book New Appointment
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary-custom btn-sm px-3 ms-auto"
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit /> Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              /* --- EDIT MODE: Input Form --- */
              <form onSubmit={handleSaveProfile} noValidate>
                <div className="row g-3">
                  {/* Full Name */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className={`form-control custom-input ${profileErrors.name ? 'is-invalid' : ''}`}
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                      placeholder="e.g. Rohan Verma"
                    />
                    {profileErrors.name && <div className="invalid-feedback">{profileErrors.name}</div>}
                  </div>

                  {/* Email (Read Only) */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Email Address (Account Identifier)</label>
                    <input
                      type="email"
                      className="form-control custom-input bg-light text-muted"
                      value={profileData.email}
                      readOnly
                    />
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Email is your primary login identifier.</small>
                  </div>

                  {/* Mobile Phone */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Mobile Phone (10 Digits)</label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength="10"
                      className={`form-control custom-input ${profileErrors.phone ? 'is-invalid' : ''}`}
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                      placeholder="9876543210"
                    />
                    {profileErrors.phone && <div className="invalid-feedback">{profileErrors.phone}</div>}
                  </div>

                  {/* Date of Birth */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className={`form-control custom-input ${profileErrors.dob ? 'is-invalid' : ''}`}
                      value={profileData.dob}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    />
                    {profileErrors.dob && <div className="invalid-feedback">{profileErrors.dob}</div>}
                  </div>

                  {/* Gender */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Gender</label>
                    <select
                      name="gender"
                      className="form-select custom-input"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div className="col-md-6 col-12">
                    <label className="form-label small fw-bold text-muted">Blood Group</label>
                    <select
                      name="blood_group"
                      className="form-select custom-input"
                      value={profileData.blood_group}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Residential Address */}
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">Residential Address</label>
                    <textarea
                      name="address"
                      rows="2"
                      className="form-control custom-input"
                      placeholder="Enter street, city, state and pincode"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    ></textarea>
                  </div>

                  {/* Emergency Contact */}
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">Emergency Contact (Name & Phone)</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      className="form-control custom-input"
                      placeholder="e.g. Pooja Verma (Spouse) - 9876543211"
                      value={profileData.emergency_contact}
                      onChange={handleProfileChange}
                      disabled={savingProfile}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light border px-4 py-2"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-custom px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                    disabled={savingProfile}
                  >
                    <FaSave /> {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Security & Password Update */}
        <div className="col-lg-4">
          <div className="card glass-card p-4 border-0 shadow-sm h-100">
            <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <FaLock className="text-secondary" /> Account Security
            </h5>
            <p className="text-muted small mb-4">Update your password to keep your health data protected.</p>

            <form onSubmit={handleSavePassword} noValidate>
              {/* Current Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className={`form-control custom-input ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                />
                {passwordErrors.currentPassword && <div className="invalid-feedback">{passwordErrors.currentPassword}</div>}
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className={`form-control custom-input ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, number & symbol"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                />
                {passwordErrors.newPassword && <div className="invalid-feedback">{passwordErrors.newPassword}</div>}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-control custom-input ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                />
                {passwordErrors.confirmPassword && <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-secondary-custom w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={savingPassword}
              >
                <FaShieldAlt /> {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CustomerProfile;
