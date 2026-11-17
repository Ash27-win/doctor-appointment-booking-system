/**
 * ============================================================================
 * SPECIALIST CARD COMPONENT (DoctorCard.jsx)
 * ============================================================================
 * 
 * VALIDATION & DISPLAY INSTRUCTIONS:
 * - Dynamically renders clinician avatar, credentials, experience, practicing days,
 *   visiting hours, and consultation fee.
 * - Protects booking click action for patient access.
 */

import React from 'react';
import { FaCalendarAlt, FaClock, FaMedal, FaRupeeSign, FaCheckCircle } from 'react-icons/fa';

const DoctorCard = ({ doctor, onBookClick }) => {
  const getDoctorInitials = (name) => {
    return name ? name.replace('Dr. ', '').substring(0, 2).toUpperCase() : 'DR';
  };

  const formattedFee = parseFloat(doctor.consultation_fee || 500).toFixed(2);

  return (
    <div className="card glass-card h-100 animated-fade-in shadow-sm border-0 d-flex flex-column">
      <div className="doctor-photo-wrapper position-relative">
        <div className="doctor-specialty-badge">{doctor.specialization}</div>
        <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center gradient-bg-light py-4">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg mb-2 shadow-sm" style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold' }}>
            {getDoctorInitials(doctor.name)}
          </div>
          <span className="badge bg-white text-primary border border-primary-light fw-bold px-3 py-1 shadow-xs">
            <FaCheckCircle className="me-1" /> Verified Specialist
          </span>
        </div>
      </div>
      
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title fw-bold text-dark mb-0">{doctor.name}</h5>
          <span className="badge bg-success-subtle text-success fw-bold px-2.5 py-1 rounded-pill small">
            ₹{formattedFee}
          </span>
        </div>

        <p className="text-muted small mb-3 d-flex align-items-center gap-2">
          <FaMedal className="text-primary" /> {doctor.experience} Years Clinical Experience
        </p>

        {doctor.bio && (
          <p className="text-muted small mb-3 text-truncate-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {doctor.bio}
          </p>
        )}
        
        <div className="mt-auto border-top pt-3">
          <div className="d-flex align-items-start gap-2 mb-2 text-secondary-dark">
            <FaCalendarAlt className="text-primary mt-1" style={{ flexShrink: 0 }} />
            <div>
              <span className="d-block fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Practicing Days</span>
              <span className="small text-dark fw-medium">{doctor.available_days}</span>
            </div>
          </div>

          <div className="d-flex align-items-start gap-2 mb-4 text-secondary-dark">
            <FaClock className="text-primary mt-1" style={{ flexShrink: 0 }} />
            <div>
              <span className="d-block fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Visiting Hours</span>
              <span className="small text-dark fw-medium">{doctor.available_time}</span>
            </div>
          </div>

          <button 
            onClick={() => onBookClick(doctor)}
            className="btn btn-primary-custom w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
          >
            Book Consultation
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
