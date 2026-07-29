import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaCalendarCheck, FaUserCircle, FaBriefcaseMedical, FaCalendarDay, FaClipboardList, FaCheck, FaTimes, FaThumbsUp } from 'react-icons/fa';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useToast();

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/doctor/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Fetch doctor appointments error:', error);
      showToast('Failed to load dashboard appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/appointments/${id}/status`, { status: newStatus });
      showToast(`Appointment marked as ${newStatus}!`, 'success');
      
      // Local state update
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.appointment_id === id ? { ...appt, status: newStatus } : appt
        )
      );
    } catch (error) {
      console.error('Update status error:', error);
      const errMsg = error.response?.data?.message || 'Failed to update appointment status.';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  // Calculations for Stats
  const todayStr = getTodayDateString();
  const totalCount = appointments.length;

  const todayCount = appointments.filter((appt) => {
    // Standardize DB date string to YYYY-MM-DD
    const apptDate = appt.appointment_date.split('T')[0];
    return apptDate === todayStr;
  }).length;

  const upcomingCount = appointments.filter((appt) => {
    const apptDate = appt.appointment_date.split('T')[0];
    return apptDate > todayStr && appt.status !== 'Completed' && appt.status !== 'Rejected';
  }).length;

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container py-5 animated-fade-in" style={{ paddingTop: '8rem', minHeight: '80vh' }}>
      
      {/* Dashboard Title */}
      <div className="mb-4 pb-3 border-bottom">
        <h2 className="fw-bold text-dark mb-1">Clinician Dashboard</h2>
        <p className="text-muted small mb-0">Overview of patient consultations and calendar bookings</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading dashboard statistics..." />
      ) : (
        <>
          {/* KPI Dashboard Cards */}
          <div className="row g-4 mb-5">
            <div className="col-12 col-md-4">
              <div className="stat-card shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.75rem' }}>Total Consults</span>
                    <h2 className="fw-bold mb-0 text-dark">{totalCount}</h2>
                  </div>
                  <div className="fs-1 text-primary-light bg-primary-light rounded-3 p-2 text-primary" style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaClipboardList />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="stat-card today shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.75rem' }}>Today's Appointments</span>
                    <h2 className="fw-bold mb-0 text-dark">{todayCount}</h2>
                  </div>
                  <div className="fs-1 text-white rounded-3 p-2 text-secondary" style={{ background: 'rgba(0, 168, 150, 0.1)', color: 'var(--color-secondary) !important', minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaCalendarDay />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="stat-card upcoming shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.75rem' }}>Upcoming Wards</span>
                    <h2 className="fw-bold mb-0 text-dark">{upcomingCount}</h2>
                  </div>
                  <div className="fs-1 text-primary-light bg-primary-light rounded-3 p-2 text-primary animate-pulse" style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accepted) !important', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <FaCalendarCheck />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Management Panel */}
          <div className="card glass-card border-0 shadow-sm p-4">
            <h4 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
              <FaBriefcaseMedical className="text-secondary" style={{ color: 'var(--color-secondary)' }} /> Scheduled Patient List
            </h4>

            {appointments.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaClipboardList className="display-4 mb-3" />
                <h5>No appointments booked on your schedule.</h5>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Patient Info</th>
                      <th scope="col" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Contact</th>
                      <th scope="col" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Slot Date & Time</th>
                      <th scope="col" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Symptoms</th>
                      <th scope="col" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                      <th scope="col" className="text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase', minWidth: '180px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.appointment_id}>
                        {/* Patient Basic Details */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaUserCircle className="text-muted fs-4" />
                            <div>
                              <strong className="d-block text-dark small">{appt.patient_name}</strong>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{appt.patient_gender}, {appt.patient_age} yrs</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact details */}
                        <td>
                          <span className="d-block small text-dark fw-medium">{appt.patient_phone}</span>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{appt.patient_email}</span>
                        </td>

                        {/* Date/Time */}
                        <td>
                          <span className="d-block small text-dark fw-semibold">{formatDate(appt.appointment_date)}</span>
                          <span className="text-primary fw-medium" style={{ fontSize: '0.75rem' }}>{appt.appointment_time}</span>
                        </td>

                        {/* Symptoms */}
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '180px', fontSize: '0.8rem' }} title={appt.symptoms}>
                            {appt.symptoms}
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td>
                          <span className={`badge-status status-${appt.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>
                            {appt.status}
                          </span>
                        </td>

                        {/* Action Operations */}
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            {appt.status === 'Pending' && (
                              <>
                                <button
                                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 py-1"
                                  onClick={() => handleStatusUpdate(appt.appointment_id, 'Accepted')}
                                  disabled={updatingId !== null}
                                >
                                  <FaCheck size={10} /> Accept
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 py-1"
                                  onClick={() => handleStatusUpdate(appt.appointment_id, 'Rejected')}
                                  disabled={updatingId !== null}
                                >
                                  <FaTimes size={10} /> Reject
                                </button>
                              </>
                            )}

                            {appt.status === 'Accepted' && (
                              <button
                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 py-1"
                                onClick={() => handleStatusUpdate(appt.appointment_id, 'Completed')}
                                disabled={updatingId !== null}
                              >
                                <FaThumbsUp size={10} /> Complete
                              </button>
                            )}

                            {(appt.status === 'Completed' || appt.status === 'Rejected') && (
                              <span className="text-muted small italic">No operations</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
