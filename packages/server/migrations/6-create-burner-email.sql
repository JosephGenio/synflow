-- UP
CREATE TABLE IF NOT EXISTS "BurnerEmail" (
  "KeyEmail" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "KeyMailbox" UUID NOT NULL REFERENCES "BurnerMailbox"("KeyMailbox") ON DELETE CASCADE,
  "FromAddress" VARCHAR(255) NOT NULL,
  "FromName" VARCHAR(255),
  "Subject" VARCHAR(500),
  "TextBody" TEXT,
  "HtmlBody" TEXT,
  "ReceivedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_burner_email_mailbox ON "BurnerEmail" ("KeyMailbox");

-- DOWN
DROP INDEX IF EXISTS idx_burner_email_mailbox;
DROP TABLE IF EXISTS "BurnerEmail";
