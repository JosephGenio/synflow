-- UP
CREATE TABLE IF NOT EXISTS "BurnerMailbox" (
  "KeyMailbox" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Address" VARCHAR(255) NOT NULL UNIQUE,
  "SessionToken" UUID NOT NULL DEFAULT gen_random_uuid(),
  "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ExpiresAt" TIMESTAMPTZ NOT NULL,
  "IsExpired" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_burner_mailbox_address ON "BurnerMailbox" ("Address");
CREATE INDEX idx_burner_mailbox_session ON "BurnerMailbox" ("SessionToken");
CREATE INDEX idx_burner_mailbox_expires ON "BurnerMailbox" ("ExpiresAt") WHERE "IsExpired" = FALSE;

-- DOWN
DROP INDEX IF EXISTS idx_burner_mailbox_expires;
DROP INDEX IF EXISTS idx_burner_mailbox_session;
DROP INDEX IF EXISTS idx_burner_mailbox_address;
DROP TABLE IF EXISTS "BurnerMailbox";
