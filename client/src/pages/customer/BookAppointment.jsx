/**
 * ============================================================================
 * REAL-TIME DYNAMIC APPOINTMENT BOOKING PAGE (BookAppointment.jsx)
 * ============================================================================
 * 
 * VALIDATION & DYNAMIC SCHEDULING INSTRUCTIONS:
 * 1. Doctor Schedule Enforcement:
 *    - Date picker restricts minimum date to today (past dates disabled).
 *    - Validates chosen day-of-week against doctor's `available_days`.
 *    - Warns and disables slot booking if patient chooses a doctor's day off.
 * 2. Dynamic Real-Time Slot Engine:
 *    - Fetches live slot states from `/api/doctors/:id/available-slots?date=...`.
 *    - Slots are dynamically parsed from doctor's visiting hours in 30-min intervals.
 *    - Displays slot states visually:
 *      * Available: Clickable active slot button.
 *      * Booked: Disabled badge (prevents double-booking).
 *      * Past: Disabled badge (prevents booking slots that have already passed today).
 * 3. Patient Information Validation:
 *    - Name: 2-50 alphabetic characters.
 *    - Age: Integer between 1 and 120.
 *    - Phone: 10-digit mobile number starting with 6-9.
 *    - Email: Standard RFC email format.
 *    - Symptoms: Meaningful description (min 10 characters).
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateAge,
  validateAppointmentDate,
  validateTimeSlot,
  validateSymptoms
} from '../../utils/validators';
import { 
  FaUserMd, FaCalendarPlus, FaClock, FaCalendarAlt, 
  FaStethoscope, FaTag, FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';

const BookAppointment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Dynamic slots state
  const [slotsData, setSlotsData] = useState({
    loading: false,
    isWorkingDay: true,
    message: '',
    slots: []
  });

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    patient_phone: '',
    patient_email: '',
    appointment_date: '',
    appointment_time: '',
    symptoms: ''
  });

  // Fetch Doctor info
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await api.get(`/api/doctors/${id}`);
        setDoctor(response.data);
      } catch (error) {
        console.error('Fetch doctor detail error:', error);
        showToast('Error loading doctor details.', 'error');
        navigate('/');
      } finally {
        setLoadingDoctor(false);
      }
    };
    fetchDoctor();
  }, [id, navigate, showToast]);

  // Pre-fill fields from logged-in user profile
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        patient_name: user.name || '',
        patient_phone: user.phone || '',
        patient_email: user.email || ''
      }));
    }
  }, [user]);

  // Get Today's date formatted as YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  // Get Maximum booking date (90 days ahead)
  const getMaxDateString = () => {
    const max = new Date();
    max.setDate(max.getDate() + 90);
    const dd = String(max.getDate()).padStart(2, '0');
    const mm = String(max.getMonth() + 1).padStart(2, '0');
    const yyyy = max.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  // Real-time slot availability fetcher when appointment_date changes
  useEffect(() => {
    if (!formData.appointment_date || !id) return;

    const fetchSlots = async () => {
      setSlotsData((prev) => ({ ...prev, loading: true }));
      try {
        const res = await api.get(`/api/doctors/${id}/available-slots?date=${formData.appointment_date}`);
        setSlotsData({
          loading: false,
          isWorkingDay: res.data.isWorkingDay,
          message: res.data.message || '',
          slots: res.data.slots || []
        });

        // Reset selected time if it's no longer available on this date
        setFormData((prev) => ({ ...prev, appointment_time: '' }));
      } catch (err) {
        console.error('Error fetching dynamic slots:', err);
        setSlotsData({
          loading: false,
          isWorkingDay: false,
          message: 'Failed to retrieve available slots for this date.',
          slots: []
        });
      }
    };

    fetchSlots();
  }, [formData.appointment_date, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSlotSelect = (slotTime) => {
    setFormData((prev) => ({ ...prev, appointment_time: slotTime }));
    if (errors.appointment_time) {
      setErrors((prev) => ({ ...prev, appointment_time: '' }));
    }
  };

  /**
   * Comprehensive Form Validation
   */
  const validate = () => {
    const tempErrors = {};

    // 1. Patient Name
    const nameVal = validateName(formData.patient_name, 'Patient Full Name');
    if (!nameVal.isValid) tempErrors.patient_name = nameVal.error;

    // 2. Patient Age
    const ageVal = validateAge(formData.patient_age);
    if (!ageVal.isValid) tempErrors.patient_age = ageVal.error;

    // 3. Gender
    if (!formData.patient_gender) {
      tempErrors.patient_gender = 'Please select a gender.';
    }

    // 4. Phone
    const phoneVal = validatePhone(formData.patient_phone, 'Phone Number');
    if (!phoneVal.isValid) tempErrors.patient_phone = phoneVal.error;

    // 5. Email
    const emailVal = validateEmail(formData.patient_email, 'Email Address');
    if (!emailVal.isValid) tempErrors.patient_email = emailVal.error;

    // 6. Appointment Date
    const dateVal = validateAppointmentDate(formData.appointment_date, doctor?.available_days);
    if (!dateVal.isValid) tempErrors.appointment_date = dateVal.error;

    // 7. Appointment Time Slot
    const timeVal = validateTimeSlot(formData.appointment_time);
    if (!timeVal.isValid) tempErrors.appointment_time = timeVal.error;

    // 8. Symptoms
    const symptomsVal = validateSymptoms(formData.symptoms);
    if (!symptomsVal.isValid) tempErrors.symptoms = symptomsVal.error;

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct the validation errors in the booking form.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        doctor_id: parseInt(id, 10),
        patient_name: formData.patient_name.trim(),
        patient_age: parseInt(formData.patient_age, 10),
        patient_gender: formData.patient_gender,
        patient_phone: formData.patient_phone.trim(),
        patient_email: formData.patient_email.trim(),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        symptoms: formData.symptoms.trim()
      };

      await api.post('/api/appointments', payload);
      showToast('Appointment booked successfully! Slot reserved.', 'success');
      navigate('/my-appointments');
    } catch (error) {
      console.error('Booking submission error:', error);
      const errMsg = error.response?.data?.message || 'Failed to book appointment. Please try another slot.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return <LoadingSpinner message="Fetching doctor details..." />;
  }

  return (
    <div className="page-container container animated-fade-in">
      <div className="row g-4 justify-content-center">
        
        {/* Doctor Summary Sidebar */}
        <div className="col-lg-4 col-md-5">
          <div className="card glass-card p-4 h-100 border-0 shadow-md">
            <div className="text-center pb-4 border-bottom mb-4">
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg mx-auto mb-3" style={{ width: '85px', height: '85px', fontSize: '1.9rem', fontWeight: 'bold' }}>
                {doctor.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
              </div>
              <h4 className="fw-bold text-dark mb-1">{doctor.name}</h4>
              <span className="badge bg-primary text-white px-3 py-1.5 rounded-pill fs-7">{doctor.specialization}</span>
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Experience</span>
                <span className="small text-dark fw-semibold">{doctor.experience} Years of Practice</span>
              </div>
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Consultation Fee</span>
                <span className="small text-success fw-bold fs-6">₹{parseFloat(doctor.consultation_fee || 500).toFixed(2)}</span>
              </div>
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Available Days</span>
                <span className="small text-dark fw-semibold">{doctor.available_days}</span>
              </div>
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Visiting Hours</span>
                <span className="small text-dark fw-semibold">{doctor.available_time}</span>
              </div>
              {doctor.bio && (
                <div>
                  <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>About Doctor</span>
                  <p className="small text-muted mb-0">{doctor.bio}</p>
                </div>
              )}
            </div>

            <div className="bg-light p-3 rounded-3 border">
              <span className="d-flex align-items-center gap-2 small text-primary fw-bold mb-1">
                <FaCheckCircle /> Guaranteed Spot
              </span>
              <p className="small text-muted mb-0">Slots are locked immediately on booking to avoid double-bookings.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Appointment Form */}
        <div className="col-lg-8 col-md-7">
          <div className="card glass-card p-4 p-md-5 border-0 shadow-md">
            <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <FaCalendarPlus className="text-primary" /> Book Consultation
            </h3>
            <p className="text-muted small mb-4">Select your consultation date and click an available slot to book.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                {/* Doctor Name Auto filled */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Consulting Specialist</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaUserMd className="text-muted" /></span>
                    <input 
                      type="text" 
                      className="form-control custom-input border-2 border-start-0 ps-1 bg-light fw-semibold" 
                      value={`${doctor.name} (${doctor.specialization})`} 
                      readOnly 
                    />
                  </div>
                </div>

                {/* Patient Name */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Patient Full Name</label>
                  <input
                    type="text"
                    name="patient_name"
                    className={`form-control custom-input border-2 ${errors.patient_name ? 'is-invalid' : ''}`}
                    placeholder="Enter full name"
                    value={formData.patient_name}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.patient_name && <div className="invalid-feedback">{errors.patient_name}</div>}
                </div>

                {/* Age */}
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-bold text-muted">Age (1-120)</label>
                  <input
                    type="number"
                    name="patient_age"
                    min="1"
                    max="120"
                    className={`form-control custom-input border-2 ${errors.patient_age ? 'is-invalid' : ''}`}
                    placeholder="e.g. 30"
                    value={formData.patient_age}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.patient_age && <div className="invalid-feedback">{errors.patient_age}</div>}
                </div>

                {/* Gender */}
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-bold text-muted">Gender</label>
                  <select
                    name="patient_gender"
                    className={`form-select custom-input border-2 ${errors.patient_gender ? 'is-invalid' : ''}`}
                    value={formData.patient_gender}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.patient_gender && <div className="invalid-feedback">{errors.patient_gender}</div>}
                </div>

                {/* Email */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Email Address</label>
                  <input
                    type="email"
                    name="patient_email"
                    className={`form-control custom-input border-2 ${errors.patient_email ? 'is-invalid' : ''}`}
                    placeholder="name@example.com"
                    value={formData.patient_email}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.patient_email && <div className="invalid-feedback">{errors.patient_email}</div>}
                </div>

                {/* Phone */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Mobile Number (10 Digits)</label>
                  <input
                    type="tel"
                    name="patient_phone"
                    maxLength="10"
                    className={`form-control custom-input border-2 ${errors.patient_phone ? 'is-invalid' : ''}`}
                    placeholder="9876543210"
                    value={formData.patient_phone}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.patient_phone && <div className="invalid-feedback">{errors.patient_phone}</div>}
                </div>

                {/* Date Selection */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Appointment Date</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaCalendarAlt className="text-muted" /></span>
                    <input
                      type="date"
                      name="appointment_date"
                      className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.appointment_date ? 'is-invalid' : ''}`}
                      min={getTodayDateString()}
                      max={getMaxDateString()}
                      value={formData.appointment_date}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {errors.appointment_date && <div className="invalid-feedback">{errors.appointment_date}</div>}
                  </div>
                  <small className="text-muted mt-1 d-block">
                    Practicing days for this doctor: <strong>{doctor.available_days}</strong>
                  </small>
                </div>

                {/* DYNAMIC TIME SLOT PICKER */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted d-flex justify-content-between">
                    <span>Available Consultation Slots</span>
                    {formData.appointment_time && (
                      <span className="text-primary fw-bold">Selected: {formData.appointment_time}</span>
                    )}
                  </label>

                  {!formData.appointment_date ? (
                    <div className="alert alert-light border small text-muted mb-0 py-2">
                      Please pick an appointment date above to view available time slots.
                    </div>
                  ) : slotsData.loading ? (
                    <div className="text-center py-3">
                      <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                      <small className="text-muted">Loading live slots...</small>
                    </div>
                  ) : !slotsData.isWorkingDay ? (
                    <div className="alert alert-warning small mb-0 py-2 d-flex align-items-center gap-2">
                      <FaTimesCircle className="text-warning flex-shrink-0" />
                      <span>{slotsData.message}</span>
                    </div>
                  ) : slotsData.slots.length === 0 ? (
                    <div className="alert alert-secondary small mb-0 py-2">
                      No consultation slots configured for this date.
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex flex-wrap gap-2">
                        {slotsData.slots.map((slot) => {
                          const isSelected = formData.appointment_time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.isAvailable || submitting}
                              className={`btn btn-sm px-3 py-2 rounded-3 transition ${
                                isSelected
                                  ? 'btn-primary-custom text-white shadow-sm'
                                  : slot.isAvailable
                                  ? 'btn-outline-primary bg-white'
                                  : 'btn-light text-muted border text-decoration-line-through'
                              }`}
                              style={{ minWidth: '95px', cursor: slot.isAvailable ? 'pointer' : 'not-allowed' }}
                              onClick={() => handleSlotSelect(slot.time)}
                              title={!slot.isAvailable ? `Slot is ${slot.reason}` : 'Click to select this slot'}
                            >
                              <div className="fw-semibold small">{slot.time}</div>
                              {!slot.isAvailable && (
                                <div style={{ fontSize: '0.65rem' }}>({slot.reason})</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.appointment_time && (
                        <div className="text-danger small mt-2">{errors.appointment_time}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Symptoms */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Symptoms / Reason for Visit (Min 10 Characters)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaStethoscope className="text-muted" /></span>
                    <textarea
                      name="symptoms"
                      className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.symptoms ? 'is-invalid' : ''}`}
                      rows="3"
                      placeholder="Please describe symptoms, existing conditions, or primary reason for consultation..."
                      value={formData.symptoms}
                      onChange={handleChange}
                      disabled={submitting}
                    ></textarea>
                    {errors.symptoms && <div className="invalid-feedback">{errors.symptoms}</div>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2"
                  onClick={() => navigate('/')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-custom px-5 py-2 fw-bold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Confirming Slot...
                    </>
                  ) : (
                    'Confirm Appointment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookAppointment;
