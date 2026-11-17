import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DoctorCard from '../../components/DoctorCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FaSearch, FaStethoscope, FaUserMd, FaHospitalSymbol, FaAward } from 'react-icons/fa';

const Home = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  
  const { isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/api/doctors');
        setDoctors(response.data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        showToast('Failed to load doctor listings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [showToast]);

  // Unique list of specializations for filter (including 'All')
  const specializations = ['All', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'Neurologist'];

  // Filtering Logic
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialization === 'All' || doctor.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialty;
  });

  const handleBookClick = (doctor) => {
    if (!isAuthenticated) {
      showToast('Please login to book an appointment.', 'info');
      navigate('/login', { state: { from: `/book/${doctor.doctor_id}` } });
      return;
    }
    
    if (role !== 'customer') {
      showToast('Only patients can book appointments.', 'warning');
      return;
    }

    navigate(`/book/${doctor.doctor_id}`);
  };

  return (
    <div className="animated-fade-in">
      {/* 1. Hero Section */}
      <section className="hero-section text-center text-lg-start">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-primary-light text-primary fw-bold px-3 py-2 mb-3">
                🏥 Welcome to CareSync Hospital
              </span>
              <h1 className="display-4 fw-extrabold text-dark mb-3" style={{ lineHeight: '1.2' }}>
                Your Health, Our <span className="text-primary">Priority</span>.
              </h1>
              <p className="lead text-muted mb-4">
                Connect with our premium board-certified medical specialists. Book consultation slots online in under two minutes with instant reservation status.
              </p>
              
              {/* Search Bar inside Hero */}
              <div className="p-2 bg-white rounded-3 shadow-md border d-flex align-items-center gap-2 max-width-500 mx-auto mx-lg-0">
                <FaSearch className="text-muted ms-2" />
                <input 
                  type="text" 
                  className="form-control border-0 bg-transparent py-2 shadow-none" 
                  placeholder="Search doctor name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-lg-6 d-none d-lg-block text-center">
              <div className="position-relative d-inline-block">
                {/* Visual Medical Card Stack */}
                <div className="bg-white p-4 rounded-4 shadow-lg border text-start" style={{ width: '380px', transform: 'rotate(-3deg)' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary text-white p-3 rounded-circle fs-4">🏥</div>
                    <div>
                      <h6 className="fw-bold mb-0">CareSync Center</h6>
                      <small className="text-muted">Open 24 Hours</small>
                    </div>
                  </div>
                  <p className="small text-muted mb-0">Premium quality patient care, advanced diagnostics, and dedicated clinical wards.</p>
                </div>
                
                <div className="bg-primary text-white p-4 rounded-4 shadow-lg text-start position-absolute" style={{ width: '320px', bottom: '-40px', right: '-40px', transform: 'rotate(5deg)' }}>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-white text-primary p-2 rounded-circle fs-5">✔️</div>
                    <h6 className="fw-bold mb-0">Verified Doctors</h6>
                  </div>
                  <small className="opacity-90">Exactly 5 expert specialists ready to consult you.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Doctor Search & List Section */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark mb-2">Our Specialists</h2>
            <p className="text-muted">Search or filter below to find your medical expert.</p>
          </div>

          {/* Filter Bar */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
            {specializations.map((spec) => (
              <button
                key={spec}
                className={`btn btn-sm px-4 py-2 rounded-pill fw-semibold transition ${
                  selectedSpecialization === spec 
                    ? 'btn-primary-custom text-white' 
                    : 'btn-outline-secondary bg-light border-0 text-dark'
                }`}
                onClick={() => setSelectedSpecialization(spec)}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Doctor Cards Grid */}
          {loading ? (
            <LoadingSpinner message="Fetching doctors list..." />
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-5">
              <FaUserMd className="text-muted display-4 mb-3" />
              <h5 className="fw-semibold text-muted">No doctors found matching your criteria.</h5>
              <button 
                className="btn btn-primary-custom btn-sm mt-3" 
                onClick={() => { setSearchQuery(''); setSelectedSpecialization('All'); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {filteredDoctors.map(doctor => (
                <div key={doctor.doctor_id} className="col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <DoctorCard doctor={doctor} onBookClick={handleBookClick} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. About Section */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h2 className="fw-bold text-dark mb-4">Why Choose CareSync Healthcare?</h2>
              
              <div className="d-flex gap-3 mb-4">
                <div className="fs-3 text-primary"><FaStethoscope /></div>
                <div>
                  <h5 className="fw-bold">Experienced Personnel</h5>
                  <p className="text-muted small">Our clinicians have more than 10+ years of active practicing experience in advanced medicine.</p>
                </div>
              </div>

              <div className="d-flex gap-3 mb-4">
                <div className="fs-3 text-primary"><FaHospitalSymbol /></div>
                <div>
                  <h5 className="fw-bold">State-Of-The-Art Facilities</h5>
                  <p className="text-muted small">We utilize highly precise, certified medical equipments to perform diagnostics and therapies.</p>
                </div>
              </div>

              <div className="d-flex gap-3">
                <div className="fs-3 text-primary"><FaAward /></div>
                <div>
                  <h5 className="fw-bold">Patient Centered Care</h5>
                  <p className="text-muted small">We prioritize patient convenience, comfortable recovery rooms, and stress-free appointment booking.</p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="bg-white p-5 rounded-4 shadow-sm border">
                <h4 className="fw-bold text-dark mb-3">Our Core Promise</h4>
                <p className="text-muted small">
                  At CareSync, we believe that health services should be accessible, empathetic, and exceptionally professional. We ensure complete confidentiality of medical charts, real-time updates on appointment reviews, and transparent channels between doctors and patients.
                </p>
                <div className="d-flex align-items-center gap-3 mt-4 pt-3 border-top">
                  <div className="border-end pe-3 text-center">
                    <h3 className="fw-bold text-primary mb-0">100%</h3>
                    <small className="text-muted">Verified Docs</small>
                  </div>
                  <div className="border-end pe-3 text-center ps-2">
                    <h3 className="fw-bold text-primary mb-0">2 Min</h3>
                    <small className="text-muted">Quick Booking</small>
                  </div>
                  <div className="text-center ps-2">
                    <h3 className="fw-bold text-primary mb-0">24/7</h3>
                    <small className="text-muted">Urgent Support</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
