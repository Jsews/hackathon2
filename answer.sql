CREATE DATABASE IF NOT EXISTS foodlink;
USE foodlink;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(191) UNIQUE,
  role ENUM('buyer','seller','courier','ngo','admin') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  category VARCHAR(80),
  photo_url TEXT,
  portions INT DEFAULT 1,
  price_cents INT DEFAULT 0,
  dietary JSON NULL,
  expires_at DATETIME NULL,
  pickup_window_start DATETIME NULL,
  pickup_window_end DATETIME NULL,
  status ENUM('active','reserved','completed','expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed a few items so backend returns something
INSERT INTO items (title,category,photo_url,portions,price_cents)
VALUES
('10 Chicken Rice Boxes','cooked','https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=1000&auto=format&fit=crop',10,50000),
('Fresh Bakery Packs','bakery','https://images.unsplash.com/photo-1509440159598-2dca6c81eb68?q=80&w=1000&auto=format&fit=crop',8,0),
('Vegetable Mix Boxes','produce','https://images.unsplash.com/photo-1604908176997-51f6b6a3e57f?q=80&w=1000&auto=format&fit=crop',5,20000);
