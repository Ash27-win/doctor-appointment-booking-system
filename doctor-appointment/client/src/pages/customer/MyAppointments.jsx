import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaCalendarTimes, FaCalendarAlt, FaClock, FaStethoscope, FaUserMd, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaCheckDouble } from 'react-icons/fa';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FaHourglassHalf />;
      case 'Accepted': return <FaCheckCircle />;
      case 'Completed': return <FaCheckDouble />;
      case 'Rejected': return <FaTimesCircle />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container py-5 animated-fade-in" style={{ paddingTop: '8rem', minHeight: '80vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Appointments</h2>
          <p className="text-muted small mb-0">Track and review your upcoming medical consultations</p>
        </div>
        <Link to="/" className="btn btn-primary-custom btn-sm">
          Book New Consultation
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching your appointments..." />
      ) : appointments.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4">
          <FaCalendarTimes className="text-muted display-3 mb-3" />
          <h4 className="fw-bold text-dark mb-2">No Appointments Found</h4>
          <p className="text-muted small mx-auto max-width-500 mb-4">
            You haven't scheduled any consultations yet. Explore our top medical experts and secure a slot.
          </p>
          <Link to="/" className="btn btn-primary-custom px-4">
            Browse Doctors
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {appointments.map((appt) => (
            <div key={appt.appointment_id} className="col-12 col-lg-6">
              <div className="card glass-card p-4 border-0 shadow-sm h-100">
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

                <hr className="my-3 text-muted" />

                <div className="row g-3 text-secondary-dark small mb-3">
                  <div className="col-6">
                    <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>Appointment Date</span>
                    <span className="d-flex align-items-center gap-1 text-dark fw-medium mt-1">
                      <FaCalendarAlt className="text-primary" /> {formatDate(appt.appointment_date)}
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="d-block fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>Appointment Time</span>
                    <span className="d-flex align-items-center gap-1 text-dark fw-medium mt-1">
                      <FaClock className="text-primary" /> {appt.appointment_time}
                    </span>
                  </div>
                </div>

                <div className="bg-light p-3 rounded-3 border">
                  <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem' }}>Reason / Symptoms</span>
                  <p className="small mb-0 text-dark italic d-flex align-items-start gap-2">
                    <FaStethoscope className="text-muted mt-1" style={{ flexShrink: 0 }} />
                    <span>{appt.symptoms}</span>
                  </p>
                </div>
                
                {/* Patient details (for who this was booked) */}
                <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center text-muted small">
                  <span>Patient: <strong className="text-dark">{appt.patient_name}</strong> ({appt.patient_gender}, {appt.patient_age} yrs)</span>
                  <span className="text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>ID: #{appt.appointment_id}</span>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
