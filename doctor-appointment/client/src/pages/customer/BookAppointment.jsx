import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaUserMd, FaCalendarPlus, FaClock, FaCalendarAlt, FaStethoscope } from 'react-icons/fa';

const BookAppointment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Set default values based on logged-in customer profile
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // Get today's date formatted as YYYY-MM-DD for min attribute
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.patient_name.trim()) tempErrors.patient_name = 'Patient name is required.';
    if (!formData.patient_age) {
      tempErrors.patient_age = 'Age is required.';
    } else {
      const ageNum = parseInt(formData.patient_age, 10);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        tempErrors.patient_age = 'Please enter a valid age (1-120).';
      }
    }
    if (!formData.patient_gender) tempErrors.patient_gender = 'Please select a gender.';
    if (!formData.patient_phone) {
      tempErrors.patient_phone = 'Phone number is required.';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.patient_phone.replace(/\s+/g, ''))) {
      tempErrors.patient_phone = 'Please enter a valid phone number (10-15 digits).';
    }
    if (!formData.patient_email) {
      tempErrors.patient_email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.patient_email)) {
      tempErrors.patient_email = 'Please enter a valid email address.';
    }
    if (!formData.appointment_date) tempErrors.appointment_date = 'Please select a date.';
    if (!formData.appointment_time) tempErrors.appointment_time = 'Please select/enter an appointment time.';
    if (!formData.symptoms.trim()) tempErrors.symptoms = 'Please describe your symptoms.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct the validation errors in the form.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        doctor_id: parseInt(id, 10),
        ...formData
      };
      
      await api.post('/api/appointments', payload);
      showToast('Appointment booked successfully!', 'success');
      navigate('/my-appointments');
    } catch (error) {
      console.error('Booking submission error:', error);
      const errMsg = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return <LoadingSpinner message="Fetching doctor details..." />;
  }

  return (
    <div className="container py-5 animated-fade-in" style={{ paddingTop: '8rem' }}>
      <div className="row g-4 justify-content-center">
        
        {/* Doctor Summary Sidebar */}
        <div className="col-lg-4 col-md-5">
          <div className="card glass-card p-4 h-100 border-0 shadow-md">
            <div className="text-center pb-4 border-bottom mb-4">
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {doctor.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
              </div>
              <h4 className="fw-bold text-dark mb-1">{doctor.name}</h4>
              <span className="badge bg-primary text-white px-3 py-1.5 rounded-pill fs-7">{doctor.specialization}</span>
            </div>
            
            <div className="d-flex flex-column gap-3">
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Experience</span>
                <span className="small text-dark fw-semibold">{doctor.experience} Years of Practice</span>
              </div>
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Available Days</span>
                <span className="small text-dark fw-semibold">{doctor.available_days}</span>
              </div>
              <div>
                <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Visiting Hours</span>
                <span className="small text-dark fw-semibold">{doctor.available_time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Form */}
        <div className="col-lg-8 col-md-7">
          <div className="card glass-card p-4 p-md-5 border-0 shadow-md">
            <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <FaCalendarPlus className="text-primary" /> Book Consultation
            </h3>
            <p className="text-muted small mb-4">Fill out the patient details below to submit your appointment slot.</p>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Doctor Name Auto filled */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Consulting Doctor</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaUserMd className="text-muted" /></span>
                    <input 
                      type="text" 
                      className="form-control custom-input border-2 border-start-0 ps-1 bg-light fw-semibold" 
                      value={doctor.name} 
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
                  <label className="form-label small fw-bold text-muted">Age</label>
                  <input
                    type="number"
                    name="patient_age"
                    className={`form-control custom-input border-2 ${errors.patient_age ? 'is-invalid' : ''}`}
                    placeholder="e.g. 28"
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
                  <label className="form-label small fw-bold text-muted">Phone Number</label>
                  <input
                    type="tel"
                    name="patient_phone"
                    className={`form-control custom-input border-2 ${errors.patient_phone ? 'is-invalid' : ''}`}
                    placeholder="9876543210"
                    value={formData.patient_phone}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors.patient_phone && <div className="invalid-feedback">{errors.patient_phone}</div>}
                </div>

                {/* Date */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Appointment Date</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaCalendarAlt className="text-muted" /></span>
                    <input
                      type="date"
                      name="appointment_date"
                      className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.appointment_date ? 'is-invalid' : ''}`}
                      min={getTodayDateString()}
                      value={formData.appointment_date}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {errors.appointment_date && <div className="invalid-feedback">{errors.appointment_date}</div>}
                  </div>
                </div>

                {/* Time */}
                <div className="col-md-6 col-12">
                  <label className="form-label small fw-bold text-muted">Appointment Time</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaClock className="text-muted" /></span>
                    <select
                      name="appointment_time"
                      className={`form-select custom-input border-2 border-start-0 ps-1 ${errors.appointment_time ? 'is-invalid' : ''}`}
                      value={formData.appointment_time}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      <option value="">Choose Time Slot</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                    </select>
                    {errors.appointment_time && <div className="invalid-feedback">{errors.appointment_time}</div>}
                  </div>
                </div>

                {/* Symptoms */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Symptoms / Reason for Visit</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-2"><FaStethoscope className="text-muted" /></span>
                    <textarea
                      name="symptoms"
                      className={`form-control custom-input border-2 border-start-0 ps-1 ${errors.symptoms ? 'is-invalid' : ''}`}
                      rows="3"
                      placeholder="Please briefly describe your current symptoms or reason for consulting the doctor..."
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
                  className="btn btn-primary-custom px-5 py-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Booking Slot...
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
