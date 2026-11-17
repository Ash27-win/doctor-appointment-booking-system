# CareSync - Doctor Appointment Booking System

CareSync is a comprehensive, production-ready, full-stack medical appointment scheduling and clinical operations platform. It features real-time dynamic slot availability, double-booking prevention, patient consultation lifecycle management (booking, cancellation, rescheduling), clinician charts (prescriptions & itemized billing), profile settings, and an administrative control center.

---

## 🌟 Key Features

### 👤 Customer (Patient) Module
- **Live Specialist Directory & Search**: Dynamically filter doctors by specialization or search by name. Consultation fees and credentials are shown upfront.
- **Strict Validation Authentication**: Patient registration and login with strong password policies, RFC-compliant email validation, and 10-digit mobile phone formatting.
- **Dynamic Real-Time Slot Booking**:
  - Doctor working-day enforcement (disables doctor off-days).
  - Calculates real-time 30-minute intervals based on doctor's practicing hours.
  - Automatically identifies and disables already booked or past slots.
  - Double-booking prevention enforced at database transaction level.
- **Patient Appointment Management**:
  - Tabbed organization: *All*, *Upcoming / Active*, *Completed*, and *Cancelled / Rejected*.
  - **Cancel Appointment**: Patients can cancel upcoming bookings with mandatory reason tracking, instantly freeing the slot.
  - **Reschedule Appointment**: Change date and time slot with live conflict verification.
  - **View & Print Clinical Documents**: Access medical prescriptions (Rx) and itemized bills.
- **Patient Medical Profile (`/profile`)**: Manage personal details, blood group, date of birth, emergency contact, and update password securely.

### 🩺 Doctor Module
- **Clinician Secure Login**: Access portal with pre-seeded doctor credentials.
- **Clinical Dashboard**: Real-time KPI counters: *Total Appointments*, *Today's Consultations*, and *Patient Queue*.
- **Patient Clinical Workspace**:
  - Structured status transitions with rejection reason tracking.
  - **Write Prescriptions**: Clinical diagnosis with validation, plus dynamic multi-medicine prescription table (dosage, frequency, duration, timing, instructions).
  - **Order Diagnostic Tests**: Recommend lab tests (e.g. CBC, Lipid Profile) and scans (e.g. MRI, CT) with priority flags.
  - **Generate Itemized Bills**: Automatic invoice calculation for consultation fee, medicines, lab, and scans with discount threshold checks and tax calculation.
- **Doctor Schedule & Profile Settings (`/doctor/profile`)**:
  - Configure practicing days (Monday–Sunday interactive selection).
  - Set visiting hours (e.g. `09:00 AM - 01:00 PM`) which dynamically generates booking slots.
  - Set consultation fee and update bio/credentials.
  - Update account password.

### 🏢 Hospital Administration Module
- **Admin Control Center (`/admin/login` -> `/admin/dashboard`)**:
  - **Hospital Metrics**: Total Doctors, Registered Patients, Total Bookings, Today's Consultations, Total Revenue Collected.
  - **Clinician Directory**: Onboard new medical specialists, edit visiting hours, practicing days, or remove clinician records.
  - **Clinic-wide Appointments Audit**: Live search and status filtering across all consultations hospital-wide.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router DOM (v6), Axios, Bootstrap 5, React Icons, Context API
- **Backend**: Node.js, Express.js, JWT Authentication (RBAC), bcryptjs, MySQL2
- **Database**: MySQL

---

## 📁 Project Structure

```
doctor-appointment/
├── db/
│   ├── schema.sql             # Unified database schema with seed data
│   ├── upgrade.sql            # Upgrade scripts for billing & prescriptions
│   └── migrations.js          # Node database schema extension script
├── client/
│   ├── src/
│   │   ├── utils/
│   │   │   └── validators.js  # Centralized client-side validation engine
│   │   ├── components/
│   │   │   ├── Navbar.jsx     # Role-aware navigation (Guest, Customer, Doctor, Admin)
│   │   │   ├── Footer.jsx
│   │   │   ├── DoctorCard.jsx # Specialist card with dynamic fee & schedule
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── customer/
│   │   │   │   ├── Home.jsx           # Dynamic specialist directory
│   │   │   │   ├── Login.jsx          # Validated patient login
│   │   │   │   ├── Register.jsx       # Validated patient registration
│   │   │   │   ├── BookAppointment.jsx# Real-time dynamic slot booking
│   │   │   │   ├── MyAppointments.jsx # Cancel, reschedule, view Rx & bill
│   │   │   │   └── CustomerProfile.jsx# Patient medical profile & security
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorLogin.jsx
│   │   │   │   ├── DoctorDashboard.jsx# Clinical workspace (Rx, Tests, Bills)
│   │   │   │   └── DoctorProfile.jsx  # Doctor schedule & fee management
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx     # Administrator login portal
│   │   │       └── AdminDashboard.jsx # Hospital KPIs, doctors CRUD, oversight
├── server/
│   ├── server.js              # Express server with mounted routes
│   ├── middleware/
│   │   ├── auth.js            # RBAC guards: verifyToken, isCustomer, isDoctor, isAdmin
│   │   └── validators.js      # Backend request validation middleware
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── doctorController.js # Includes dynamic slots algorithm
│   │   ├── appointmentController.js # Includes conflict/double-booking checks
│   │   ├── prescriptionController.js
│   │   ├── testController.js
│   │   ├── billController.js
│   │   └── adminController.js # Administrator analytics & doctor management
│   └── routes/
│       ├── customerRoutes.js
│       ├── doctorRoutes.js
│       ├── appointmentRoutes.js
│       ├── prescriptionRoutes.js
│       ├── testRoutes.js
│       ├── billRoutes.js
│       └── adminRoutes.js
```

---

## 🔑 System Credentials

### 1. Hospital Administrator
* **URL**: `http://localhost:3000/admin/login`
* **Email**: `admin@hospital.com`
* **Password**: `admin123`

### 2. Medical Specialists (Doctor Portal)
* **URL**: `http://localhost:3000/doctor/login`

| Doctor Name | Specialization | Visiting Schedule | Email Address | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Arun Kumar** | Cardiologist | Mon, Wed, Fri (09:00 AM - 01:00 PM) | `arun@hospital.com` | `doctor123` |
| **Dr. Priya Sharma** | Dermatologist | Tue, Thu, Sat (02:00 PM - 06:00 PM) | `priya@hospital.com` | `doctor123` |
| **Dr. Rahul Singh** | Orthopedic | Mon, Tue, Thu (10:00 AM - 02:00 PM) | `rahul@hospital.com` | `doctor123` |
| **Dr. Meena Devi** | Pediatrician | Wed, Fri, Sat (09:00 AM - 12:00 PM) | `meena@hospital.com` | `doctor123` |
| **Dr. Karthik Raj** | Neurologist | Mon, Wed, Thu (03:00 PM - 07:00 PM) | `karthik@hospital.com` | `doctor123` |

### 3. Patient Portal
* **URL**: `http://localhost:3000/login` or register a new patient at `http://localhost:3000/register`.

---

## 🚀 Getting Started

### 1. Database Setup
Execute the unified script located at [db/schema.sql](file:///e:/Integfarms/doctor-appointment/db/schema.sql) in your local MySQL instance (port `3307` or `3306`).

### 2. Configure Environment Variables
Verify credentials in [server/.env](file:///e:/Integfarms/doctor-appointment/server/.env):
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=doctor_appointment
JWT_SECRET=supersecretjwttokenkey123!@#
```

### 3. Run Application
From root directory:
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
