-- Seed Driver User
INSERT INTO users (first_name, last_name, email, phone, password, role, status, gender)
SELECT 'Priya', 'Sharma', 'driver@herride.com', '+919876543210', '$2a$10$UIr1HhX1F2Q4e.2M2c2YI.tVpC6Qh2S7qgG1sD/3g5M2f7mKz72Ea', 'DRIVER', 'ACTIVE', 'FEMALE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver@herride.com' OR phone = '+919876543210');

-- Seed Driver Profile
INSERT INTO driver_profiles (user_id, vehicle_type, vehicle_make, vehicle_model, vehicle_year, plate_number, vehicle_color, license_number, driver_status, verification_status, rating, total_trips, total_earnings, acceptance_rate, safety_score)
SELECT u.id, 'SEDAN', 'Maruti Suzuki', 'Swift Dzire', '2022', 'DL01AB1234', 'White', 'DL1420220001234', 'ONLINE', 'VERIFIED', 4.95, 120, 0.0, 100.0, 100.0
FROM users u
WHERE u.email = 'driver@herride.com'
AND NOT EXISTS (SELECT 1 FROM driver_profiles dp JOIN users usr ON dp.user_id = usr.id WHERE usr.email = 'driver@herride.com');
