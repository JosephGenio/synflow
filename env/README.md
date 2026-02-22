# Environment Configuration Files

This directory contains environment configuration files for different deployment environments.

## Files

### `.env.example`
**Status:** Committed to Git
**Purpose:** Template for all environment configurations
**Usage:** Copy this file as a base for creating new environment files

```bash
cp env/.env.example env/.env.development
```

### `.env.development`
**Status:** Git-ignored
**Purpose:** Local development environment
**Database Host:** `mssql` (Docker service name)

Used when running:
```bash
docker compose --env-file env/.env.development up
```

### `.env.staging`
**Status:** Git-ignored
**Purpose:** Staging environment configuration
**Database Host:** MSSQL container or cloud database for staging
**Secrets:** Injected via GitHub Actions CI/CD pipeline

Used when deploying to staging:
```bash
docker compose --env-file env/.env.staging up -d
```

### `.env.production`
**Status:** Git-ignored
**Purpose:** Production environment configuration
**Database Host:** Managed database (Azure SQL, AWS RDS, etc.)
**Secrets:** Injected via GitHub Actions and environment variables on production server

Used when deploying to production:
```bash
docker compose --env-file env/.env.production up -d
```

## Setup Instructions

### 1. Development Environment

```bash
# Copy template
cp env/.env.example env/.env.development

# Edit with your local values
# - DB_HOST=mssql (for Docker)
# - DB_PASSWORD=your-local-password
# - JWT_SECRET=your-local-jwt-secret
```

### 2. Staging Environment

```bash
# Copy template
cp env/.env.example env/.env.staging

# Edit with staging values
# - DB_HOST=staging-db-host
# - DB_PASSWORD=staging-password
# - JWT_SECRET=staging-secret

# Or configure GitHub Actions to inject these values
```

### 3. Production Environment

```bash
# Copy template
cp env/.env.example env/.env.production

# IMPORTANT: Never commit .env.production to Git
# Instead:
# 1. Generate secure values locally
# 2. Add to GitHub Actions secrets
# 3. Configure environment variables on production server
```

## Important Security Notes

⚠️ **NEVER commit environment files to Git** (except `.env.example`)

🔐 **Secrets Management:**
- Development: Local file (git-ignored)
- Staging: GitHub Actions secrets → injected at deploy time
- Production: GitHub Actions secrets + environment variables on server

🔄 **Secret Rotation:**
Rotate secrets periodically, especially in production:
- JWT_SECRET: Every 3-6 months
- DB_PASSWORD: Every 6-12 months
- BREVO_API_KEY: As needed or when compromised

## Database Connection

### Development (Docker)
```
DB_HOST=mssql
DB_PORT=1433
DB_USER=sa
```

### Staging/Production
```
DB_HOST=<your-database-host>
DB_PORT=1433 (or cloud-managed port)
DB_USER=<database-user>
```

## Environment Variables Reference

| Variable | Description | Development | Staging | Production |
|----------|-------------|-------------|---------|------------|
| `DB_HOST` | Database server | `mssql` | Cloud/container | Managed DB |
| `DB_PORT` | Database port | 1433 | 1433 or cloud | Cloud |
| `DB_USER` | Database user | `sa` | Custom | Custom |
| `DB_PASSWORD` | Database password | Local | Secrets | Secrets |
| `DB_NAME` | Database name | `synflow` | `synflow_staging` | `synflow` |
| `JWT_SECRET` | JWT signing secret | Local | Secrets | Secrets |
| `BREVO_API_KEY` | Email service key | Dev key | Dev/staging key | Prod key |
| `BREVO_SENDER_EMAIL` | Email sender | Dev email | staging@... | noreply@... |
| `APP_URL` | Application URL | localhost:3000 | staging.com | production.com |
| `PORT` | Backend port | 3001 | 3001 | 3001 |
| `NODE_ENV` | Node environment | development | production | production |

## Troubleshooting

### "env/.env.development not found"
```bash
# Solution: Create from template
cp env/.env.example env/.env.development
```

### Docker fails to start
```bash
# Verify env file is readable
cat env/.env.development

# Check syntax for any special characters
# Ensure no trailing spaces on lines
```

### "Database connection refused"
- Verify `DB_HOST` is correct for your environment
- For Docker: Should be `mssql`
- For cloud: Should be actual hostname
- Check `DB_PASSWORD` matches database configuration

## See Also

- [CLAUDE.md](../CLAUDE.md) — Development commands
- [README.md](../README.md) — Project overview
- [Plan file](../.claude/plans/) — Docker implementation plan
