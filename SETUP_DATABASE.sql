-- Pharmacy POS System - Database Setup Script
-- Run this in MySQL Command Line or MySQL Workbench

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS pharmacy_pos;
USE pharmacy_pos;

-- Step 2: The tables will be created automatically by Sequelize
-- But here are the expected table structures for reference:

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'sales',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  expiry_date DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Step 3: Insert test data (optional)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@pharmacy.com', '$2a$10$...', 'admin'),
('Sales User', 'sales@pharmacy.com', '$2a$10$...', 'sales');

-- Step 4: Verify the setup
SHOW DATABASES;
USE pharmacy_pos;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM sales;

-- Done! Database is ready for the application.
