INSERT INTO users (first_name, last_name, email, phone, password, role, status, gender)
SELECT 'Admin', 'HerRide', 'admin@herride.com', '+919999999999', '$2a$10$UIr1HhX1F2Q4e.2M2c2YI.tVpC6Qh2S7qgG1sD/3g5M2f7mKz72Ea', 'ADMIN', 'ACTIVE', 'FEMALE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@herride.com' OR phone = '+919999999999');
