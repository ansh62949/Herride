-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    profile_photo_url VARCHAR(512),
    refresh_token VARCHAR(512),
    gender VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create rider_profiles table
CREATE TABLE rider_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rating DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_trips INTEGER NOT NULL DEFAULT 0,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    home_address VARCHAR(512),
    work_address VARCHAR(512),
    safety_score DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create driver_profiles table
CREATE TABLE driver_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_make VARCHAR(255) NOT NULL,
    vehicle_model VARCHAR(255) NOT NULL,
    vehicle_year VARCHAR(50) NOT NULL,
    plate_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_color VARCHAR(50),
    license_number VARCHAR(100),
    license_photo_url VARCHAR(512),
    vehicle_photo_url VARCHAR(512),
    driver_status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rating DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_trips INTEGER NOT NULL DEFAULT 0,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    total_earnings DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    acceptance_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    idle_since TIMESTAMP,
    safety_score DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trips table
CREATE TABLE trips (
    id BIGSERIAL PRIMARY KEY,
    rider_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    driver_id BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    pickup_address VARCHAR(512) NOT NULL,
    destination_latitude DOUBLE PRECISION NOT NULL,
    destination_longitude DOUBLE PRECISION NOT NULL,
    destination_address VARCHAR(512) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    cancellation_reason VARCHAR(50),
    cancellation_note VARCHAR(512),
    vehicle_type VARCHAR(50),
    estimated_fare DOUBLE PRECISION,
    actual_fare DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    driver_earnings DOUBLE PRECISION,
    platform_fee DOUBLE PRECISION,
    surge_applied BOOLEAN,
    surge_multiplier DOUBLE PRECISION,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    paystack_reference VARCHAR(255),
    rider_rating INTEGER,
    driver_rating INTEGER,
    rider_review VARCHAR(512),
    driver_review VARCHAR(512),
    accepted_at TIMESTAMP,
    driver_en_route_at TIMESTAMP,
    arrived_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    ride_type VARCHAR(50) NOT NULL DEFAULT 'INSTANT',
    scheduled_pickup_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    rider_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reference VARCHAR(255) NOT NULL UNIQUE,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    paystack_access_code VARCHAR(255),
    authorization_url VARCHAR(512),
    channel VARCHAR(50),
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trusted_contacts table
CREATE TABLE trusted_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create sos_alerts table
CREATE TABLE sos_alerts (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES trips(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_reports table
CREATE TABLE incident_reports (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ride_sharing_tokens table
CREATE TABLE ride_sharing_tokens (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create safety_checkins table
CREATE TABLE safety_checkins (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create optimized database indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_status ON driver_profiles(driver_status, verification_status);
CREATE INDEX idx_rider_profiles_user_id ON rider_profiles(user_id);
CREATE INDEX idx_trips_rider_id ON trips(rider_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_payments_trip_id ON payments(trip_id);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);
CREATE INDEX idx_sos_alerts_ride_id ON sos_alerts(ride_id);
CREATE INDEX idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX idx_incident_reports_ride_id ON incident_reports(ride_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_safety_checkins_trip_id ON safety_checkins(trip_id);
CREATE INDEX idx_safety_checkins_status ON safety_checkins(status);
CREATE INDEX idx_ride_sharing_tokens_token ON ride_sharing_tokens(token);
