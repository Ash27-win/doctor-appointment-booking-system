/**
 * ============================================================================
 * CLINICIAN PROFILE & SCHEDULE SETTINGS (DoctorProfile.jsx)
 * ============================================================================
 * 
 * VALIDATION INSTRUCTIONS:
 * 1. Professional Schedule & Practice Hours:
 *    - Available Days: Checkbox group (Monday through Sunday); at least 1 day must be selected.
 *    - Visiting Hours: Valid start and end times (e.g. 09:00 AM - 01:00 PM).
 *    - Consultation Fee: Must be a positive number greater than ₹0.
 *    - Experience: Positive integer (0-60 years).
 * 2. Security / Password Update:
 *    - Validates existing password using backend hash verification.
 *    - Enforces strong password policy on the new password.
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { validateName, validatePassword } from '../../utils/validators';
import { 
  FaUserMd, FaCalendarCheck, FaClock, FaRupeeSign, 
  FaBriefcase, FaLock, FaSave, FaShieldAlt 
} from 'react-icons/fa';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorProfile = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    specialization: '',
    experience: 0,
    available_days: '',
    available_time: '',
    consultation_fee: '500.00',
    bio: ''
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [profileErrors, setProfileErrors] = useState({});

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Load doctor profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/doctor/profile');
        const d = res.data;
        setProfileData({
          name: d.name || '',
          email: d.email || '',
          specialization: d.specialization || '',
          experience: d.experience || 0,
          available_days: d.available_days || '',
          available_time: d.available_time || '',
          consultation_fee: d.consultation_fee || '500.00',
          bio: d.bio || ''
        });

        if (d.available_days) {
          const daysArray = d.available_days.split(',').map((day) => day.trim());
          setSelectedDays(daysArray);
        }
      } catch (err) {
        console.error('Fetch doctor profile error:', err);
        showToast('Error loading clinician profile.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  const handleDayToggle = (day) => {
    let updated;
    if (selectedDays.includes(day)) {
      updated = selectedDays.filter((d) => d !== day);
    } else {
      updated = [...selectedDays, day];
    }
    setSelectedDays(updated);
    setProfileData((prev) => ({ ...prev, available_days: updated.join(', ') }));
    if (profileErrors.available_days) {
      setProfileErrors((prev) => ({ ...prev, available_days: '' }));
    }
  };

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

  /**
   * Validate Doctor Profile Form
   */
  const validateProfile = () => {
    const errors = {};

    const nameVal = validateName(profileData.name, 'Doctor Name');
    if (!nameVal.isValid) errors.name = nameVal.error;

    if (!profileData.specialization.trim()) {
      errors.specialization = 'Specialization is required.';
    }

    const exp = parseInt(profileData.experience, 10);
    if (isNaN(exp) || exp < 0 || exp > 60) {
      errors.experience = 'Experience must be between 0 and 60 years.';
    }

    if (selectedDays.length === 0) {
      errors.available_days = 'At least one practicing day must be selected.';
    }

    if (!profileData.available_time.trim()) {
      errors.available_time = 'Visiting hours are required (e.g. 09:00 AM - 01:00 PM).';
    }

    const fee = parseFloat(profileData.consultation_fee);
    if (isNaN(fee) || fee <= 0) {
      errors.consultation_fee = 'Consultation fee must be greater than ₹0.';
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

  // Submit Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      showToast('Please fix validation errors in schedule settings.', 'warning');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        ...profileData,
        experience: parseInt(profileData.experience, 10),
        consultation_fee: parseFloat(profileData.consultation_fee),
        available_days: selectedDays.join(', ')
      };

      await api.put('/api/doctor/profile', payload);
      showToast('Doctor profile and schedule updated successfully!', 'success');

      // Update AuthContext user state
      const storedToken = localStorage.getItem('token');
      if (storedToken && user) {
        login(storedToken, { ...user, name: profileData.name, specialization: profileData.specialization });
      }
    } catch (err) {
      console.error('Update doctor profile error:', err);
      const errMsg = err.response?.data?.message || 'Failed to update clinician profile.';
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
      await api.put('/api/doctor/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Change password error:', err);
      const errMsg = err.response?.data?.message || 'Failed to change password.';
      showToast(errMsg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading clinician profile & schedule..." />;
  }

  return (
    <div className="page-container container animated-fade-in">
      
      {/* Page Title */}
      <div className="mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-1">Doctor Profile & Schedule Settings</h2>
        <p className="text-muted small mb-0">Configure your practicing days, consultation hours, fees, and credentials</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Clinical Information Form */}
        <div className="col-lg-8">
          <div className="card glass-card p-4 p-md-5 border-0 shadow-sm">
            <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FaUserMd className="text-primary" /> Practice & Schedule Information
            </h4>
            <p className="text-muted small mb-4">Changes to your available days and visiting hours automatically update patient booking slots.</p>

            <form onSubmit={handleSaveProfile} noValidate>
              <div className="row g-3">
                {/* Doctor Name */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Clinician Name</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control custom-input border-2 ${profileErrors.name ? 'is-invalid' : ''}`}
                    value={profileData.name}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  />
                  {profileErrors.name && <div className="invalid-feedback">{profileErrors.name}</div>}
                </div>

                {/* Email (Read Only) */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Email (Clinician Account)</label>
                  <input
                    type="email"
                    className="form-control custom-input border-2 bg-light text-muted"
                    value={profileData.email}
                    readOnly
                  />
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>Email is your login identifier.</small>
                </div>

                {/* Specialization */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    className={`form-control custom-input border-2 ${profileErrors.specialization ? 'is-invalid' : ''}`}
                    placeholder="e.g. Cardiologist, Dermatologist"
                    value={profileData.specialization}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  />
                  {profileErrors.specialization && <div className="invalid-feedback">{profileErrors.specialization}</div>}
                </div>

                {/* Experience */}
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-bold text-muted">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    min="0"
                    max="60"
                    className={`form-control custom-input border-2 ${profileErrors.experience ? 'is-invalid' : ''}`}
                    value={profileData.experience}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  />
                  {profileErrors.experience && <div className="invalid-feedback">{profileErrors.experience}</div>}
                </div>

                {/* Consultation Fee */}
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-bold text-muted">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    step="50"
                    name="consultation_fee"
                    className={`form-control custom-input border-2 ${profileErrors.consultation_fee ? 'is-invalid' : ''}`}
                    value={profileData.consultation_fee}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  />
                  {profileErrors.consultation_fee && <div className="invalid-feedback">{profileErrors.consultation_fee}</div>}
                </div>

                {/* Available Days Checkboxes */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted d-block">Available Practicing Days</label>
                  <div className="d-flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`btn btn-sm px-3 py-1.5 rounded-pill transition ${
                            isChecked ? 'btn-primary-custom text-white' : 'btn-outline-secondary bg-light'
                          }`}
                          onClick={() => handleDayToggle(day)}
                          disabled={savingProfile}
                        >
                          {isChecked ? '✓ ' : '+ '} {day}
                        </button>
                      );
                    })}
                  </div>
                  {profileErrors.available_days && (
                    <div className="text-danger small mt-1">{profileErrors.available_days}</div>
                  )}
                </div>

                {/* Visiting Hours */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Visiting Hours (Start Time - End Time)</label>
                  <input
                    type="text"
                    name="available_time"
                    className={`form-control custom-input border-2 ${profileErrors.available_time ? 'is-invalid' : ''}`}
                    placeholder="e.g. 09:00 AM - 01:00 PM or 02:00 PM - 06:00 PM"
                    value={profileData.available_time}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  />
                  {profileErrors.available_time && <div className="invalid-feedback">{profileErrors.available_time}</div>}
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Note: Appointment slots are automatically generated at 30-minute intervals within these hours.
                  </small>
                </div>

                {/* Professional Bio */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">About Clinician / Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    className="form-control custom-input border-2"
                    placeholder="Brief professional summary, qualifications, memberships, and hospital awards..."
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                  ></textarea>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-end">
                <button
                  type="submit"
                  className="btn btn-primary-custom px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                  disabled={savingProfile}
                >
                  <FaSave /> {savingProfile ? 'Saving...' : 'Save Schedule & Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Password Update */}
        <div className="col-lg-4">
          <div className="card glass-card p-4 border-0 shadow-sm h-100">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FaLock className="text-secondary" /> Change Password
            </h5>
            <p className="text-muted small mb-4">Ensure your clinician portal is protected with a secure password.</p>

            <form onSubmit={handleSavePassword} noValidate>
              {/* Current Password */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className={`form-control custom-input border-2 ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
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
                  className={`form-control custom-input border-2 ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
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
                  className={`form-control custom-input border-2 ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={savingPassword}
                />
                {passwordErrors.confirmPassword && <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-secondary-custom w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
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

export default DoctorProfile;

