-- Drop existing constraint and recreate with 'doctor' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_ambulance_role;

ALTER TABLE users ADD CONSTRAINT chk_users_ambulance_role 
    CHECK (ambulance_role IS NULL OR ambulance_role IN ('operator', 'doctor', 'supervisor', 'admin'));
