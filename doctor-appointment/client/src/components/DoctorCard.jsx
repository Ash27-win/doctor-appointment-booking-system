import React from 'react';
import { FaCalendarAlt, FaClock, FaMedal } from 'react-icons/fa';

const DoctorCard = ({ doctor, onBookClick }) => {
  
  const defaultDoctorAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" fill="%23e0f2fe"/>
    <circle cx="100" cy="80" r="40" fill="%230284c7"/>
    <path d="M40 180C40 140 65 130 100 130C135 130 160 140 160 180H40Z" fill="%230369a1"/>
    <rect x="95" y="145" width="10" height="35" fill="%23ffffff"/>
    <rect x="82" y="158" width="36" height="10" fill="%23ffffff"/>
  </svg>`;

  const getDoctorInitials = (name) => {
    return name ? name.replace('Dr. ', '').substring(0, 2).toUpperCase() : 'DR';
  };

  return (
    <div className="card glass-card h-100 animated-fade-in">
      <div className="doctor-photo-wrapper">
        <div className="doctor-specialty-badge">{doctor.specialization}</div>
        {/* Render a placeholder avatar but customize with initials to look like an profile */}
        <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center gradient-bg-light">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white gradient-bg mb-2" style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}>
            {getDoctorInitials(doctor.name)}
          </div>
          <span className="badge bg-white text-primary border border-primary-light fw-bold px-3 py-1">Verified Expert</span>
        </div>
      </div>
      
      <div className="card-body d-flex flex-column p-4">
        <h5 className="card-title fw-bold text-dark mb-1">{doctor.name}</h5>
        <p className="text-muted small mb-3 d-flex align-items-center gap-2">
          <FaMedal className="text-primary" /> {doctor.experience} Years Experience
        </p>
        
        <div className="mt-auto border-top pt-3">
          <div className="d-flex align-items-start gap-2 mb-2 text-secondary-dark">
            <FaCalendarAlt className="text-primary mt-1" style={{ flexShrink: 0 }} />
            <div>
              <span className="d-block fw-bold text-uppercase" style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Available Days</span>
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
            className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
