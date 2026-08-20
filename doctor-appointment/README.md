# CareSync - Doctor Appointment Booking System

CareSync is a modern, responsive, full-stack doctor appointment booking platform designed for healthcare clinics. It allows patients to search/filter specialists and schedule consultations, and provides clinicians with a portal to view schedules and manage bookings.

---

## 🌟 Key Features

### 👤 Customer (Patient) Module
- **Healthcare Landing Page**: Professional theme with details on services and verified experts.
- **Search & Filters**: Search doctors by name or filter dynamically by specialization.
- **Patient Registration & JWT Authentication**: Sign up and log in securely.
- **Consultation Booking Form**: Automatically pre-fills patient details, validates input, restricts date options to the future, and sends slots directly to the backend.
- **Appointment Registry**: View appointments with live statuses (Pending, Accepted, Rejected, Completed).
- **NEW: View & Print Prescription**: Once a doctor saves a prescription, patients can view a detailed prescription layout and print it.
- **NEW: View & Print Invoice**: Once a doctor generates a bill, patients can view the full cost breakdown and payment status, and print a formatted invoice.

### 🩺 Doctor Module
- **Clinician Secure Login**: Login with pre-seeded doctor credentials.
- **Analytics Dashboard**: Live key performance indicators: *Total Appointments*, *Today's Appointments*, and *Upcoming Wards*.
- **Patient Workspace**: Open any patient file directly to transition statuses or access the clinical workspace.
- **NEW: Write Prescriptions**: Form to add diagnosis and compile a list of multiple medicines dynamically (name, dosage, frequency, duration, timing, instructions).
- **NEW: Recommend Lab Tests / Scans**: Order laboratory tests (e.g. CBC, Blood Sugar) or scans (e.g. MRI, CT Scan) with priority and instructions.
- **NEW: Generate Billing Receipts**: Automatic calculator to record Consultation fee, Medicine charges, Lab charges, Scan charges, and Other charges, minus discounts, plus tax. Updates payment status (Pending, Paid, Cancelled) and method (Cash, UPI, Card, Online).

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router DOM (v6), Axios, Bootstrap 5, React Icons, Context API
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs, MySQL2
- **Database**: MySQL

---

## 📁 Project Structure

```
doctor-appointment/
├── db/
│   ├── schema.sql             # Database creation and seed scripts
│   └── upgrade.sql            # NEW: Database upgrade scripts for prescriptions & billing
├── client/
│   ├── vite.config.js         # API proxy configuration
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css          # Design system and @media print stylesheet
│       ├── components/        # Reusable presentation parts
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── DoctorCard.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/             # Layout view managers
│       │   ├── NotFound.jsx
│       │   ├── customer/
│       │   │   ├── Home.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── BookAppointment.jsx
│       │   │   └── MyAppointments.jsx
│       │   └── doctor/
│       │       ├── DoctorLogin.jsx
│       │       └── DoctorDashboard.jsx
│       ├── services/
│       │   └── api.js         # Pre-configured Axios instance
│       └── context/
│           ├── AuthContext.jsx
│           └── ToastContext.jsx
├── server/
│   ├── server.js              # Entrypoint Express server
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── config/
│   │   └── db.js              # MySQL Connection Pool
│   ├── middleware/
│   │   └── auth.js            # JWT Validation and Role Verification
│   ├── controllers/           # MVC Logic handlers
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   ├── prescriptionController.js  # NEW: Prescription actions
│   │   ├── testController.js          # NEW: Laboratory/Scan recommendations
│   │   └── billController.js          # NEW: Billing operations
│   └── routes/                # Route definitions
│       ├── customerRoutes.js
│       ├── doctorRoutes.js
│       ├── appointmentRoutes.js
│       ├── prescriptionRoutes.js      # NEW: Prescription API routes
│       ├── testRoutes.js              # NEW: Test API routes
│       └── billRoutes.js              # NEW: Billing API routes
└── package.json               # Root package to launch concurrently
```

---

## 💾 Database Configuration

