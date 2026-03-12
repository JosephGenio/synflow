-- UP
CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "KeyPasswordReset" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "KeyUser" UUID NOT NULL REFERENCES "User"("KeyUser") ON DELETE CASCADE,
  "ResetToken" UUID DEFAULT gen_random_uuid(),
  "TokenExpiresAt" TIMESTAMP NOT NULL,
  "IsUsed" BOOLEAN DEFAULT FALSE
);

-- DOWN
DROP TABLE IF EXISTS "PasswordReset";
