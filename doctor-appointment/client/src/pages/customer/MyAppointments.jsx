import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  FaCalendarTimes, FaCalendarAlt, FaClock, FaStethoscope, FaHourglassHalf, 
  FaCheckCircle, FaTimesCircle, FaCheckDouble, FaFilePrescription, FaReceipt,
  FaPrint, FaTimes
} from 'react-icons/fa';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modal Detail States
  const [activePrescription, setActivePrescription] = useState(null);
  const [activeBill, setActiveBill] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Print States
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState(''); // 'prescription' or 'bill'

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

  // Print synchronizer
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

  // --- Modal Operations ---
  const handleViewPrescription = async (appt) => {
    setLoadingModal(true);
    try {
      // Fetch prescription and nested medicines
      const prescrRes = await api.get(`/api/prescriptions/appointment/${appt.appointment_id}`);
      
      // Fetch recommended tests
      let tests = [];
      try {
        const testsRes = await api.get(`/api/tests/appointment/${appt.appointment_id}`);
        tests = testsRes.data || [];
      } catch (err) {
        console.error('Error fetching tests for prescription overlay:', err);
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
      console.error('Error loading prescription details:', error);
      showToast('Error loading prescription.', 'error');
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

  // Print Operations
  const handlePrintPrescription = () => {
    if (!activePrescription) return;
    setPrintData({
      doctorName: activePrescription.doctor_name,
      specialization: activePrescription.doctor_specialization,
      patientName: activePrescription.patient_name,
      patientAge: activePrescription.patient_age,
      patientGender: activePrescription.patient_gender,
      patientPhone: activePrescription.patient_phone,
      patientEmail: activePrescription.patient_email,
      apptDate: activePrescription.appointment_date,
      apptTime: activePrescription.appointment_time,
      diagnosis: activePrescription.diagnosis,
      notes: activePrescription.notes,
      prescriptionDate: activePrescription.prescription_date,
      medicines: activePrescription.medicines || [],
      tests: activePrescription.tests || []
    });
    setPrintType('prescription');
  };

  const handlePrintBill = () => {
    if (!activeBill) return;
    setPrintData(activeBill);
    setPrintType('bill');
  };

  return (
    <div className="container py-5 animated-fade-in" style={{ paddingTop: '8rem', minHeight: '80vh' }}>
      
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom no-print">
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
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4 no-print">
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
        <div className="row g-4 no-print">
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

                <div className="bg-light p-3 rounded-3 border mb-3">
                  <span className="d-block fw-bold text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem' }}>Reason / Symptoms</span>
                  <p className="small mb-0 text-dark italic d-flex align-items-start gap-2">
                    <FaStethoscope className="text-muted mt-1" style={{ flexShrink: 0 }} />
                    <span>{appt.symptoms}</span>
                  </p>
                </div>
                
                {/* Patient details (for who this was booked) */}
                <div className="d-flex justify-content-between align-items-center text-muted small border-bottom pb-2 mb-3">
                  <span>Patient: <strong className="text-dark">{appt.patient_name}</strong> ({appt.patient_gender}, {appt.patient_age} yrs)</span>
                  <span className="text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>ID: #{appt.appointment_id}</span>
                </div>

                {/* Extended Features Actions: View Prescription & View Bill */}
                <div className="d-flex gap-2">
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
                </div>

              </div>
            </div>
          ))}
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
                            <td><strong>{med.medicine_name}</strong></td>
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

                {/* Recommended Tests */}
                {activePrescription.tests && activePrescription.tests.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">Recommended Tests & Scans</h6>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Test/Scan Name</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activePrescription.tests.map((test, idx) => (
                            <tr key={idx}>
                              <td><strong>{test.test_name}</strong></td>
                              <td>{test.test_type}</td>
                              <td>{test.priority}</td>
                              <td>{test.instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* General Advice Notes */}
                {activePrescription.notes && (
                  <div className="bg-light p-3 rounded border">
                    <span className="d-block small text-muted text-uppercase fw-bold mb-1">Clinician Notes</span>
                    <p className="mb-0 text-dark italic small" style={{ whiteSpace: 'pre-line' }}>{activePrescription.notes}</p>
                  </div>
                )}

              </div>
              <div className="modal-footer bg-light border-top d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setActivePrescription(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary-custom px-4 d-flex align-items-center gap-1.5" onClick={handlePrintPrescription}>
                  <FaPrint /> Print Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ----------------------- Billing Overlay Modal --------------------------- */}
      {/* ========================================================================= */}
      {activeBill && (
        <div className="modal show d-block no-print" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold text-secondary d-flex align-items-center gap-2">
                  <FaReceipt /> Consultation Invoice (ID: #{activeBill.bill_id})
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveBill(null)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-2 mb-3 small">
                  <div className="col-6"><strong>Bill Date:</strong> {formatDate(activeBill.bill_date)}</div>
                  <div className="col-6 text-end"><strong>Status:</strong> <span className={`badge-status status-${activeBill.payment_status.toLowerCase()} py-0.5 px-2`}>{activeBill.payment_status}</span></div>
                  <div className="col-6"><strong>Doctor:</strong> {activeBill.doctor_name}</div>
                  <div className="col-6 text-end"><strong>Method:</strong> {activeBill.payment_method}</div>
                </div>

                <hr className="my-3 text-muted" />

                {/* Charges Breakdowns */}
                <h6 className="fw-bold mb-2">Invoice Details</h6>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">Consultation Fee:</span>
                  <span>₹{parseFloat(activeBill.consultation_fee).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">Medicine Charges:</span>
                  <span>₹{parseFloat(activeBill.medicine_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">Lab Test Charges:</span>
                  <span>₹{parseFloat(activeBill.lab_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">Diagnostic Scan Charges:</span>
                  <span>₹{parseFloat(activeBill.scan_charges).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">Other Charges:</span>
                  <span>₹{parseFloat(activeBill.other_charges).toFixed(2)}</span>
                </div>

                <hr className="my-2 dashed" style={{ borderTop: '1px dashed #ccc' }} />

                <div className="d-flex justify-content-between py-1 small text-danger">
                  <span>(-) Discount Applied:</span>
                  <span>₹{parseFloat(activeBill.discount).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 small text-primary">
                  <span>(+) Tax:</span>
                  <span>₹{parseFloat(activeBill.tax).toFixed(2)}</span>
                </div>

                <div className="bg-light p-3 rounded border mt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0">Grand Total Invoice:</h6>
                  <h5 className="fw-bold mb-0 text-primary">₹{parseFloat(activeBill.grand_total).toFixed(2)}</h5>
                </div>
              </div>
              <div className="modal-footer bg-light border-top d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setActiveBill(null)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary-custom px-4 d-flex align-items-center gap-1.5" onClick={handlePrintBill}>
                  <FaPrint /> Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- Printable Layout wrappers --------------------------- */}
      {/* ========================================================================= */}
      {printData && printType === 'prescription' && (
        <div className="print-only printable-area p-5 bg-white text-dark no-print-layout" style={{ minHeight: '100vh', fontFamily: 'serif' }}>
          <div className="text-center mb-4">
            <h2 className="fw-bold text-uppercase mb-0">CareSync Healthcare Center</h2>
            <p className="small text-muted mb-1">Integfarms Medical Plaza, Bangalore, Karnataka, India | Phone: +91 98765 43210</p>
            <p className="small text-muted">Email: ashwin@integfarms.com</p>
            <div style={{ borderBottom: '3px double #000', margin: '15px 0' }}></div>
          </div>

          <div className="row mb-4">
            <div className="col-6">
              <h5 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{printData.doctorName}</h5>
              <span className="text-muted d-block small" style={{ fontSize: '0.85rem' }}>{printData.specialization}</span>
              <span className="text-muted d-block small" style={{ fontSize: '0.85rem' }}>Verified Medical Consultant</span>
            </div>
            <div className="col-6 text-end">
              <span className="small d-block"><strong>Prescription Date:</strong> {formatDate(printData.prescriptionDate)}</span>
              <span className="small d-block"><strong>Patient Reference ID:</strong> #{printData.patientPhone}</span>
            </div>
          </div>

          <div className="card p-3 mb-4 rounded-0 bg-light border" style={{ fontSize: '0.9rem' }}>
            <h6 className="fw-bold border-bottom pb-1 mb-2">Patient Demographics</h6>
            <div className="row g-2">
              <div className="col-6"><strong>Patient Name:</strong> {printData.patientName}</div>
              <div className="col-3"><strong>Age:</strong> {printData.patientAge} yrs</div>
              <div className="col-3"><strong>Gender:</strong> {printData.patientGender}</div>
              <div className="col-6"><strong>Phone:</strong> {printData.patientPhone}</div>
              <div className="col-6"><strong>Email:</strong> {printData.patientEmail}</div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold border-bottom pb-2 text-primary" style={{ fontSize: '1.05rem' }}>DIAGNOSIS</h5>
            <p className="mt-2 fs-6 fw-semibold text-dark" style={{ textIndent: '20px' }}>{printData.diagnosis}</p>
          </div>

          {printData.medicines && printData.medicines.length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold border-bottom pb-2 text-primary" style={{ fontSize: '1.05rem' }}>PRESCRIBED MEDICINES (Rx)</h5>
              <table className="table table-bordered table-sm mt-2 text-dark align-middle" style={{ fontSize: '0.85rem' }}>
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
                  {printData.medicines.map((med, idx) => (
                    <tr key={idx}>
                      <td><strong>{med.medicine_name}</strong></td>
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

          {printData.tests && printData.tests.length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold border-bottom pb-2 text-primary" style={{ fontSize: '1.05rem' }}>RECOMMENDED LAB TESTS & SCANS</h5>
              <table className="table table-bordered table-sm mt-2 text-dark" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Test/Scan Name</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.tests.map((test, idx) => (
                    <tr key={idx}>
                      <td><strong>{test.test_name}</strong></td>
                      <td>{test.test_type}</td>
                      <td>{test.priority}</td>
                      <td>{test.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {printData.notes && (
            <div className="mb-4">
              <h5 className="fw-bold border-bottom pb-2 text-primary" style={{ fontSize: '1.05rem' }}>GENERAL NOTES</h5>
              <p className="mt-2 text-dark italic small" style={{ whiteSpace: 'pre-line' }}>{printData.notes}</p>
            </div>
          )}

          <div className="mt-5 pt-5 row">
            <div className="col-8"></div>
            <div className="col-4 text-center">
              <div style={{ borderBottom: '1px solid #000', margin: '30px auto 10px', width: '150px' }}></div>
              <span className="small fw-bold">Physician Signature</span>
            </div>
          </div>
        </div>
      )}

      {printData && printType === 'bill' && (
        <div className="print-only printable-area p-5 bg-white text-dark no-print-layout" style={{ minHeight: '100vh', fontFamily: 'monospace' }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold text-uppercase mb-0">CareSync Healthcare Invoice</h3>
            <p className="small text-muted mb-1">Integfarms Medical Plaza, Bangalore, India</p>
            <p className="small text-muted">Tel: +91 98765 43210 | email: ashwin@integfarms.com</p>
            <hr style={{ borderTop: '1.5px dashed #000' }} />
          </div>

          <div className="row mb-3" style={{ fontSize: '0.85rem' }}>
            <div className="col-6">
              <p className="mb-0"><strong>INVOICE NO:</strong> CS-BILL-{printData.bill_id}</p>
              <p className="mb-0"><strong>BILL DATE:</strong> {formatDate(printData.bill_date)}</p>
              <p className="mb-0"><strong>APPOINTMENT ID:</strong> #{printData.appointment_id}</p>
            </div>
            <div className="col-6 text-end">
              <p className="mb-0"><strong>PATIENT:</strong> {printData.patient_name}</p>
              <p className="mb-0"><strong>AGE/GENDER:</strong> {printData.patient_age} yrs / {printData.patient_gender}</p>
              <p className="mb-0"><strong>CONTACT:</strong> {printData.patient_phone}</p>
            </div>
          </div>

          <hr style={{ borderTop: '1.5px dashed #000' }} />

          <div className="mb-4">
            <h6 className="fw-bold mb-2">FEE CHARGES BREAKDOWN</h6>
            <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
              <span>1. Consultation Clinician Fee:</span>
              <span>₹{parseFloat(printData.consultation_fee).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
              <span>2. Prescribed Pharmacy Medicines:</span>
              <span>₹{parseFloat(printData.medicine_charges).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
              <span>3. Laboratory Test Charges:</span>
              <span>₹{parseFloat(printData.lab_charges).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
              <span>4. Diagnostics Scan Charges:</span>
              <span>₹{parseFloat(printData.scan_charges).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
              <span>5. Ward & Other Charges:</span>
              <span>₹{parseFloat(printData.other_charges).toFixed(2)}</span>
            </div>
          </div>

          <hr style={{ borderTop: '1.5px dashed #000' }} />

          <div className="mb-4" style={{ fontSize: '0.85rem' }}>
            <div className="d-flex justify-content-between py-1">
              <span>Subtotal:</span>
              <span>₹{(
                parseFloat(printData.consultation_fee) +
                parseFloat(printData.medicine_charges) +
                parseFloat(printData.lab_charges) +
                parseFloat(printData.scan_charges) +
                parseFloat(printData.other_charges)
              ).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1 text-danger">
              <span>(-) Discount Applied:</span>
              <span>₹{parseFloat(printData.discount).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between py-1 text-primary">
              <span>(+) Tax Configured:</span>
              <span>₹{parseFloat(printData.tax).toFixed(2)}</span>
            </div>
            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
            <div className="d-flex justify-content-between py-1 fw-bold fs-5">
              <span>GRAND TOTAL RECEIPT:</span>
              <span>₹{parseFloat(printData.grand_total).toFixed(2)}</span>
            </div>
          </div>

          <hr style={{ borderTop: '1.5px dashed #000' }} />

          <div className="row mb-4" style={{ fontSize: '0.85rem' }}>
            <div className="col-6">
              <p className="mb-0"><strong>PAYMENT STATUS:</strong> {printData.payment_status.toUpperCase()}</p>
              <p className="mb-0"><strong>PAYMENT METHOD:</strong> {printData.payment_method}</p>
            </div>
            <div className="col-6 text-end">
              <p className="mb-0"><strong>CLINICIAN:</strong> {printData.doctor_name}</p>
              <p className="mb-0"><strong>SPECIALTY:</strong> {printData.doctor_specialization}</p>
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="small mb-0">*** Thank you for choosing CareSync Hospital! ***</p>
            <p className="small text-muted">Get well soon.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyAppointments;
