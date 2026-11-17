import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="page-container container d-flex flex-column justify-content-center align-items-center text-center p-4">
      <div className="bg-light p-5 rounded-circle shadow-sm mb-4" style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FaExclamationTriangle className="text-warning" style={{ fontSize: '4.5rem' }} />
      </div>
      <h1 className="display-4 fw-bold text-dark mb-2">404 - Page Not Found</h1>
      <p className="text-muted fs-5 max-width-500 mb-4">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary-custom px-4 py-2 d-flex align-items-center gap-2">
        <FaHome /> Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
