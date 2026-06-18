-- Add gateway_response column to payments table
ALTER TABLE payments ADD COLUMN gateway_response VARCHAR(255);