The system uses a MySQL database. Follow these steps to configure:

### Initial Setup
1. Start your local MySQL Server.
2. Connect to MySQL via command line or MySQL Workbench on port `3307` (or your configured port).
3. Import and execute the SQL script located at:
   [db/schema.sql](file:///e:/Integfarms/doctor-appointment/db/schema.sql)

### Database Upgrade (New Features)
To add prescriptions, medicines, tests, and billing systems to an existing database, run the following upgrade script:
[db/upgrade.sql](file:///e:/Integfarms/doctor-appointment/db/upgrade.sql)

Alternatively, you can run the automated script from the `server/` directory:
```bash
node import.js  # to reset and seed the base schema
# database upgrade is applied automatically via server configurations.
```

---

## 🚀 Getting Started

### 1. Configure the Backend Environment
Open [server/.env](file:///e:/Integfarms/doctor-appointment/server/.env) and update the database credentials to match your local setup:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=doctor_appointment
JWT_SECRET=supersecretjwttokenkey123!@#
```

### 2. Install Dependencies
Run the install command from the **root directory** of the project:
```bash
npm run install-all
```

### 3. Run the Project
Start both the React frontend and Node.js backend concurrently:
```bash
npm run dev
```
- **React Frontend**: Runs on `http://localhost:3000`
- **Express Backend**: Runs on `http://localhost:5000`

---

## 🔑 New Backend APIs

### 📝 Prescriptions
* `POST /api/prescriptions` - Create a prescription (Doctor only, checks ownership)
* `GET /api/prescriptions/appointment/:appointmentId` - Get prescription + medicines (Doctor & Patient)
* `PUT /api/prescriptions/:id` - Update prescription (Doctor only)

### 🔬 Recommended Tests
* `POST /api/tests` - Add a lab test or scan recommendation (Doctor only)
* `GET /api/tests/appointment/:appointmentId` - Fetch recommendations (Doctor & Patient)
* `PUT /api/tests/:id` - Edit test details (Doctor only)
* `DELETE /api/tests/:id` - Remove test recommendation (Doctor only)

### 💵 Billing
* `POST /api/bills` - Generate and save a bill (Doctor only)
* `GET /api/bills/appointment/:appointmentId` - Retrieve bill details (Doctor & Patient)
* `PUT /api/bills/:id` - Edit bill details (Doctor only)

---

## 🔑 Testing Credentials

Use the following credentials to access the Doctor Portal:

| Doctor Name | Specialization | Email Address | Password (All Doctors) |
| :--- | :--- | :--- | :--- |
| **Dr. Arun Kumar** | Cardiologist | `arun@hospital.com` | `doctor123` |
| **Dr. Priya Sharma** | Dermatologist | `priya@hospital.com` | `doctor123` |
| **Dr. Rahul Singh** | Orthopedic | `rahul@hospital.com` | `doctor123` |
| **Dr. Meena Devi** | Pediatrician | `meena@hospital.com` | `doctor123` |
| **Dr. Karthik Raj** | Neurologist | `karthik@hospital.com` | `doctor123` |

### Testing Prescription & Billing Flow:
1. Log in as a patient on `http://localhost:3000/login` (or register a new patient) and book an appointment with a doctor.
2. Log in as the corresponding doctor on `http://localhost:3000/doctor/login`.
3. Open the active appointment in the dashboard patient list by clicking **Open File**.
4. Change the status to **Accepted**, then **Completed**.
5. Select the **Prescription** tab, write a diagnosis, add 2 medicines, and click **Save Prescription**. Click **Print Rx** to verify layout.
6. Select **Recommended Tests** tab, add a scan and laboratory test, and click **Recommend Test**.
7. Select **Billing** tab, fill out charges (Consultation, Medicine, Lab, Scan), set payment status to **Paid**, method to **UPI**, and click **Save Bill**.
8. Log in as the patient, navigate to **My Appointments**, and check the status. You will now see **View Prescription** and **View Bill** buttons.
9. Click them to inspect details and print the documents.
