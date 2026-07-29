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

### 🩺 Doctor Module
- **Clinician Secure Login**: Login with pre-seeded doctor credentials.
- **Analytics Dashboard**: Live key performance indicators: *Total Appointments*, *Today's Appointments*, and *Upcoming Wards*.
- **Patient Roster Management**: Display patient details, phone number, email, date, time slot, and reason/symptoms.
- **Schedule Controls**: Change booking status: **Accept**, **Reject**, or **Mark Completed**.

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
│   └── schema.sql             # Database creation and seed scripts
├── client/
│   ├── vite.config.js         # API proxy configuration
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css          # Design system stylesheet
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
│   │   └── appointmentController.js
│   └── routes/                # Route definitions
│       ├── customerRoutes.js
│       ├── doctorRoutes.js
│       └── appointmentRoutes.js
└── package.json               # Root package to launch concurrently
```

---

## 💾 Database Configuration

The system uses a MySQL database. Follow these steps to configure:

1. Start your local MySQL Server (e.g. XAMPP, WampServer, or native MySQL installation).
2. Connect to MySQL via command line or tools like phpMyAdmin / MySQL Workbench.
3. Import and execute the SQL script located at:
   [doctor-appointment/db/schema.sql](file:///e:/Integfarms/doctor-appointment/db/schema.sql)
   
   This script will automatically create the `doctor_appointment` database, define the necessary tables, establish foreign key relationships, and seed the 5 sample doctors.

---

## 🚀 Getting Started

### 1. Configure the Backend Environment
Open [server/.env](file:///e:/Integfarms/doctor-appointment/server/.env) and update the database credentials to match your local setup:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doctor_appointment
JWT_SECRET=supersecretjwttokenkey123!@#
```

### 2. Install Dependencies
Run the install command from the **root directory** of the project:
```bash
npm run install-all
```
*This command will install packages at the root, inside the `client` folder, and inside the `server` folder.*

### 3. Run the Project
Start both the React frontend and Node.js backend concurrently:
```bash
npm run dev
```
- **React Frontend**: Runs on `http://localhost:3000`
- **Express Backend**: Runs on `http://localhost:5000`

---

## 🔑 Testing Credentials

The database script seeds exactly 5 doctors. Use the following credentials to access the Doctor Portal:

| Doctor Name | Specialization | Email Address | Password (All Doctors) |
| :--- | :--- | :--- | :--- |
| **Dr. Arun Kumar** | Cardiologist | `arun@hospital.com` | `doctor123` |
| **Dr. Priya Sharma** | Dermatologist | `priya@hospital.com` | `doctor123` |
| **Dr. Rahul Singh** | Orthopedic | `rahul@hospital.com` | `doctor123` |
| **Dr. Meena Devi** | Pediatrician | `meena@hospital.com` | `doctor123` |
| **Dr. Karthik Raj** | Neurologist | `karthik@hospital.com` | `doctor123` |

### Testing as a Patient:
1. Navigate to `http://localhost:3000/register` to create a new patient account.
2. Log in using your new credentials.
3. Browse and filter the 5 doctor cards, book appointments, and check their real-time statuses in the "My Appointments" panel.
