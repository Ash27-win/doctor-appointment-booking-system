import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  FaCalendarCheck, FaUserCircle, FaBriefcaseMedical, FaCalendarDay, FaClipboardList, 
  FaCheck, FaTimes, FaThumbsUp, FaArrowLeft, FaFilePrescription, FaVials, FaReceipt,
  FaPlus, FaTrash, FaEdit, FaPrint
} from 'react-icons/fa';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Selected appointment details & workspace view toggle
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, prescription, tests, billing

  const { showToast } = useToast();

  // Print layout state
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState(''); // 'prescription' or 'bill'

  // --- Prescription States ---
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [medicines, setMedicines] = useState([]); // Array of medicine objects
  
  // Medicine Form Input States
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medTiming, setMedTiming] = useState('After food');
  const [medInstructions, setMedInstructions] = useState('');
  const [editingMedIndex, setEditingMedIndex] = useState(null);

  // --- Recommended Tests States ---
  const [testsList, setTestsList] = useState([]);
  
  // Test Form Input States
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('Laboratory'); // Laboratory, Scan
  const [testInstructions, setTestInstructions] = useState('');
  const [testPriority, setTestPriority] = useState('Routine'); // Routine, High, Urgent
  const [testNotes, setTestNotes] = useState('');
  const [editingTestId, setEditingTestId] = useState(null);

  // --- Billing States ---
  const initialDoctor = JSON.parse(localStorage.getItem('user')) || {};
  const [billId, setBillId] = useState(null);
  const [consultationFee, setConsultationFee] = useState(initialDoctor.consultation_fee ? String(initialDoctor.consultation_fee) : '500.00');
  const [medicineCharges, setMedicineCharges] = useState('0.00');
  const [labCharges, setLabCharges] = useState('0.00');
  const [scanCharges, setScanCharges] = useState('0.00');
  const [otherCharges, setOtherCharges] = useState('0.00');
  const [discount, setDiscount] = useState('0.00');
  const [tax, setTax] = useState('0.00');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [paymentMethod, setPaymentMethod] = useState('None');
  const [billDate, setBillDate] = useState('');

  // Fetch appointments list
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

  // Load patient clinical details when an appointment is selected
  const handleOpenWorkspace = async (appt) => {
    setSelectedAppt(appt);
    setActiveTab('details');
    setLoading(true);

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset Prescription States
    setPrescriptionId(null);
    setDiagnosis('');
    setNotes('');
    setPrescriptionDate(todayStr);
    setMedicines([]);
    resetMedicineForm();

    // Reset Tests States
    setTestsList([]);
    resetTestForm();

    // Reset Billing States
    setBillId(null);
    const loggedDoctor = JSON.parse(localStorage.getItem('user')) || {};
    const defaultDoctorFee = loggedDoctor.consultation_fee ? String(loggedDoctor.consultation_fee) : '500.00';
    setConsultationFee(defaultDoctorFee);
    setMedicineCharges('0.00');
    setLabCharges('0.00');
    setScanCharges('0.00');
    setOtherCharges('0.00');
    setDiscount('0.00');
    setTax('0.00');
    setPaymentStatus('Pending');
    setPaymentMethod('None');
    setBillDate(todayStr);

    try {
      // 1. Load Prescription
      try {
        const prescrRes = await api.get(`/api/prescriptions/appointment/${appt.appointment_id}`);
        if (prescrRes.data) {
          setPrescriptionId(prescrRes.data.prescription_id);
          setDiagnosis(prescrRes.data.diagnosis);
          setNotes(prescrRes.data.notes);
          setPrescriptionDate(prescrRes.data.prescription_date.split('T')[0]);
          setMedicines(prescrRes.data.medicines || []);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error loading prescription:', err);
        }
      }

      // 2. Load Recommended Tests
      try {
        const testRes = await api.get(`/api/tests/appointment/${appt.appointment_id}`);
        setTestsList(testRes.data || []);
      } catch (err) {
        console.error('Error loading tests:', err);
      }

      // 3. Load Billing
      try {
        const billRes = await api.get(`/api/bills/appointment/${appt.appointment_id}`);
        if (billRes.data) {
          setBillId(billRes.data.bill_id);
          setConsultationFee(billRes.data.consultation_fee);
          setMedicineCharges(billRes.data.medicine_charges);
          setLabCharges(billRes.data.lab_charges);
          setScanCharges(billRes.data.scan_charges);
          setOtherCharges(billRes.data.other_charges);
          setDiscount(billRes.data.discount);
          setTax(billRes.data.tax);
          setPaymentStatus(billRes.data.payment_status);
          setPaymentMethod(billRes.data.payment_method);
          setBillDate(billRes.data.bill_date.split('T')[0]);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error loading bill:', err);
        }
      }

    } catch (error) {
      console.error('Error loading workspace details:', error);
      showToast('Error syncing details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Status Transition Handler with Validation
   * Enforces rejection reason prompt when rejecting an appointment.
   */
  const handleStatusUpdate = async (id, newStatus) => {
    let reason = null;
    if (newStatus === 'Rejected') {
      reason = window.prompt('Please provide a reason for rejecting this consultation:');
      if (reason === null) return; // User cancelled prompt
      if (!reason.trim() || reason.trim().length < 5) {
        showToast('A meaningful rejection reason (min 5 characters) is required.', 'warning');
        return;
      }
    }

    setUpdatingId(id);
    try {
      await api.put(`/api/appointments/${id}/status`, { 
        status: newStatus,
        reason: reason ? reason.trim() : null
      });
      showToast(`Appointment marked as ${newStatus}`, 'success');

      // Update local appointments list
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.appointment_id === id ? { ...appt, status: newStatus, cancellation_reason: reason || appt.cancellation_reason } : appt
        )
      );

      // Update workspace selected appointment status
      if (selectedAppt && selectedAppt.appointment_id === id) {
        setSelectedAppt(prev => ({ ...prev, status: newStatus, cancellation_reason: reason || prev.cancellation_reason }));
      }
    } catch (error) {
      console.error('Update status error:', error);
      const errMsg = error.response?.data?.message || 'Failed to update appointment status.';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Medicine Handlers with Validation ---
  const resetMedicineForm = () => {
    setMedName('');
    setMedDosage('');
    setMedFrequency('');
    setMedDuration('');
    setMedTiming('After food');
    setMedInstructions('');
    setEditingMedIndex(null);
  };

  /**
   * Validate and add a medicine item to prescription draft
   * Enforces non-empty name, dosage, frequency, and duration.
   */
  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!medName.trim() || medName.trim().length < 2) {
      showToast('Medicine name must be at least 2 characters.', 'warning');
      return;
    }
    if (!medDosage.trim()) {
      showToast('Dosage is required (e.g. 500mg, 1 tablet).', 'warning');
      return;
    }
    if (!medFrequency.trim()) {
      showToast('Frequency is required (e.g. 1-0-1, Twice daily).', 'warning');
      return;
    }
    if (!medDuration.trim()) {
      showToast('Duration is required (e.g. 5 days, 1 week).', 'warning');
      return;
    }

    const newMed = {
      medicine_name: medName.trim(),
      dosage: medDosage.trim(),
      frequency: medFrequency.trim(),
      duration: medDuration.trim(),
      timing: medTiming,
      instructions: medInstructions.trim()
    };

    if (editingMedIndex !== null) {
      // Edit mode
      setMedicines(prev => prev.map((m, idx) => idx === editingMedIndex ? newMed : m));
      showToast('Medicine details updated in list.', 'info');
    } else {
      // Add mode
      setMedicines(prev => [...prev, newMed]);
      showToast('Medicine added to prescription.', 'success');
    }

    resetMedicineForm();
  };

  const handleEditMedClick = (index) => {
    const med = medicines[index];
    setMedName(med.medicine_name);
    setMedDosage(med.dosage);
    setMedFrequency(med.frequency);
    setMedDuration(med.duration);
    setMedTiming(med.timing);
    setMedInstructions(med.instructions || '');
    setEditingMedIndex(index);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(prev => prev.filter((_, idx) => idx !== index));
    showToast('Medicine removed from list.', 'info');
  };

  /**
   * Prescription Submission Handler with Validation
   * Validates non-empty diagnosis (min 3 chars), non-future prescription date,
   * and ensures at least one medicine is prescribed.
   */
  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim() || diagnosis.trim().length < 3) {
      showToast('Diagnosis must be at least 3 characters.', 'warning');
      return;
    }
    if (!prescriptionDate) {
      showToast('Prescription date is required.', 'warning');
      return;
    }
    const pDate = new Date(prescriptionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (pDate > today) {
      showToast('Prescription date cannot be in the future.', 'warning');
      return;
    }
    if (medicines.length === 0) {
      showToast('At least one medicine must be added before saving prescription.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        appointment_id: selectedAppt.appointment_id,
        diagnosis: diagnosis.trim(),
        notes: notes ? notes.trim() : '',
        prescription_date: prescriptionDate,
        medicines
      };

      if (prescriptionId) {
        // Update API
        await api.put(`/api/prescriptions/${prescriptionId}`, payload);
        showToast('Prescription updated successfully!', 'success');
      } else {
        // Create API
        const response = await api.post('/api/prescriptions', payload);
        setPrescriptionId(response.data.prescriptionId);
        showToast('Prescription saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Prescription save error:', error);
      const errMsg = error.response?.data?.message || 'Error saving prescription.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Recommended Tests Handlers ---
  const resetTestForm = () => {
    setTestName('');
    setTestType('Laboratory');
    setTestInstructions('');
    setTestPriority('Routine');
    setTestNotes('');
    setEditingTestId(null);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    if (!testName) {
      showToast('Test name is required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        appointment_id: selectedAppt.appointment_id,
        test_name: testName,
        test_type: testType,
        instructions: testInstructions,
        priority: testPriority,
        notes: testNotes
      };

      if (editingTestId) {
        // Update API
        await api.put(`/api/tests/${editingTestId}`, payload);
        showToast('Test recommendation updated!', 'success');
        setTestsList(prev => prev.map(t => t.test_id === editingTestId ? { ...t, ...payload } : t));
      } else {
        // Create API
        const response = await api.post('/api/tests', payload);
        const newTest = { test_id: response.data.testId, ...payload };
        setTestsList(prev => [...prev, newTest]);
        showToast('Test recommendation added!', 'success');
      }
      resetTestForm();
    } catch (error) {
      console.error('Test save error:', error);
      const errMsg = error.response?.data?.message || 'Error saving test recommendation.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTestClick = (test) => {
    setTestName(test.test_name);
    setTestType(test.test_type);
    setTestInstructions(test.instructions || '');
    setTestPriority(test.priority);
    setTestNotes(test.notes || '');
    setEditingTestId(test.test_id);
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to remove this recommendation?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/tests/${id}`);
      setTestsList(prev => prev.filter(t => t.test_id !== id));
      showToast('Test recommendation removed.', 'info');
      if (editingTestId === id) resetTestForm();
    } catch (error) {
      console.error('Test delete error:', error);
      showToast('Failed to delete recommendation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Billing Calculations & Handlers ---
  const calculateBillingSubtotal = () => {
    return (parseFloat(consultationFee) || 0) +
           (parseFloat(medicineCharges) || 0) +
           (parseFloat(labCharges) || 0) +
           (parseFloat(scanCharges) || 0) +
           (parseFloat(otherCharges) || 0);
  };

  const calculateBillingGrandTotal = () => {
    const subtotal = calculateBillingSubtotal();
    const disc = parseFloat(discount) || 0;
    const tx = parseFloat(tax) || 0;
    const finalTotal = subtotal - disc + tx;
    return finalTotal < 0 ? 0 : finalTotal;
  };

  /**
   * Billing & Invoice Generation Handler with Strict Financial Validation
   * Validates:
   * 1. Consultation fee must be > 0.
   * 2. Non-negative charges.
   * 3. Discount cannot exceed subtotal charges.
   * 4. When marked as 'Paid', a valid payment method must be selected.
   */
  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!billDate) {
      showToast('Bill date is required.', 'warning');
      return;
    }

    const fee = parseFloat(consultationFee);
    if (isNaN(fee) || fee <= 0) {
      showToast('Consultation fee must be greater than ₹0.', 'warning');
      return;
    }

    const sub = calculateBillingSubtotal();
    const disc = parseFloat(discount) || 0;
    if (disc > sub) {
      showToast(`Discount (₹${disc}) cannot exceed subtotal charges (₹${sub.toFixed(2)}).`, 'warning');
      return;
    }

    if (paymentStatus === 'Paid' && (!paymentMethod || paymentMethod === 'None')) {
      showToast('Please select a payment method (Cash, UPI, Card, Online) when marking invoice as Paid.', 'warning');
      return;
    }

    const grand = calculateBillingGrandTotal();

    const payload = {
      appointment_id: selectedAppt.appointment_id,
      consultation_fee: fee,
      medicine_charges: parseFloat(medicineCharges) || 0,
      lab_charges: parseFloat(labCharges) || 0,
      scan_charges: parseFloat(scanCharges) || 0,
      other_charges: parseFloat(otherCharges) || 0,
      discount: disc,
      tax: parseFloat(tax) || 0,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      bill_date: billDate
    };

    setLoading(true);
    try {
      if (billId) {
        // Update API
        await api.put(`/api/bills/${billId}`, payload);
        showToast('Bill updated successfully!', 'success');
      } else {
        // Create API
        const response = await api.post('/api/bills', payload);
        setBillId(response.data.billId);
        showToast('Bill generated and saved!', 'success');
      }
    } catch (error) {
      console.error('Save bill error:', error);
      const errMsg = error.response?.data?.message || 'Error saving invoice details.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Print Views
  const handlePrintPrescription = () => {
    if (!prescriptionId) {
      showToast('Please save the prescription before printing.', 'warning');
      return;
    }
    const doctorObj = JSON.parse(localStorage.getItem('user')) || {};
    setPrintData({
      doctorName: doctorObj.name || selectedAppt.doctor_name || 'Verified Clinician',
      specialization: doctorObj.specialization || 'General Practitioner',
      patientName: selectedAppt.patient_name,
      patientAge: selectedAppt.patient_age,
      patientGender: selectedAppt.patient_gender,
      patientPhone: selectedAppt.patient_phone,
      patientEmail: selectedAppt.patient_email,
      apptDate: selectedAppt.appointment_date,
      apptTime: selectedAppt.appointment_time,
      diagnosis,
      notes,
      prescriptionDate,
      medicines,
      tests: testsList
    });
    setPrintType('prescription');
  };

  const handlePrintBill = async () => {
    if (!billId) {
      showToast('Please save the bill details before printing.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/api/bills/appointment/${selectedAppt.appointment_id}`);
      setPrintData(response.data);
      setPrintType('bill');
    } catch (error) {
      console.error('Load bill print data error:', error);
      showToast('Failed to load print billing data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper formats
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();
  const totalCount = appointments.length;

  const todayCount = appointments.filter((appt) => {
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
    <div className="page-container container animated-fade-in">
      
      {/* ------------------ Normal View / Workspace View toggle ------------------ */}
      {!selectedAppt ? (
        <>
          {/* Dashboard Title */}
          <div className="mb-4 pb-3 border-bottom no-print">
            <h2 className="fw-bold text-dark mb-1">Clinician Dashboard</h2>
            <p className="text-muted small mb-0">Overview of patient consultations and calendar bookings</p>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading dashboard statistics..." />
          ) : (
            <>
              {/* KPI Dashboard Cards */}
              <div className="row g-4 mb-5 no-print">
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
              <div className="card glass-card border-0 shadow-sm p-4 no-print">
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
                          <th scope="col" className="text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase', minWidth: '220px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => (
                          <tr key={appt.appointment_id} style={{ cursor: 'pointer' }} onClick={() => handleOpenWorkspace(appt)}>
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
                              <div className="text-truncate" style={{ maxWidth: '150px', fontSize: '0.8rem' }} title={appt.symptoms}>
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
                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="d-flex justify-content-center gap-2">
                                <button 
                                  className="btn btn-outline-secondary btn-sm px-2 py-1 small" 
                                  onClick={() => handleOpenWorkspace(appt)}
                                >
                                  Open File
                                </button>
                                
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
        </>
      ) : (
        // ------------------ Tabbed Clinician Workspace ------------------
        <div className="animated-fade-in no-print">
          
          {/* Workspace Header navigation */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <button 
              className="btn btn-secondary-custom btn-sm d-flex align-items-center gap-2"
              onClick={() => { setSelectedAppt(null); fetchAppointments(); }}
            >
              <FaArrowLeft /> Back to Dashboard
            </button>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-status status-accepted" style={{ fontSize: '0.9rem' }}>
                Consulting: {selectedAppt.patient_name} (ID: #{selectedAppt.appointment_id})
              </span>
              <span className={`badge-status status-${selectedAppt.status.toLowerCase()}`}>
                {selectedAppt.status}
              </span>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Saving changes..." />
          ) : (
            <div className="row g-4">
              
              {/* Sidebar Tabs */}
              <div className="col-12 col-md-3">
                <div className="list-group glass-card border-0 shadow-sm p-2">
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 text-start d-flex align-items-center gap-2 px-3 py-2.5 fw-semibold ${activeTab === 'details' ? 'active bg-primary text-white' : 'text-dark'}`}
                  >
                    <FaUserCircle /> Patient Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('prescription')}
                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 text-start d-flex align-items-center gap-2 px-3 py-2.5 fw-semibold ${activeTab === 'prescription' ? 'active bg-primary text-white' : 'text-dark'}`}
                  >
                    <FaFilePrescription /> Prescription
                  </button>
                  <button 
                    onClick={() => setActiveTab('tests')}
                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 text-start d-flex align-items-center gap-2 px-3 py-2.5 fw-semibold ${activeTab === 'tests' ? 'active bg-primary text-white' : 'text-dark'}`}
                  >
                    <FaVials /> Recommended Tests
                  </button>
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className={`list-group-item list-group-item-action border-0 rounded-3 text-start d-flex align-items-center gap-2 px-3 py-2.5 fw-semibold ${activeTab === 'billing' ? 'active bg-primary text-white' : 'text-dark'}`}
                  >
                    <FaReceipt /> Billing & Invoice
                  </button>
                </div>
              </div>

              {/* Tab Workspace content */}
              <div className="col-12 col-md-9">
                <div className="card glass-card border-0 shadow-sm p-4 h-100">
                  
                  {/* TAB 1: Patient & Appointment Details */}
                  {activeTab === 'details' && (
                    <div className="animated-fade-in">
                      <h4 className="fw-bold mb-3 border-bottom pb-2">Patient Files</h4>
                      <div className="row g-3 small mb-4">
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Patient Name</span>
                          <span className="fs-6 text-dark fw-semibold">{selectedAppt.patient_name}</span>
                        </div>
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Demographics</span>
                          <span className="fs-6 text-dark fw-semibold">{selectedAppt.patient_gender}, {selectedAppt.patient_age} yrs</span>
                        </div>
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Phone Number</span>
                          <span className="fs-6 text-dark fw-semibold">{selectedAppt.patient_phone}</span>
                        </div>
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Email Address</span>
                          <span className="fs-6 text-dark fw-semibold">{selectedAppt.patient_email}</span>
                        </div>
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Appointment Date</span>
                          <span className="fs-6 text-dark fw-semibold">{formatDate(selectedAppt.appointment_date)}</span>
                        </div>
                        <div className="col-6 col-md-4">
                          <span className="d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Visited Slot</span>
                          <span className="fs-6 text-dark fw-semibold">{selectedAppt.appointment_time}</span>
                        </div>
                      </div>

                      <div className="bg-light p-3 rounded border mb-4">
                        <span className="d-block text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.65rem' }}>Symptoms / Notes on Bookings</span>
                        <p className="mb-0 text-dark italic">{selectedAppt.symptoms}</p>
                      </div>

                      <h4 className="fw-bold mb-3 border-bottom pb-2">Status Operations</h4>
                      <p className="text-muted small">Update consultation status for patient record files:</p>
                      <div className="d-flex gap-2">
                        {selectedAppt.status === 'Pending' && (
                          <>
                            <button
                              className="btn btn-outline-primary px-4 py-2"
                              onClick={() => handleStatusUpdate(selectedAppt.appointment_id, 'Accepted')}
                            >
                              Accept Appointment
                            </button>
                            <button
                              className="btn btn-outline-danger px-4 py-2"
                              onClick={() => handleStatusUpdate(selectedAppt.appointment_id, 'Rejected')}
                            >
                              Reject Appointment
                            </button>
                          </>
                        )}
                        {selectedAppt.status === 'Accepted' && (
                          <button
                            className="btn btn-success px-4 py-2 text-white border-0"
                            style={{ background: 'linear-gradient(135deg, var(--color-completed) 0%, #059669 100%)' }}
                            onClick={() => handleStatusUpdate(selectedAppt.appointment_id, 'Completed')}
                          >
                            Mark Consultation Completed
                          </button>
                        )}
                        {(selectedAppt.status === 'Completed' || selectedAppt.status === 'Rejected') && (
                          <span className="text-muted small italic bg-light p-2.5 rounded border">
                            This appointment has been finalized as {selectedAppt.status.toLowerCase()}. No status updates are active.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Prescription Tab */}
                  {activeTab === 'prescription' && (
                    <div className="animated-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <h4 className="fw-bold mb-0">Write Medical Prescription</h4>
                        {prescriptionId && (
                          <button 
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3"
                            onClick={handlePrintPrescription}
                          >
                            <FaPrint /> Print Rx
                          </button>
                        )}
                      </div>
                      
                      <form onSubmit={handleSavePrescription}>
                        <div className="row g-3 mb-4">
                          <div className="col-12 col-md-8">
                            <label className="form-label small fw-bold text-muted">Diagnosis</label>
                            <input 
                              type="text" 
                              className="form-control custom-input border-2" 
                              placeholder="e.g. Acute Gastritis, Viral Fever"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold text-muted">Prescription Date</label>
                            <input 
                              type="date" 
                              className="form-control custom-input border-2"
                              value={prescriptionDate}
                              onChange={(e) => setPrescriptionDate(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-bold text-muted">General Practitioner Notes</label>
                            <textarea 
                              className="form-control custom-input border-2" 
                              rows="2"
                              placeholder="Add general clinical advice, diet restrictions, or recovery instructions..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                          </div>
                        </div>

                        {/* Add Medicines Form */}
                        <div className="border rounded p-3 bg-light mb-4">
                          <h6 className="fw-bold text-dark mb-3">Add Medicine / Drug</h6>
                          <div className="row g-2 mb-3">
                            <div className="col-12 col-md-4">
                              <input 
                                type="text" 
                                className="form-control custom-input border-2 py-2 small"
                                placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                                value={medName}
                                onChange={(e) => setMedName(e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-2">
                              <input 
                                type="text" 
                                className="form-control custom-input border-2 py-2 small"
                                placeholder="Dosage (e.g. 1 tablet)"
                                value={medDosage}
                                onChange={(e) => setMedDosage(e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-2">
                              <input 
                                type="text" 
                                className="form-control custom-input border-2 py-2 small"
                                placeholder="Frequency (e.g. 2 times daily)"
                                value={medFrequency}
                                onChange={(e) => setMedFrequency(e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-2">
                              <input 
                                type="text" 
                                className="form-control custom-input border-2 py-2 small"
                                placeholder="Duration (e.g. 5 days)"
                                value={medDuration}
                                onChange={(e) => setMedDuration(e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-2">
                              <select 
                                className="form-select custom-input border-2 py-2 small"
                                value={medTiming}
                                onChange={(e) => setMedTiming(e.target.value)}
                              >
                                <option value="After food">After food</option>
                                <option value="Before food">Before food</option>
                                <option value="Empty stomach">Empty stomach</option>
                                <option value="With milk">With milk</option>
                                <option value="At bedtime">At bedtime</option>
                              </select>
                            </div>
                          </div>
                          <div className="mb-3">
                            <input 
                              type="text" 
                              className="form-control custom-input border-2 py-2 small"
                              placeholder="Instructions / Cautions (e.g. Take with sufficient water, avoid cold items)"
                              value={medInstructions}
                              onChange={(e) => setMedInstructions(e.target.value)}
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={handleAddMedicine}
                            className="btn btn-secondary-custom btn-sm px-3 d-flex align-items-center gap-1"
                          >
                            <FaPlus /> {editingMedIndex !== null ? 'Update Medicine' : 'Add to Prescription'}
                          </button>
                        </div>

                        {/* List of Added Medicines */}
                        <div className="mb-4">
                          <h6 className="fw-bold mb-2">Prescribed Medicines ({medicines.length})</h6>
                          {medicines.length === 0 ? (
                            <p className="text-muted small italic">No medicines added to prescription list yet.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered align-middle small">
                                <thead className="table-light">
                                  <tr>
                                    <th>Medicine Name</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Timing</th>
                                    <th>Instructions</th>
                                    <th className="text-center" style={{ width: '90px' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {medicines.map((med, idx) => (
                                    <tr key={idx}>
                                      <td><strong>{med.medicine_name}</strong></td>
                                      <td>{med.dosage}</td>
                                      <td>{med.frequency}</td>
                                      <td>{med.duration}</td>
                                      <td>{med.timing}</td>
                                      <td>{med.instructions || '-'}</td>
                                      <td className="text-center">
                                        <button 
                                          type="button"
                                          className="btn btn-link text-primary p-0 me-2"
                                          onClick={() => handleEditMedClick(idx)}
                                          title="Edit"
                                        >
                                          <FaEdit />
                                        </button>
                                        <button 
                                          type="button"
                                          className="btn btn-link text-danger p-0"
                                          onClick={() => handleRemoveMedicine(idx)}
                                          title="Remove"
                                        >
                                          <FaTrash />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Save Prescription buttons */}
                        <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                          <button 
                            type="submit" 
                            className="btn btn-primary-custom px-4"
                          >
                            {prescriptionId ? 'Update Prescription' : 'Save Prescription'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: Recommended Tests */}
                  {activeTab === 'tests' && (
                    <div className="animated-fade-in">
                      <h4 className="fw-bold mb-3 border-bottom pb-2">Recommend Tests / Scans</h4>
                      
                      {/* Order test form */}
                      <form onSubmit={handleSaveTest} className="border rounded p-3 bg-light mb-4">
                        <h6 className="fw-bold text-dark mb-3">
                          {editingTestId ? 'Edit Test Recommendation' : 'Recommend New Test / Scan'}
                        </h6>
                        <div className="row g-2 mb-3">
                          <div className="col-12 col-md-5">
                            <label className="form-label small text-muted mb-1">Test/Scan Name</label>
                            <input 
                              type="text" 
                              className="form-control custom-input border-2 py-2 small"
                              placeholder="e.g. Complete Blood Count (CBC), Brain MRI"
                              value={testName}
                              onChange={(e) => setTestName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label small text-muted mb-1">Type</label>
                            <select 
                              className="form-select custom-input border-2 py-2 small"
                              value={testType}
                              onChange={(e) => setTestType(e.target.value)}
                            >
                              <option value="Laboratory">Laboratory</option>
                              <option value="Scan">Scan</option>
                            </select>
                          </div>
                          <div className="col-6 col-md-4">
                            <label className="form-label small text-muted mb-1">Priority</label>
                            <select 
                              className="form-select custom-input border-2 py-2 small"
                              value={testPriority}
                              onChange={(e) => setTestPriority(e.target.value)}
                            >
                              <option value="Routine">Routine</option>
                              <option value="High">High Priority</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </div>
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label small text-muted mb-1">Instructions for Lab/Scan Center</label>
                            <input 
                              type="text" 
                              className="form-control custom-input border-2 py-2 small"
                              placeholder="e.g. Fasting 10 hours required, with contrast"
                              value={testInstructions}
                              onChange={(e) => setTestInstructions(e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label small text-muted mb-1">Notes for Patient</label>
                            <input 
                              type="text" 
                              className="form-control custom-input border-2 py-2 small"
                              placeholder="e.g. Schedule for tomorrow morning"
                              value={testNotes}
                              onChange={(e) => setTestNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            type="submit" 
                            className="btn btn-secondary-custom btn-sm px-4 d-flex align-items-center gap-1"
                          >
                            <FaPlus /> {editingTestId ? 'Update Test' : 'Recommend Test'}
                          </button>
                          {editingTestId && (
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={resetTestForm}
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Tests Table list */}
                      <div>
                        <h6 className="fw-bold mb-2">Recommended Tests List ({testsList.length})</h6>
                        {testsList.length === 0 ? (
                          <p className="text-muted small italic">No tests recommended for this session yet.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered align-middle small">
                              <thead className="table-light">
                                <tr>
                                  <th>Test Name</th>
                                  <th>Type</th>
                                  <th>Priority</th>
                                  <th>Lab Instructions</th>
                                  <th>Patient Notes</th>
                                  <th className="text-center" style={{ width: '90px' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testsList.map((test) => (
                                  <tr key={test.test_id}>
                                    <td><strong>{test.test_name}</strong></td>
                                    <td>
                                      <span className={`badge ${test.test_type === 'Scan' ? 'bg-secondary' : 'bg-primary'}`}>
                                        {test.test_type}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`fw-bold ${test.priority === 'Urgent' ? 'text-danger' : test.priority === 'High' ? 'text-warning' : 'text-dark'}`}>
                                        {test.priority}
                                      </span>
                                    </td>
                                    <td>{test.instructions || '-'}</td>
                                    <td>{test.notes || '-'}</td>
                                    <td className="text-center">
                                      <button 
                                        type="button"
                                        className="btn btn-link text-primary p-0 me-2"
                                        onClick={() => handleEditTestClick(test)}
                                        title="Edit"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button 
                                        type="button"
                                        className="btn btn-link text-danger p-0"
                                        onClick={() => handleDeleteTest(test.test_id)}
                                        title="Delete"
                                      >
                                        <FaTrash />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 4: Billing Panel */}
                  {activeTab === 'billing' && (
                    <div className="animated-fade-in">
                      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <h4 className="fw-bold mb-0">Consultation Invoice</h4>
                        {billId && (
                          <button 
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3"
                            onClick={handlePrintBill}
                          >
                            <FaPrint /> Print Invoice
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveBill}>
                        <div className="row g-3 mb-4">
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Consultation Fee</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={consultationFee}
                                onChange={(e) => setConsultationFee(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Medicine Charges</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={medicineCharges}
                                onChange={(e) => setMedicineCharges(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Lab Charges</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={labCharges}
                                onChange={(e) => setLabCharges(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Scan Charges</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={scanCharges}
                                onChange={(e) => setScanCharges(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Other Charges</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={otherCharges}
                                onChange={(e) => setOtherCharges(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Discount Applied</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Tax Configured</label>
                            <div className="input-group">
                              <span className="input-group-text bg-light border-2 border-end-0">₹</span>
                              <input 
                                type="number" 
                                step="0.01"
                                className="form-control custom-input border-2 border-start-0 ps-1"
                                value={tax}
                                onChange={(e) => setTax(e.target.value)}
                                min="0"
                                required
                              />
                            </div>
                          </div>

                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted">Billing Date</label>
                            <input 
                              type="date" 
                              className="form-control custom-input border-2"
                              value={billDate}
                              onChange={(e) => setBillDate(e.target.value)}
                              required
                            />
                          </div>

                          <div className="col-6 col-md-6">
                            <label className="form-label small fw-bold text-muted">Payment Status</label>
                            <select 
                              className="form-select custom-input border-2"
                              value={paymentStatus}
                              onChange={(e) => setPaymentStatus(e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div className="col-6 col-md-6">
                            <label className="form-label small fw-bold text-muted">Payment Method</label>
                            <select 
                              className="form-select custom-input border-2"
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                              <option value="None">None</option>
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Card">Card</option>
                              <option value="Online">Online</option>
                            </select>
                          </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="bg-light p-3 rounded border mb-4">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Subtotal Breakdown:</span>
                            <span className="fw-semibold">₹{calculateBillingSubtotal().toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 text-danger">
                            <span className="small">(-) Discount:</span>
                            <span className="fw-semibold">₹{(parseFloat(discount) || 0).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 text-primary">
                            <span className="small">(+) Tax Charges:</span>
                            <span className="fw-semibold">₹{(parseFloat(tax) || 0).toFixed(2)}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">Grand Invoice Total:</h5>
                            <h4 className="fw-bold mb-0 text-primary">₹{calculateBillingGrandTotal().toFixed(2)}</h4>
                          </div>
                        </div>

                        <div className="d-flex justify-content-end pt-3 border-top">
                          <button 
                            type="submit" 
                            className="btn btn-primary-custom px-4"
                          >
                            {billId ? 'Update Bill' : 'Generate & Save Bill'}
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* ----------------- Printable Layouts (Hidden in normal screen) ----------- */}
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
              <span className="small d-block"><strong>Appointment ID:</strong> #{selectedAppt.appointment_id}</span>
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
              <p className="mb-0"><strong>APPOINTMENT ID:</strong> #{selectedAppt.appointment_id}</p>
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

export default DoctorDashboard;
