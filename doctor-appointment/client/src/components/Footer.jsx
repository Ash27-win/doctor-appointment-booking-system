import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row g-4 justify-content-between">
          <div className="col-lg-4 col-md-6">
            <h5 className="text-white d-flex align-items-center gap-2 mb-3 fw-bold fs-4">
              <FaHeartbeat className="text-secondary" style={{ color: '#00a896' }} />
              CareSync
            </h5>
            <p className="text-muted small">
              Our hospital is dedicated to offering state-of-the-art medical services. Connect with top doctors and book your slots instantly with our modern online system.
            </p>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/" className="text-muted text-decoration-none hover-link">Home Page</Link></li>
              <li><Link to="/login" className="text-muted text-decoration-none hover-link">Patient Login</Link></li>
              <li><Link to="/register" className="text-muted text-decoration-none hover-link">Patient Registration</Link></li>
              <li><Link to="/doctor/login" className="text-muted text-decoration-none hover-link">Doctor Portal</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-4 col-md-12">
            <h6 className="text-white fw-bold mb-3">Contact Information</h6>
            <ul className="list-unstyled small d-flex flex-column gap-3 text-muted">
              <li className="d-flex align-items-center gap-2">
                <FaPhoneAlt className="text-primary" /> +91 98765 43210
              </li>
              <li className="d-flex align-items-center gap-2">
                <FaEnvelope className="text-primary" /> ashwin@integfarms.com
              </li>
              <li className="d-flex align-items-center gap-2">
                <FaMapMarkerAlt className="text-primary" /> Integfarms Medical Care, Bangalore, Karnataka, India
              </li>
            </ul>
          </div>
        </div>
        <hr className="my-4 border-secondary" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-muted">
          <span>&copy; {new Date().getFullYear()} CareSync Hospital. All rights reserved.</span>
          <div>
            <a href="#" className="text-muted text-decoration-none me-3">Privacy Policy</a>
            <a href="#" className="text-muted text-decoration-none">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
