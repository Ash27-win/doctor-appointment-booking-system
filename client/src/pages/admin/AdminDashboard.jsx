/**
 * ============================================================================
 * HOSPITAL ADMINISTRATOR DASHBOARD (AdminDashboard.jsx)
 * ============================================================================
 * 
 * VALIDATION & MANAGEMENT INSTRUCTIONS:
 * 1. Live Clinic KPI Analytics:
 *    - Real-time aggregation of doctors, patients, appointments, and billing revenue.
 * 2. Doctor Management & Validation:
 *    - Add Doctor Form Validation:
 *      * Full Name: Alphabetic with title (e.g. Dr. John Smith).
 *      * Email: Valid RFC email, guaranteed unique in database.
 *      * Password: Min 8 chars for new accounts.
 *      * Specialization: Required clinical department.
 *      * Experience: Positive integer (0-60).
 *      * Practicing Days: Multi-select array (at least 1 day selected).
 *      * Visiting Hours: Required start and end time format.
 *      * Consultation Fee: Must be greater than ₹0.
 * 3. Clinic-wide Appointments Audit:
 *    - Search and filter all consultations across all doctors and patients.
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  validateName, 
  validateEmail, 
  validatePassword, 
  validateDoctorProfile 
} from '../../utils/validators';
import { 
  FaUserShield, FaUserMd, FaUsers, FaCalendarCheck, 
  FaCalendarDay, FaRupeeSign, FaPlus, FaEdit, FaTrash, 
  FaSearch, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaCheckDouble 
} from 'react-icons/fa';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDashboard = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' or 'appointments'

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Doctor Modal States (Add / Edit)
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    experience: 5,
    available_days: 'Monday, Wednesday, Friday',
    available_time: '09:00 AM - 01:00 PM',
    consultation_fee: '500.00',
    bio: '',
    email: '',
    password: ''
  });
  const [doctorSelectedDays, setDoctorSelectedDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [doctorFormErrors, setDoctorFormErrors] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch all admin data
  const fetchData = async () => {
    try {
      const [statsRes, doctorsRes, apptsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/doctors'),
        api.get('/api/admin/appointments')
      ]);

      setStats(statsRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(apptsRes.data);
    } catch (error) {
      console.error('Fetch admin data error:', error);
      showToast('Error retrieving administrator data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch = 
      appt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.appointment_id.toString().includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- DOCTOR MODAL HANDLERS ---
  const handleOpenAddDoctor = () => {
    setEditingDoctorId(null);
    setDoctorForm({
      name: '',
      specialization: '',
      experience: 5,
      available_days: 'Monday, Wednesday, Friday',
      available_time: '09:00 AM - 01:00 PM',
      consultation_fee: '500.00',
      bio: '',
      email: '',
      password: ''
    });
    setDoctorSelectedDays(['Monday', 'Wednesday', 'Friday']);
    setDoctorFormErrors({});
    setShowDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctorId(doc.doctor_id);
    setDoctorForm({
      name: doc.name || '',
      specialization: doc.specialization || '',
      experience: doc.experience || 0,
      available_days: doc.available_days || '',
      available_time: doc.available_time || '',
      consultation_fee: doc.consultation_fee || '500.00',
      bio: doc.bio || '',
      email: doc.email || '',
      password: '' // Optional on edit
    });
    const daysArr = doc.available_days ? doc.available_days.split(',').map(d => d.trim()) : [];
    setDoctorSelectedDays(daysArr);
    setDoctorFormErrors({});
    setShowDoctorModal(true);
  };

  const handleDayToggle = (day) => {
    let updated;
    if (doctorSelectedDays.includes(day)) {
      updated = doctorSelectedDays.filter((d) => d !== day);
    } else {
      updated = [...doctorSelectedDays, day];
    }
    setDoctorSelectedDays(updated);
    setDoctorForm((prev) => ({ ...prev, available_days: updated.join(', ') }));
    if (doctorFormErrors.available_days) {
      setDoctorFormErrors((prev) => ({ ...prev, available_days: '' }));
    }
  };

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
    if (doctorFormErrors[name]) {
      setDoctorFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate Doctor Modal Form
   */
  const validateDoctorModal = () => {
    const errors = {};

    const nameVal = validateName(doctorForm.name, 'Doctor Name');
    if (!nameVal.isValid) errors.name = nameVal.error;

    const emailVal = validateEmail(doctorForm.email, 'Doctor Email');
    if (!emailVal.isValid) errors.email = emailVal.error;

    if (!editingDoctorId) {
      const passVal = validatePassword(doctorForm.password, true);
      if (!passVal.isValid) errors.password = passVal.error;
    }

    if (!doctorForm.specialization.trim()) {
      errors.specialization = 'Specialization is required.';
    }

    const exp = parseInt(doctorForm.experience, 10);
    if (isNaN(exp) || exp < 0 || exp > 60) {
      errors.experience = 'Experience must be between 0 and 60 years.';
    }

    if (doctorSelectedDays.length === 0) {
      errors.available_days = 'At least one practicing day must be selected.';
    }

    if (!doctorForm.available_time.trim()) {
      errors.available_time = 'Visiting hours are required (e.g. 09:00 AM - 01:00 PM).';
    }

    const fee = parseFloat(doctorForm.consultation_fee);
    if (isNaN(fee) || fee <= 0) {
      errors.consultation_fee = 'Consultation fee must be greater than ₹0.';
    }

    setDoctorFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!validateDoctorModal()) {
      showToast('Please fix the validation errors in the form.', 'warning');
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        ...doctorForm,
        available_days: doctorSelectedDays.join(', '),
        experience: parseInt(doctorForm.experience, 10),
        consultation_fee: parseFloat(doctorForm.consultation_fee)
      };

      if (editingDoctorId) {
        await api.put(`/api/admin/doctors/${editingDoctorId}`, payload);
        showToast('Clinician details updated successfully!', 'success');
      } else {
        await api.post('/api/admin/doctors', payload);
        showToast('New clinician added to hospital directory!', 'success');
      }

      setShowDoctorModal(false);
      fetchData();
    } catch (error) {
      console.error('Save doctor error:', error);
      const errMsg = error.response?.data?.message || 'Failed to save doctor details.';
      showToast(errMsg, 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the medical staff? All their appointments will be removed.`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/doctors/${id}`);
      showToast('Doctor record removed successfully.', 'info');
      fetchData();
    } catch (error) {
      console.error('Delete doctor error:', error);
      showToast('Failed to delete doctor record.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading hospital administration console..." />;
  }

  return (
    <div className="page-container container-fluid px-lg-5 animated-fade-in">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-white px-3 py-1.5 rounded-pill mb-2">
            <FaUserShield /> Hospital Administration Center
          </span>
          <h2 className="fw-bold text-dark mb-0">Clinic Operations & Directory Oversight</h2>
        </div>
        <button
          className="btn btn-primary-custom d-flex align-items-center gap-2"
          onClick={handleOpenAddDoctor}
        >
          <FaPlus /> Onboard New Clinician
        </button>
      </div>

      {/* KPI Statistics Cards */}
      {stats && (
        <div className="row g-3 mb-5">
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card glass-card p-3 border-0 shadow-sm text-center">
              <FaUserMd className="text-primary fs-3 mx-auto mb-1" />
              <h3 className="fw-bold text-dark mb-0">{stats.totalDoctors}</h3>
              <small className="text-muted fw-semibold">Active Doctors</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card glass-card p-3 border-0 shadow-sm text-center">
              <FaUsers className="text-info fs-3 mx-auto mb-1" />
              <h3 className="fw-bold text-dark mb-0">{stats.totalPatients}</h3>
              <small className="text-muted fw-semibold">Registered Patients</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card glass-card p-3 border-0 shadow-sm text-center">
              <FaCalendarCheck className="text-secondary fs-3 mx-auto mb-1" />
              <h3 className="fw-bold text-dark mb-0">{stats.totalAppointments}</h3>
              <small className="text-muted fw-semibold">Total Bookings</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card glass-card p-3 border-0 shadow-sm text-center">
              <FaCalendarDay className="text-warning fs-3 mx-auto mb-1" />
              <h3 className="fw-bold text-dark mb-0">{stats.todayAppointments}</h3>
              <small className="text-muted fw-semibold">Today's Consultations</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card glass-card p-3 border-0 shadow-sm text-center" style={{ borderLeft: '4px solid #10b981 !important' }}>
              <FaRupeeSign className="text-success fs-3 mx-auto mb-1" />
              <h3 className="fw-bold text-success mb-0">₹{stats.totalRevenue.toLocaleString()}</h3>
              <small className="text-muted fw-semibold">Total Revenue Collected</small>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom pb-2">
        <button
          className={`btn btn-sm px-4 py-2 rounded-pill fw-bold transition ${
            activeTab === 'doctors' ? 'btn-primary-custom text-white' : 'btn-light border text-muted'
          }`}
          onClick={() => setActiveTab('doctors')}
        >
          Doctors Directory ({doctors.length})
        </button>
        <button
          className={`btn btn-sm px-4 py-2 rounded-pill fw-bold transition ${
            activeTab === 'appointments' ? 'btn-primary-custom text-white' : 'btn-light border text-muted'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          All Hospital Appointments ({appointments.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* -------------------- TAB 1: DOCTORS DIRECTORY --------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="card glass-card border-0 shadow-sm p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Clinician</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Consultation Fee</th>
                  <th>Practicing Days</th>
                  <th>Visiting Hours</th>
                  <th>Bookings</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {doctors.map((doc) => (
                  <tr key={doc.doctor_id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg" style={{ width: '38px', height: '38px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="d-block text-dark">{doc.name}</strong>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{doc.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary-light text-primary px-2.5 py-1 rounded-pill">{doc.specialization}</span>
                    </td>
                    <td>{doc.experience} Years</td>
                    <td className="fw-bold text-success">₹{parseFloat(doc.consultation_fee || 500).toFixed(2)}</td>
                    <td style={{ maxWidth: '180px' }} className="text-truncate" title={doc.available_days}>
                      {doc.available_days}
                    </td>
                    <td>{doc.available_time}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{doc.total_consultations || 0} visits</span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-secondary btn-sm me-1"
                        onClick={() => handleOpenEditDoctor(doc)}
                        title="Edit Doctor Profile"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteDoctor(doc.doctor_id, doc.name)}
                        title="Remove Doctor"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- TAB 2: ALL APPOINTMENTS ---------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="card glass-card border-0 shadow-sm p-4">
          {/* Search & Status Filter */}
          <div className="row g-2 mb-4">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by patient name, doctor, symptoms, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-6 d-flex gap-2 justify-content-md-end overflow-auto pb-2 pb-md-0">
              {['All', 'Pending', 'Accepted', 'Completed', 'Cancelled', 'Rejected'].map((status) => (
                <button
                  key={status}
                  className={`btn btn-sm rounded-pill px-3 transition ${
                    statusFilter === status ? 'btn-primary-custom text-white' : 'btn-light border text-muted'
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>ID</th>
                  <th>Patient Details</th>
                  <th>Doctor & Specialty</th>
                  <th>Date & Time</th>
                  <th>Reason / Symptoms</th>
                  <th>Status</th>
                  <th>Cancellation Note</th>
                </tr>
              </thead>
              <tbody className="small">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No appointments found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr key={appt.appointment_id}>
                      <td className="fw-bold">#{appt.appointment_id}</td>
                      <td>
                        <strong className="text-dark d-block">{appt.patient_name}</strong>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {appt.patient_gender}, {appt.patient_age} yrs • {appt.patient_phone}
                        </span>
                      </td>
                      <td>
                        <strong className="text-dark d-block">{appt.doctor_name}</strong>
                        <span className="text-primary small">{appt.doctor_specialization}</span>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{appt.appointment_date.split('T')[0]}</div>
                        <span className="text-muted small">{appt.appointment_time}</span>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        <span className="text-truncate d-block" title={appt.symptoms}>
                          {appt.symptoms}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status status-${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        {appt.cancellation_reason ? (
                          <span className="small text-danger">{appt.cancellation_reason}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- ADD / EDIT DOCTOR MODAL ---------------------------- */}
      {/* ========================================================================= */}
      {showDoctorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <FaUserMd className="text-primary" />
                  {editingDoctorId ? 'Edit Clinician Details' : 'Onboard New Clinician'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDoctorModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <form onSubmit={handleSaveDoctor} noValidate>
                  <div className="row g-3">
                    {/* Doctor Name */}
                    <div className="col-md-6 col-12">
                      <label className="form-label small fw-bold text-muted">Clinician Full Name</label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control custom-input border-2 ${doctorFormErrors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Dr. Jennifer Adams"
                        value={doctorForm.name}
                        onChange={handleDoctorFormChange}
                      />
                      {doctorFormErrors.name && <div className="invalid-feedback">{doctorFormErrors.name}</div>}
                    </div>

                    {/* Email */}
                    <div className="col-md-6 col-12">
                      <label className="form-label small fw-bold text-muted">Clinician Email</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control custom-input border-2 ${doctorFormErrors.email ? 'is-invalid' : ''}`}
                        placeholder="jennifer@hospital.com"
                        value={doctorForm.email}
                        onChange={handleDoctorFormChange}
                      />
                      {doctorFormErrors.email && <div className="invalid-feedback">{doctorFormErrors.email}</div>}
                    </div>

                    {/* Password (Required on Add, Optional on Edit) */}
                    {!editingDoctorId && (
                      <div className="col-md-6 col-12">
                        <label className="form-label small fw-bold text-muted">Initial Password (Min 8 Chars, Strong)</label>
                        <input
                          type="password"
                          name="password"
                          className={`form-control custom-input border-2 ${doctorFormErrors.password ? 'is-invalid' : ''}`}
                          placeholder="••••••••"
                          value={doctorForm.password}
                          onChange={handleDoctorFormChange}
                        />
                        {doctorFormErrors.password && <div className="invalid-feedback">{doctorFormErrors.password}</div>}
                      </div>
                    )}

                    {/* Specialization */}
                    <div className={`col-md-${editingDoctorId ? '6' : '6'} col-12`}>
                      <label className="form-label small fw-bold text-muted">Medical Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        list="specializationOptions"
                        className={`form-control custom-input border-2 ${doctorFormErrors.specialization ? 'is-invalid' : ''}`}
                        placeholder="e.g. Neurologist, Cardiologist"
                        value={doctorForm.specialization}
                        onChange={handleDoctorFormChange}
                      />
                      <datalist id="specializationOptions">
                        {Array.from(new Set(doctors.map(d => d.specialization))).filter(Boolean).map(spec => (
                          <option key={spec} value={spec} />
                        ))}
                      </datalist>
                      {doctorFormErrors.specialization && <div className="invalid-feedback">{doctorFormErrors.specialization}</div>}
                    </div>

                    {/* Experience */}
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-bold text-muted">Experience (Years)</label>
                      <input
                        type="number"
                        name="experience"
                        min="0"
                        max="60"
                        className={`form-control custom-input border-2 ${doctorFormErrors.experience ? 'is-invalid' : ''}`}
                        value={doctorForm.experience}
                        onChange={handleDoctorFormChange}
                      />
                      {doctorFormErrors.experience && <div className="invalid-feedback">{doctorFormErrors.experience}</div>}
                    </div>

                    {/* Consultation Fee */}
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-bold text-muted">Fee (₹)</label>
                      <input
                        type="number"
                        name="consultation_fee"
                        className={`form-control custom-input border-2 ${doctorFormErrors.consultation_fee ? 'is-invalid' : ''}`}
                        value={doctorForm.consultation_fee}
                        onChange={handleDoctorFormChange}
                      />
                      {doctorFormErrors.consultation_fee && <div className="invalid-feedback">{doctorFormErrors.consultation_fee}</div>}
                    </div>

                    {/* Available Days Checkboxes */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted d-block">Practicing Days</label>
                      <div className="d-flex flex-wrap gap-2">
                        {ALL_DAYS.map((day) => {
                          const isChecked = doctorSelectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`btn btn-sm px-3 py-1.5 rounded-pill transition ${
                                isChecked ? 'btn-primary-custom text-white' : 'btn-outline-secondary bg-light'
                              }`}
                              onClick={() => handleDayToggle(day)}
                            >
                              {isChecked ? '✓ ' : '+ '} {day}
                            </button>
                          );
                        })}
                      </div>
                      {doctorFormErrors.available_days && (
                        <div className="text-danger small mt-1">{doctorFormErrors.available_days}</div>
                      )}
                    </div>

                    {/* Visiting Hours */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Visiting Hours</label>
                      <input
                        type="text"
                        name="available_time"
                        className={`form-control custom-input border-2 ${doctorFormErrors.available_time ? 'is-invalid' : ''}`}
                        placeholder="09:00 AM - 01:00 PM"
                        value={doctorForm.available_time}
                        onChange={handleDoctorFormChange}
                      />
                      {doctorFormErrors.available_time && <div className="invalid-feedback">{doctorFormErrors.available_time}</div>}
                    </div>

                    {/* Bio */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Clinician Bio / Profile Summary</label>
                      <textarea
                        name="bio"
                        rows="2"
                        className="form-control custom-input border-2"
                        placeholder="Board certifications, clinical memberships, awards..."
                        value={doctorForm.bio}
                        onChange={handleDoctorFormChange}
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-4 pb-0 px-0">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setShowDoctorModal(false)}
                      disabled={modalSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary-custom px-4"
                      disabled={modalSubmitting}
                    >
                      {modalSubmitting ? 'Saving...' : editingDoctorId ? 'Save Changes' : 'Onboard Doctor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

