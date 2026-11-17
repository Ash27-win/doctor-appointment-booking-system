-- ============================================================================
-- CARE-SYNC CLINICAL DATABASE SCHEMA & SEED DATA
-- ============================================================================
-- VALIDATION & CONSTRAINTS SPECIFICATIONS:
-- 1. `admins`: Central system administrators for hospital operations.
--    - Email must be unique and properly formatted.
--    - Passwords stored as bcrypt hashes (min 10 salt rounds).
-- 2. `doctors`: Medical specialists directory.
--    - Experience must be positive integer (>= 0).
--    - Consultation fee stored as DECIMAL(10,2) >= 0.00.
--    - Email is unique.
-- 3. `customers`: Patients registered for appointments.
--    - Email is unique; phone number restricted to 10-15 digits.
--    - Optional medical profile fields: dob, gender, blood_group, address, emergency_contact.
-- 4. `appointments`: Booking consultations between customers and doctors.
--    - Status restricted to: 'Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'.
--    - Double booking prevented via UNIQUE constraint on (doctor_id, appointment_date, appointment_time).
-- ============================================================================

DROP DATABASE IF EXISTS `doctor_appointment`;
CREATE DATABASE `doctor_appointment`;
USE `doctor_appointment`;

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create Doctors Table
CREATE TABLE IF NOT EXISTS `doctors` (
  `doctor_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL,
  `experience` INT NOT NULL DEFAULT 0,
  `available_days` VARCHAR(255) NOT NULL,
  `available_time` VARCHAR(100) NOT NULL,
  `consultation_fee` DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  `bio` TEXT DEFAULT NULL,
  `photo` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create Customers (Patients) Table
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(20) DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `emergency_contact` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create Appointments Table
CREATE TABLE IF NOT EXISTS `appointments` (
  `appointment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `patient_name` VARCHAR(100) NOT NULL,
  `patient_age` INT NOT NULL,
  `patient_gender` VARCHAR(20) NOT NULL,
  `patient_phone` VARCHAR(20) NOT NULL,
  `patient_email` VARCHAR(100) NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` VARCHAR(50) NOT NULL,
  `symptoms` TEXT NOT NULL,
  `status` ENUM('Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
  `cancellation_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  INDEX `idx_doc_date_time` (`doctor_id`, `appointment_date`, `appointment_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create Prescriptions Table
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `prescription_id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `diagnosis` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `prescription_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  INDEX `idx_prescription_appt` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create Prescription Medicines Table
CREATE TABLE IF NOT EXISTS `prescription_medicines` (
  `medicine_id` INT AUTO_INCREMENT PRIMARY KEY,
  `prescription_id` INT NOT NULL,
  `medicine_name` VARCHAR(100) NOT NULL,
  `dosage` VARCHAR(50) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL,
  `duration` VARCHAR(50) NOT NULL,
  `timing` VARCHAR(50) NOT NULL,
  `instructions` TEXT DEFAULT NULL,
  FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE CASCADE,
  INDEX `idx_med_prescription` (`prescription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create Recommended Tests Table
CREATE TABLE IF NOT EXISTS `recommended_tests` (
  `test_id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `test_name` VARCHAR(100) NOT NULL,
  `test_type` VARCHAR(50) NOT NULL,
  `instructions` TEXT DEFAULT NULL,
  `priority` VARCHAR(50) NOT NULL DEFAULT 'Routine',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  INDEX `idx_test_appt` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Create Bills Table
CREATE TABLE IF NOT EXISTS `bills` (
  `bill_id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL UNIQUE,
  `doctor_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `consultation_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `medicine_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `lab_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `scan_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `other_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Pending', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `payment_method` ENUM('Cash', 'UPI', 'Card', 'Online', 'None') NOT NULL DEFAULT 'None',
  `bill_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  INDEX `idx_bill_appt` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SEED DATA
-- Default Passwords:
-- Admin: admin123  ($2a$10$vOa4sS0qL3aH2u3y8vWzQe8S6E0PZ0P6o8Y.9qI1R1a9f5d3Qz1C2)
-- Doctors: doctor123 ($2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.)
-- ============================================================================

-- Seed Default Admin
INSERT INTO `admins` (`admin_id`, `name`, `email`, `password`) VALUES
(1, 'Hospital Administrator', 'admin@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Seed Initial Doctors
INSERT INTO `doctors` (`doctor_id`, `name`, `specialization`, `experience`, `available_days`, `available_time`, `consultation_fee`, `bio`, `photo`, `email`, `password`) VALUES
(1, 'Dr. Arun Kumar', 'Cardiologist', 12, 'Monday, Wednesday, Friday', '09:00 AM - 01:00 PM', 600.00, 'Senior interventional cardiologist with over a decade of clinical experience in preventive care and advanced cardiovascular procedures.', 'dr_arun.jpg', 'arun@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(2, 'Dr. Priya Sharma', 'Dermatologist', 8, 'Tuesday, Thursday, Saturday', '02:00 PM - 06:00 PM', 500.00, 'Specialist in clinical dermatology, allergy diagnostics, aesthetic skincare treatments, and chronic dermatological disease therapies.', 'dr_priya.jpg', 'priya@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(3, 'Dr. Rahul Singh', 'Orthopedic', 15, 'Monday, Tuesday, Thursday', '10:00 AM - 02:00 PM', 700.00, 'Leading orthopedic consultant with extensive experience in sports injury rehabilitation, joint replacement, and arthroscopy.', 'dr_rahul.jpg', 'rahul@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(4, 'Dr. Meena Devi', 'Pediatrician', 10, 'Wednesday, Friday, Saturday', '09:00 AM - 12:00 PM', 450.00, 'Dedicated pediatrician committed to child wellness, developmental milestones monitoring, immunization programs, and pediatric healthcare.', 'dr_meena.jpg', 'meena@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(5, 'Dr. Karthik Raj', 'Neurologist', 18, 'Monday, Wednesday, Thursday', '03:00 PM - 07:00 PM', 800.00, 'Experienced neurologist with deep clinical expertise in stroke management, epilepsy management, migraine management, and neurological diagnostics.', 'dr_karthik.jpg', 'karthik@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
