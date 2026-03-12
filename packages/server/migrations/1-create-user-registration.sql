-- UP
CREATE TABLE IF NOT EXISTS "UserRegistration" (
  "KeyUserRegistration" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "First" VARCHAR(50) NOT NULL,
  "Middle" VARCHAR(50) NOT NULL,
  "Last" VARCHAR(50) NOT NULL,
  "Email" VARCHAR(100) NOT NULL UNIQUE,
  "ContactNumber" VARCHAR(13) NOT NULL,
  "VerificationToken" UUID DEFAULT gen_random_uuid(),
  "IsVerified" BOOLEAN DEFAULT FALSE,
  "PasswordHash" VARCHAR(255),
  "TokenExpiresAt" TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS "UserRegistration";
