-- Drop database if exists to ensure a clean state
DROP DATABASE IF EXISTS `doctor_appointment`;
CREATE DATABASE `doctor_appointment`;
USE `doctor_appointment`;

-- 1. Create Doctors Table
CREATE TABLE IF NOT EXISTS `doctors` (
  `doctor_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL,
  `experience` INT NOT NULL,
  `available_days` VARCHAR(255) NOT NULL,
  `available_time` VARCHAR(100) NOT NULL,
  `photo` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create Appointments Table
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
  `status` ENUM('Pending', 'Accepted', 'Rejected', 'Completed') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Seed sample doctors (default password for all: doctor123)
-- The password hash was generated using bcrypt with 10 salt rounds: $2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.
INSERT INTO `doctors` (`doctor_id`, `name`, `specialization`, `experience`, `available_days`, `available_time`, `photo`, `email`, `password`) VALUES
(1, 'Dr. Arun Kumar', 'Cardiologist', 12, 'Monday, Wednesday, Friday', '09:00 AM - 01:00 PM', 'dr_arun.jpg', 'arun@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(2, 'Dr. Priya Sharma', 'Dermatologist', 8, 'Tuesday, Thursday, Saturday', '02:00 PM - 06:00 PM', 'dr_priya.jpg', 'priya@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(3, 'Dr. Rahul Singh', 'Orthopedic', 15, 'Monday, Tuesday, Thursday', '10:00 AM - 02:00 PM', 'dr_rahul.jpg', 'rahul@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(4, 'Dr. Meena Devi', 'Pediatrician', 10, 'Wednesday, Friday, Saturday', '09:00 AM - 12:00 PM', 'dr_meena.jpg', 'meena@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.'),
(5, 'Dr. Karthik Raj', 'Neurologist', 18, 'Monday, Wednesday, Thursday', '03:00 PM - 07:00 PM', 'dr_karthik.jpg', 'karthik@hospital.com', '$2a$10$doVHcArbXFD3lYy7A6qTDe.m6ES4C5rpYcKH8lFV3kp12jOwRqvS.')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
