USE `doctor_appointment`;

-- 1. Create Prescriptions Table
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

-- 2. Create Prescription Medicines Table
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

-- 3. Create Recommended Tests Table
CREATE TABLE IF NOT EXISTS `recommended_tests` (
  `test_id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `test_name` VARCHAR(100) NOT NULL,
  `test_type` VARCHAR(50) NOT NULL, -- e.g. Laboratory, Scan
  `instructions` TEXT DEFAULT NULL,
  `priority` VARCHAR(50) NOT NULL DEFAULT 'Routine', -- e.g. Routine, High, Urgent
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  INDEX `idx_test_appt` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create Bills Table
CREATE TABLE IF NOT EXISTS `bills` (
  `bill_id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL UNIQUE, -- enforce 1 bill per appointment
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
