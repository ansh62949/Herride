-- Change paid_at column type to VARCHAR to match the Payment entity's String field
ALTER TABLE payments ALTER COLUMN paid_at TYPE VARCHAR(255);
