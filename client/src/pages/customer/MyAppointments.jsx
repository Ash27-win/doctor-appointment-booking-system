/**
 * ============================================================================
 * PATIENT APPOINTMENTS MANAGEMENT PORTAL (MyAppointments.jsx)
 * ============================================================================
 * 
 * VALIDATION & LIFECYCLE INSTRUCTIONS:
 * 1. Categorization & Filtering:
 *    - Segregates consultations into tabs: All, Upcoming, Completed, Cancelled.
 * 2. Cancellation Workflow & Validation:
 *    - Only allowed for active appointments (status: 'Pending' or 'Accepted').
 *    - Requires mandatory cancellation reason (minimum 5 characters).
 *    - Frees the locked time slot dynamically for other patients.
 * 3. Rescheduling Workflow & Validation:
 *    - Allows moving consultation to a future date.
 *    - Verifies doctor's practicing schedule and checks time-slot conflict.
 * 4. Clinical Document Access:
 *    - View & print medical prescriptions and itemized invoices.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { validateAppointmentDate, validateTimeSlot } from '../../utils/validators';
import { 
  FaCalendarTimes, FaCalendarAlt, FaClock, FaStethoscope, FaHourglassHalf, 
  FaCheckCircle, FaTimesCircle, FaCheckDouble, FaFilePrescription, FaReceipt,
  FaPrint, FaTimes, FaUndo, FaBan, FaCalendarCheck
} from 'react-icons/fa';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
  const { showToast } = useToast();

  // Document Detail Modals
  const [activePrescription, setActivePrescription] = useState(null);
  const [activeBill, setActiveBill] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Cancellation Modal State
  const [cancelTargetAppt, setCancelTargetAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rescheduling Modal State
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleSlotsData, setRescheduleSlotsData] = useState({ loading: false, slots: [], message: '', isWorkingDay: true });
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Print Synchronizer
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('');

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/customer/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching customer appointments:', error);
      showToast('Failed to retrieve your appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Browser printing synchronization
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
        setPrintType('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  // Fetch slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleDate || !rescheduleTargetAppt) return;

    const fetchSlots = async () => {
      setRescheduleSlotsData((prev) => ({ ...prev, loading: true }));
      try {
        const res = await api.get(`/api/doctors/${rescheduleTargetAppt.doctor_id}/available-slots?date=${rescheduleDate}`);
        setRescheduleSlotsData({
          loading: false,
          slots: res.data.slots || [],
          message: res.data.message || '',
          isWorkingDay: res.data.isWorkingDay
        });
        setRescheduleSlot('');
      } catch (err) {
        console.error('Error fetching reschedule slots:', err);
        setRescheduleSlotsData({
          loading: false,
          slots: [],
          message: 'Error loading slots for this date.',
          isWorkingDay: false
        });
      }
    };
    fetchSlots();
  }, [rescheduleDate, rescheduleTargetAppt]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FaHourglassHalf />;
      case 'Accepted': return <FaCheckCircle />;
      case 'Completed': return <FaCheckDouble />;
      case 'Rejected':
      case 'Cancelled': return <FaTimesCircle />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Filter Appointments by Active Tab
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'upcoming') return ['Pending', 'Accepted'].includes(appt.status);
    if (activeTab === 'completed') return appt.status === 'Completed';
    if (activeTab === 'cancelled') return ['Cancelled', 'Rejected'].includes(appt.status);
    return true;
  });

  // --- CANCELLATION LOGIC ---
  const handleOpenCancelModal = (appt) => {
    setCancelTargetAppt(appt);
    setCancelReason('');
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      setCancelError('Please provide a reason for cancellation (min 5 characters).');
      return;
    }

    setCancelLoading(true);
    try {
      await api.put(`/api/appointments/${cancelTargetAppt.appointment_id}/cancel`, {
        cancellation_reason: cancelReason.trim()
      });
      showToast('Appointment cancelled successfully. Slot has been freed.', 'success');
      setCancelTargetAppt(null);
      fetchAppointments();
    } catch (error) {
      console.error('Cancellation error:', error);
      const errMsg = error.response?.data?.message || 'Failed to cancel appointment.';
      showToast(errMsg, 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  // --- RESCHEDULING LOGIC ---
  const handleOpenRescheduleModal = (appt) => {
    setRescheduleTargetAppt(appt);
    setRescheduleDate('');
    setRescheduleSlot('');
    setRescheduleError('');
    setRescheduleSlotsData({ loading: false, slots: [], message: '', isWorkingDay: true });
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate) {
      setRescheduleError('Please select a new appointment date.');
      return;
    }
    if (!rescheduleSlot) {
      setRescheduleError('Please select a new time slot.');
      return;
    }

    setRescheduleLoading(true);
    try {
      await api.put(`/api/appointments/${rescheduleTargetAppt.appointment_id}/reschedule`, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleSlot
      });
      showToast('Appointment rescheduled successfully! Slot reserved.', 'success');
      setRescheduleTargetAppt(null);
      fetchAppointments();
    } catch (error) {
      console.error('Reschedule error:', error);
      const errMsg = error.response?.data?.message || 'Failed to reschedule appointment.';
      showToast(errMsg, 'error');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // --- VIEW PRESCRIPTION & BILL ---
  const handleViewPrescription = async (appt) => {
    setLoadingModal(true);
    try {
      const prescrRes = await api.get(`/api/prescriptions/appointment/${appt.appointment_id}`);
      let tests = [];
      try {
        const testsRes = await api.get(`/api/tests/appointment/${appt.appointment_id}`);
        tests = testsRes.data || [];
      } catch (err) {
        console.error('Error fetching tests for prescription:', err);
      }

      setActivePrescription({
        ...prescrRes.data,
        doctor_name: appt.doctor_name,
        doctor_specialization: appt.doctor_specialization,
        patient_name: appt.patient_name,
        patient_age: appt.patient_age,
        patient_gender: appt.patient_gender,
        patient_phone: appt.patient_phone,
        patient_email: appt.patient_email,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
        tests
      });
    } catch (error) {
      console.error('Error loading prescription:', error);
      showToast('Error loading prescription details.', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleViewBill = async (appt) => {
    setLoadingModal(true);
    try {
      const response = await api.get(`/api/bills/appointment/${appt.appointment_id}`);
      setActiveBill(response.data);
    } catch (error) {
      console.error('Error loading billing details:', error);
      showToast('Error loading invoice details.', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="page-container container animated-fade-in">
      
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom no-print">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Medical Consultations</h2>
          <p className="text-muted small mb-0">Track, reschedule, cancel, or review your clinical records</p>
        </div>
        <Link to="/" className="btn btn-primary-custom btn-sm px-4">
          + Book New Consultation
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="d-flex gap-2 mb-4 no-print overflow-auto pb-2">
        {[
          { key: 'all', label: 'All Consultations' },
          { key: 'upcoming', label: 'Upcoming / Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled / Rejected' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold transition ${
              activeTab === tab.key ? 'btn-primary-custom text-white' : 'btn-light border text-muted'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching your appointments..." />
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4 no-print">
          <FaCalendarTimes className="text-muted display-3 mb-3" />
          <h4 className="fw-bold text-dark mb-2">No Appointments in this tab</h4>
          <p className="text-muted small mx-auto max-width-500 mb-4">
            You don't have any appointments matching the selected filter.
          </p>
          <Link to="/" className="btn btn-primary-custom px-4">
            Browse Doctors & Book Slot
          </Link>
        </div>
      ) : (
        <div className="row g-4 no-print">
          {filteredAppointments.map((appt) => {
            const isCanCancelOrReschedule = ['Pending', 'Accepted'].includes(appt.status);

            return (
              <div key={appt.appointment_id} className="col-12 col-lg-6">
                <div className="card glass-card p-4 border-0 shadow-sm h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg" style={{ width: '50px', height: '50px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {appt.doctor_name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-bold text-dark mb-0">{appt.doctor_name}</h5>
                        <span className="small text-primary fw-medium">{appt.doctor_specialization}</span>
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <span className={`badge-status status-${appt.status.toLowerCase()}`}>
                      {getStatusIcon(appt.status)} {appt.status}
                    </span>
                  </div>

                  <hr className="my-2 text-muted" />

                  <div className="row g-2 text-secondary-dark small mb-3">
                    <div className="col-6">
                      <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>Appointment Date</span>
                      <span className="d-flex align-items-center gap-1 text-dark fw-medium mt-1">
                        <FaCalendarAlt className="text-primary" /> {formatDate(appt.appointment_date)}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>Reserved Time Slot</span>
                      <span className="d-flex align-items-center gap-1 text-dark fw-medium mt-1">
                        <FaClock className="text-primary" /> {appt.appointment_time}
                      </span>
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem' }}>Reason / Symptoms</span>
                    <p className="small mb-0 text-dark italic d-flex align-items-start gap-2">
                      <FaStethoscope className="text-muted mt-1" style={{ flexShrink: 0 }} />
                      <span>{appt.symptoms}</span>
                    </p>
                  </div>

                  {/* Show cancellation reason if available */}
                  {appt.cancellation_reason && (
                    <div className="alert alert-warning py-2 px-3 small mb-3">
                      <strong>Cancellation Note:</strong> {appt.cancellation_reason}
                    </div>
                  )}
                  
                  {/* Patient details */}
                  <div className="d-flex justify-content-between align-items-center text-muted small border-bottom pb-2 mb-3">
                    <span>Patient: <strong className="text-dark">{appt.patient_name}</strong> ({appt.patient_gender}, {appt.patient_age} yrs)</span>
                    <span className="text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>ID: #{appt.appointment_id}</span>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-auto d-flex flex-wrap gap-2 pt-2">
                    {/* View Clinical Documents */}
                    {appt.has_prescription > 0 && (
                      <button 
                        onClick={() => handleViewPrescription(appt)}
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 px-3"
                        disabled={loadingModal}
                      >
                        <FaFilePrescription /> View Prescription
                      </button>
                    )}
                    {appt.has_bill > 0 && (
                      <button 
                        onClick={() => handleViewBill(appt)}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3"
                        disabled={loadingModal}
                      >
                        <FaReceipt /> View Bill
                      </button>
                    )}

                    {/* Reschedule & Cancel Actions (Only for active consultations) */}
                    {isCanCancelOrReschedule && (
                      <>
                        <button
                          onClick={() => handleOpenRescheduleModal(appt)}
                          className="btn btn-outline-info btn-sm d-flex align-items-center gap-1.5 px-3 ms-auto"
                        >
                          <FaUndo /> Reschedule
                        </button>
                        <button
                          onClick={() => handleOpenCancelModal(appt)}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3"
                        >
                          <FaBan /> Cancel
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- CANCELLATION MODAL --------------------------------- */}
      {/* ========================================================================= */}
      {cancelTargetAppt && (
        <div className="modal show d-block no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <FaBan /> Cancel Appointment #{cancelTargetAppt.appointment_id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setCancelTargetAppt(null)}></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-muted small mb-3">
                  Are you sure you want to cancel your consultation with{' '}
                  <strong className="text-dark">{cancelTargetAppt.doctor_name}</strong> on{' '}
                  <strong className="text-dark">{formatDate(cancelTargetAppt.appointment_date)}</strong> at{' '}
                  <strong className="text-dark">{cancelTargetAppt.appointment_time}</strong>?
                </p>
                
                <div className="mb-2">
                  <label className="form-label small fw-bold text-muted">Reason for Cancellation (Min 5 chars)</label>
                  <textarea
                    className={`form-control custom-input border-2 ${cancelError ? 'is-invalid' : ''}`}
                    rows="3"
                    placeholder="e.g. Unforeseen schedule conflict, feeling better, personal emergency..."
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      if (cancelError) setCancelError('');
                    }}
                  ></textarea>
                  {cancelError && <div className="invalid-feedback">{cancelError}</div>}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setCancelTargetAppt(null)}
                  disabled={cancelLoading}
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- RESCHEDULE MODAL ----------------------------------- */}
      {/* ========================================================================= */}
      {rescheduleTargetAppt && (
        <div className="modal show d-block no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                  <FaUndo /> Reschedule Appointment #{rescheduleTargetAppt.appointment_id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setRescheduleTargetAppt(null)}></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-muted small mb-3">
                  Rescheduling consultation with <strong>{rescheduleTargetAppt.doctor_name}</strong>.
                  Practicing days: <strong>{rescheduleTargetAppt.doctor_available_days}</strong>.
                </p>

                <div className="row g-3 mb-3">
                  {/* New Date */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold text-muted">Select New Date</label>
                    <input
                      type="date"
                      className="form-control custom-input border-2"
                      min={getTodayDateString()}
                      value={rescheduleDate}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value);
                        setRescheduleError('');
                      }}
                    />
                  </div>

                  {/* Dynamic Slots for Reschedule */}
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">Select New Time Slot</label>
                    {!rescheduleDate ? (
                      <div className="alert alert-light border small text-muted py-2 mb-0">
                        Pick a new date above to see available consultation slots.
                      </div>
                    ) : rescheduleSlotsData.loading ? (
                      <div className="text-center py-2">
                        <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                        <small className="text-muted">Loading live slots...</small>
                      </div>
                    ) : !rescheduleSlotsData.isWorkingDay ? (
                      <div className="alert alert-warning small py-2 mb-0">
                        {rescheduleSlotsData.message}
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {rescheduleSlotsData.slots.map((slot) => {
                          const isSelected = rescheduleSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.isAvailable}
                              className={`btn btn-sm px-3 py-1.5 rounded-3 ${
                                isSelected
                                  ? 'btn-primary-custom text-white'
                                  : slot.isAvailable
                                  ? 'btn-outline-primary bg-white'
                                  : 'btn-light text-muted border text-decoration-line-through'
                              }`}
                              onClick={() => {
                                setRescheduleSlot(slot.time);
                                setRescheduleError('');
                              }}
                            >
                              {slot.time} {!slot.isAvailable && `(${slot.reason})`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {rescheduleError && (
                  <div className="alert alert-danger py-2 small mb-0">{rescheduleError}</div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setRescheduleTargetAppt(null)}
                  disabled={rescheduleLoading}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary-custom px-4"
                  onClick={handleConfirmReschedule}
                  disabled={rescheduleLoading}
                >
                  {rescheduleLoading ? 'Rescheduling...' : 'Confirm New Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- Prescription Overlay Modal ------------------------- */}
      {/* ========================================================================= */}
      {activePrescription && (
        <div className="modal show d-block no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content glass-card border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                  <FaFilePrescription /> Medical Prescription (Rx)
                </h5>
                <button type="button" className="btn-close" onClick={() => setActivePrescription(null)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <span className="d-block small text-muted text-uppercase fw-bold">Consultant Clinician</span>
                    <strong className="fs-6 text-dark">{activePrescription.doctor_name}</strong>
                    <span className="small text-muted d-block">{activePrescription.doctor_specialization}</span>
                  </div>
                  <div className="col-12 col-md-6 text-md-end">
                    <span className="d-block small text-muted text-uppercase fw-bold">Prescription Date</span>
                    <span className="fs-6 text-dark fw-semibold">{formatDate(activePrescription.prescription_date)}</span>
                  </div>
                </div>

                <div className="bg-light p-3 rounded border mb-4">
                  <span className="d-block small text-muted text-uppercase fw-bold mb-1">Diagnosis</span>
                  <p className="mb-0 text-dark fw-semibold">{activePrescription.diagnosis}</p>
                </div>

                {/* Medicines List */}
                <h6 className="fw-bold mb-2">Prescribed Medicines</h6>
                {(!activePrescription.medicines || activePrescription.medicines.length === 0) ? (
                  <p className="text-muted small italic">No medicines listed in this prescription.</p>
                ) : (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered table-sm align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Medicine Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Timing</th>
                          <th>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePrescription.medicines.map((med, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold">{med.medicine_name}</td>
                            <td>{med.dosage}</td>
                            <td>{med.frequency}</td>
                            <td>{med.duration}</td>
                            <td>{med.timing}</td>
                            <td>{med.instructions || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Additional Clinical Notes */}
                {activePrescription.notes && (
                  <div className="p-3 bg-light rounded border mb-3">
                    <span className="d-block small text-muted text-uppercase fw-bold mb-1">Clinical Notes & Advice</span>
                    <p className="small mb-0 text-dark">{activePrescription.notes}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActivePrescription(null)}>Close</button>
                <button type="button" className="btn btn-primary-custom btn-sm" onClick={() => window.print()}>Print Prescription</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- Bill Overlay Modal --------------------------------- */}
      {/* ========================================================================= */}
      {activeBill && (
        <div className="modal show d-block no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content glass-card border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <FaReceipt className="text-primary" /> Consultation Invoice
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveBill(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                  <span className="text-muted small">Bill ID: #{activeBill.bill_id}</span>
                  <span className="badge bg-success">{activeBill.payment_status}</span>
                </div>

                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Consultation Fee:</span>
                  <span className="fw-semibold">₹{parseFloat(activeBill.consultation_fee).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Medicine Charges:</span>
                  <span className="fw-semibold">₹{parseFloat(activeBill.medicine_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Lab Charges:</span>
                  <span className="fw-semibold">₹{parseFloat(activeBill.lab_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Scan Charges:</span>
                  <span className="fw-semibold">₹{parseFloat(activeBill.scan_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Other Charges:</span>
                  <span className="fw-semibold">₹{parseFloat(activeBill.other_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small text-danger">
                  <span>Discount:</span>
                  <span>- ₹{parseFloat(activeBill.discount).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Tax:</span>
                  <span>+ ₹{parseFloat(activeBill.tax).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom fw-bold fs-6 text-dark mt-2">
                  <span>Grand Total:</span>
                  <span className="text-primary">₹{parseFloat(activeBill.grand_total).toFixed(2)}</span>
                </div>
                <div className="mt-3 text-muted small">
                  <span>Payment Method: <strong>{activeBill.payment_method}</strong></span>
                </div>
              </div>
              <div className="modal-footer bg-light border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveBill(null)}>Close</button>
                <button type="button" className="btn btn-primary-custom btn-sm" onClick={() => window.print()}>Print Receipt</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyAppointments;
