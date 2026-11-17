/**
 * ============================================================================
 * FULL-FLEDGED HOSPITAL FOOTER & LEGAL MODULE (Footer.jsx)
 * ============================================================================
 * 
 * FEATURES & CLINICAL COMPLIANCE:
 * 1. Hospital Accreditation Badges (Govt Reg, NABH, ISO 9001:2015, DISHA/HIPAA).
 * 2. 24x7 Emergency & Critical Care Hotline (Dial 108 / Ambulance dispatch).
 * 3. Interactive Modals with Complete Legal Terms:
 *    - Privacy Policy (EHR Confidentiality & Data Protection).
 *    - Terms of Service & Appointment Cancellation Policies.
 *    - Patient Rights & Responsibilities.
 * 4. Clinical Emergency Disclaimer.
 * 5. Complete copyright statement and accreditation details.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHeartbeat, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, 
  FaShieldAlt, FaAmbulance, FaClock, FaCertificate, 
  FaFileContract, FaUserShield, FaTimes, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

const Footer = () => {
  // Modal state management
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | 'rights' | null

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="bg-dark text-light py-5 mt-auto border-top border-secondary">
        <div className="container">
          {/* Top Row: Emergency Alert Banner */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="p-3 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3" 
                   style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger text-white p-2.5 rounded-circle fs-4 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <FaAmbulance />
                  </div>
                  <div>
                    <h6 className="text-white fw-bold mb-0">24x7 Emergency & Critical Trauma Care</h6>
                    <small className="text-light opacity-75">
                      For immediate life-threatening emergencies, call our dedicated ambulance hotline or dial national medical response.
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a href="tel:108" className="btn btn-danger btn-sm px-3 py-2 fw-bold text-nowrap d-flex align-items-center gap-2 shadow-sm">
                    <FaPhoneAlt /> Call Ambulance: 108
                  </a>
                  <a href="tel:+918022009999" className="btn btn-outline-light btn-sm px-3 py-2 text-nowrap">
                    Hospital ER: +91 80 2200 9999
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Footer Columns */}
          <div className="row g-4 justify-content-between">
            {/* Col 1: Hospital Overview & Accreditations */}
            <div className="col-lg-4 col-md-6">
              <h5 className="text-white d-flex align-items-center gap-2 mb-3 fw-bold fs-4">
                <FaHeartbeat style={{ color: '#00a896' }} />
                CareSync Healthcare
              </h5>
              <p className="text-light opacity-75 small mb-3">
                CareSync is a premier multi-specialty healthcare institution delivering world-class medical consultation, outpatient care, and digitized health record management.
              </p>
              
              {/* Accreditations Badge Box */}
              <div className="p-2.5 rounded bg-black bg-opacity-40 border border-secondary border-opacity-50 small mb-2">
                <div className="d-flex align-items-center gap-2 text-success mb-1 fw-semibold">
                  <FaCertificate /> NABH & ISO 9001:2015 Certified
                </div>
                <p className="text-light opacity-50 mb-0" style={{ fontSize: '0.75rem' }}>
                  Govt Health Department Reg. No: <strong>KA-BLR-HOSP-2024-9982</strong><br />
                  Fully compliant with DISHA & National Digital Health Mission (ABDM).
                </p>
              </div>
            </div>
            
            {/* Col 2: Quick Links */}
            <div className="col-lg-2 col-md-6">
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <FaFileContract className="text-secondary" /> Portal Links
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><Link to="/" className="text-light opacity-75 text-decoration-none hover-link">Home Directory</Link></li>
                <li><Link to="/login" className="text-light opacity-75 text-decoration-none hover-link">Patient Portal</Link></li>
                <li><Link to="/register" className="text-light opacity-75 text-decoration-none hover-link">New Patient Registration</Link></li>
                <li><Link to="/doctor/login" className="text-light opacity-75 text-decoration-none hover-link">Doctor Workstation</Link></li>
                <li><Link to="/admin/login" className="text-light opacity-75 text-decoration-none hover-link">Hospital Administration</Link></li>
              </ul>
            </div>

            {/* Col 3: OPD & Clinic Working Hours */}
            <div className="col-lg-3 col-md-6">
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <FaClock className="text-secondary" /> Clinic Timings
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 text-light opacity-75 mb-0">
                <li className="d-flex justify-content-between">
                  <span>General Outpatient (OPD):</span>
                  <strong className="text-white">8:00 AM - 9:00 PM</strong>
                </li>
                <li className="d-flex justify-content-between">
                  <span>Specialist Consultations:</span>
                  <strong className="text-white">9:00 AM - 7:00 PM</strong>
                </li>
                <li className="d-flex justify-content-between">
                  <span>Diagnostics & Pharmacy:</span>
                  <strong className="text-white">Open 24 Hours</strong>
                </li>
                <li className="d-flex justify-content-between">
                  <span>Emergency Trauma Unit:</span>
                  <strong className="text-danger fw-bold">24x7 Operational</strong>
                </li>
              </ul>
            </div>
            
            {/* Col 4: Hospital Contact Information */}
            <div className="col-lg-3 col-md-6">
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <FaMapMarkerAlt className="text-secondary" /> Campus Address
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2.5 text-light opacity-75 mb-0">
                <li className="d-flex align-items-start gap-2">
                  <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                  <span>CareSync Medical Campus, #42 Healthcare Boulevard, Outer Ring Road, Bangalore, Karnataka 560103, India</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <FaPhoneAlt className="text-primary flex-shrink-0" />
                  <span>Appointments: +91 98765 43210</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <FaEnvelope className="text-primary flex-shrink-0" />
                  <span>helpdesk@caresynchospital.org</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Clinical Disclaimer Row */}
          <div className="mt-4 pt-3 border-top border-secondary border-opacity-50">
            <div className="d-flex align-items-start gap-2 text-light opacity-50 small" style={{ fontSize: '0.78rem' }}>
              <FaExclamationTriangle className="text-warning flex-shrink-0 mt-0.5" />
              <span>
                <strong>Clinical & Medical Disclaimer:</strong> The information, appointment scheduling, and electronic prescriptions accessible on CareSync are for verified clinical consultations with licensed healthcare practitioners. In the event of acute emergencies, severe trauma, sudden chest pain, or respiratory distress, do not wait for an online appointment—immediately visit the nearest hospital emergency room or dial 108.
              </span>
            </div>
          </div>

          <hr className="my-3 border-secondary" />

          {/* Bottom Bar: Copyright & Interactive Legal Modals */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-light opacity-75">
            <span>
              &copy; {new Date().getFullYear()} CareSync Healthcare Systems Ltd. All Rights Reserved. Reg. #KA-BLR-HOSP-2024-9982.
            </span>
            <div className="d-flex align-items-center gap-3">
              <button 
                type="button" 
                className="btn btn-link p-0 text-light opacity-75 text-decoration-none hover-link small"
                onClick={() => setActiveModal('privacy')}
              >
                Privacy & Health Data Policy
              </button>
              <span>•</span>
              <button 
                type="button" 
                className="btn btn-link p-0 text-light opacity-75 text-decoration-none hover-link small"
                onClick={() => setActiveModal('terms')}
              >
                Terms of Service & Cancellation
              </button>
              <span>•</span>
              <button 
                type="button" 
                className="btn btn-link p-0 text-light opacity-75 text-decoration-none hover-link small"
                onClick={() => setActiveModal('rights')}
              >
                Patient Charter
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 1. PRIVACY & HEALTH DATA POLICY MODAL                                     */}
      {/* ========================================================================= */}
      {activeModal === 'privacy' && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaShieldAlt /> Patient Privacy & Medical Data Protection Policy
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <FaCheckCircle className="flex-shrink-0" />
                  <span>CareSync complies with India's Digital Information Security in Healthcare Act (DISHA) and international HIPAA medical encryption protocols.</span>
                </div>

                <h6 className="fw-bold text-dark">1. Collection of Health & Personal Data</h6>
                <p className="text-muted small">
                  We gather personal identifiers (name, email, phone number, date of birth, emergency contact) and clinical information (medical history, symptoms, doctor prescriptions, diagnosis) solely to facilitate doctor consultations, ensure patient safety, and generate valid medical records.
                </p>

                <h6 className="fw-bold text-dark">2. Confidentiality & Electronic Health Records (EHR)</h6>
                <p className="text-muted small">
                  Your medical data is strictly restricted to you and your attending doctors. Prescriptions, clinical observations, and appointment histories are stored with 256-bit AES encryption at rest and TLS 1.3 in transit. We will never sell, rent, or lease patient health records to third-party marketing entities or insurers without your explicit prior written consent.
                </p>

                <h6 className="fw-bold text-dark">3. Patient Access and Re-Editing Rights</h6>
                <p className="text-muted small">
                  Patients maintain the right to view, download, update, and re-edit their personal profile and emergency contact information at any time directly through their secure patient dashboard.
                </p>

                <h6 className="fw-bold text-dark">4. Security & Hospital Access Governance</h6>
                <p className="text-muted small">
                  All administrative access to hospital infrastructure requires verified role-based access control (RBAC). Doctor accounts are authenticated, and prescription issuance is digitally signed and audited.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm px-4" onClick={closeModal}>
                  Close Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TERMS OF SERVICE & APPOINTMENT CANCELLATION MODAL                      */}
      {/* ========================================================================= */}
      {activeModal === 'terms' && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaFileContract /> Terms of Service & Appointment Guidelines
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <h6 className="fw-bold text-dark">1. Appointment Booking & Consultation Time Slots</h6>
                <p className="text-muted small">
                  Appointment slots are scheduled in 30-minute intervals according to each physician's verified practicing schedule. Patients are requested to check in or log in 10 minutes prior to their designated appointment slot.
                </p>

                <h6 className="fw-bold text-dark">2. Cancellation & Rescheduling Policy</h6>
                <ul className="text-muted small ps-3">
                  <li>Patients may reschedule or cancel their upcoming appointment through the "My Consultations" portal up to <strong>2 hours</strong> before the scheduled slot without penalty.</li>
                  <li>When cancelling, providing a legitimate clinical or personal reason is required to notify the physician and release the slot for other patients.</li>
                  <li>In rare circumstances where a doctor is called for emergency surgery, the hospital will immediately notify the patient and offer prioritized rescheduling.</li>
                </ul>

                <h6 className="fw-bold text-dark">3. Consultation Fees & Payment Policies</h6>
                <p className="text-muted small">
                  Consultation fees are established transparently by each specialist. Payment can be fulfilled via supported digital payment gateways or settled at the hospital billing desk prior to consultation.
                </p>

                <h6 className="fw-bold text-dark">4. Code of Conduct & Teleconsultation Etiquette</h6>
                <p className="text-muted small">
                  Patients and clinical staff agree to maintain mutual professional courtesy and respect. Any abusive behavior, fraudulent information, or unauthorized impersonation will result in immediate suspension of account privileges and referral to civil authorities.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm px-4" onClick={closeModal}>
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PATIENT CHARTER & RIGHTS MODAL                                         */}
      {/* ========================================================================= */}
      {activeModal === 'rights' && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <FaUserShield /> Patient Rights & Responsibilities Charter
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <h6 className="fw-bold text-dark">As a CareSync Patient, you have the right to:</h6>
                <ul className="text-muted small ps-3 mb-3">
                  <li>Receive compassionate, dignified, and non-discriminatory care regardless of background, gender, or creed.</li>
                  <li>Clear, understandable information regarding your diagnosis, proposed treatment alternatives, risks, and prognosis.</li>
                  <li>Complete privacy during clinical examinations and medical record confidentiality.</li>
                  <li>A formal printable prescription bearing the doctor's registration number and transparent itemized billing.</li>
                  <li>A second medical opinion from any specialist across our hospital network.</li>
                </ul>

                <h6 className="fw-bold text-dark">Patient Responsibilities:</h6>
                <ul className="text-muted small ps-3">
                  <li>Provide accurate, up-to-date personal medical history, drug allergies, and current medications.</li>
                  <li>Follow the agreed-upon medical treatment plan and report unexpected side effects promptly.</li>
                  <li>Honor scheduled appointment timings or notify cancellation early so others in need may be treated.</li>
                </ul>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary btn-sm px-4" onClick={closeModal}>
                  Close Charter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
