-- Change default currency for payments to INR
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE payments SET currency = 'INR' WHERE currency = 'NGN';
