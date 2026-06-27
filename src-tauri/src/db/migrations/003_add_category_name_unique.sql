-- Add unique constraint on category name to prevent duplicates
-- Use IF NOT EXISTS approach to handle cases where constraint might already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
    END IF;
END $$;
