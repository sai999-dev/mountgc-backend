-- Create admin_otp table for OTP-based authentication
CREATE TABLE IF NOT EXISTS admin_otp (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_admin_otp_email ON admin_otp(email);
CREATE INDEX idx_admin_otp_code ON admin_otp(otp_code);
CREATE INDEX idx_admin_otp_expires ON admin_otp(expires_at);

-- Add comment
COMMENT ON TABLE admin_otp IS 'Stores OTP codes for admin authentication';
