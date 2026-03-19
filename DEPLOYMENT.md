# Synflo Deployment Guide

Complete step-by-step guide for deploying Synflo across **staging** and **production** environments.

## Architecture Overview

| Component | Staging | Production |
|-----------|---------|------------|
| Frontend | Vercel — `staging.synflo.space` | Vercel — `synflo.space` |
| Backend API | Oracle Cloud VM (Docker) — `api-staging.synflo.space` | Oracle Cloud VM (Docker) — `api.synflo.space` |
| Database | PostgreSQL 16 (Docker on same VM) | PostgreSQL 16 (Docker on same VM) |
| CI/CD | GitHub Actions on push to `staging` branch | GitHub Actions on push to `master` branch |

> **Where to run commands:** All commands run on the **Oracle VM** unless marked with **`[LOCAL]`**, **`[OCI CONSOLE]`**, **`[VERCEL]`**, **`[GITHUB]`**, or **`[DNS PROVIDER]`**.

---

## Table of Contents

1. [Environment Summary](#1-environment-summary)
2. [Prerequisites](#2-prerequisites)
3. [Oracle Cloud VM Setup](#3-oracle-cloud-vm-setup)
4. [SSH Into the VM](#4-ssh-into-the-vm)
5. [Create a Deploy User](#5-create-a-deploy-user)
6. [Install System Dependencies](#6-install-system-dependencies)
7. [Configure Firewall Rules](#7-configure-firewall-rules)
8. [Clone the Repository](#8-clone-the-repository)
9. [Create Environment Files](#9-create-environment-files)
10. [Deploy with Docker Compose](#10-deploy-with-docker-compose)
11. [Verify the Deployment](#11-verify-the-deployment)
12. [Set Up Nginx Reverse Proxy](#12-set-up-nginx-reverse-proxy)
13. [SSL with Let's Encrypt](#13-ssl-with-lets-encrypt)
14. [DNS Configuration](#14-dns-configuration)
15. [Frontend on Vercel](#15-frontend-on-vercel)
16. [GitHub Actions CI/CD](#16-github-actions-cicd)
17. [Database Backups](#17-database-backups)
18. [Monitoring and Maintenance](#18-monitoring-and-maintenance)
19. [Non-Docker Deployment (Alternative)](#19-non-docker-deployment-alternative)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Environment Summary

### Domains

| Environment | Frontend | Backend API | Git Branch |
|-------------|----------|-------------|------------|
| Development | `localhost:3000` | `localhost:3001` | feature branches |
| Staging | `staging.synflo.space` | `api-staging.synflo.space` | `staging` |
| Production | `synflo.space` | `api.synflo.space` | `master` |

### Environment Variables by Environment

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `APP_URL` | `http://localhost:3000` | `https://staging.synflo.space` | `https://synflo.space` |
| `VITE_API_URL` | _(empty — Vite proxy)_ | `https://api-staging.synflo.space` | `https://api.synflo.space` |
| `NODE_ENV` | `development` | `production` | `production` |
| `DB_NAME` | `synflow` | `synflow_staging` | `synflow` |
| `DB_HOST` | `localhost` | `postgres` (Docker) | `postgres` (Docker) |

### Docker Resources by Environment

| Resource | Staging | Production |
|----------|---------|------------|
| Compose file | `docker-compose.staging.yml` | `docker-compose.production.yml` |
| Env file | `env/.env.staging` | `env/.env.production` |
| Backend container | `synflow-backend-staging` | `synflow-backend-production` |
| Postgres container | `synflow-postgres-staging` | `synflow-postgres-production` |
| Volume | `postgres-staging-data` | `postgres-production-data` |
| Network | `synflow-staging-network` | `synflow-production-network` |

### Vercel Projects

| Environment | Vercel Project | Domain | `VITE_API_URL` |
|-------------|---------------|--------|----------------|
| Staging | synflo-staging | `staging.synflo.space` | `https://api-staging.synflo.space` |
| Production | synflo | `synflo.space` | `https://api.synflo.space` |

---

## 2. Prerequisites

Before starting, ensure you have:

- [ ] An [Oracle Cloud](https://cloud.oracle.com/) account (Always Free tier works)
- [ ] An SSH key pair generated on your local machine
- [ ] A domain name (`synflo.space`) with DNS access
- [ ] A [Brevo](https://www.brevo.com/) account with an API key
- [ ] A [Vercel](https://vercel.com/) account
- [ ] Git installed on your local machine

### Required Versions

| Tool | Version |
|------|---------|
| Node.js | 24 (LTS) |
| pnpm | 8+ |
| Docker | 24+ |
| Docker Compose | v2+ |
| PostgreSQL | 16 (runs inside Docker) |

---

## 3. Oracle Cloud VM Setup

**`[OCI CONSOLE]`**

### 3.1 Create a Compute Instance

1. Log in to the [OCI Console](https://cloud.oracle.com/)
2. Navigate to **Compute > Instances > Create Instance**
3. Configure the instance:

| Setting | Value |
|---------|-------|
| Name | `synflow-vm` |
| Compartment | Your compartment |
| Image | **Ubuntu 22.04** (Canonical) |
| Shape | `VM.Standard.A1.Flex` (ARM — Always Free eligible) |
| OCPUs | 2 |
| Memory | 12 GB |
| Boot Volume | 50 GB (up to 200 GB on Always Free) |

4. Under **Networking**, ensure:
   - A VCN (Virtual Cloud Network) is selected or created
   - A public subnet is assigned
   - "Assign a public IPv4 address" is checked

5. Under **Add SSH keys**:
   - Upload your public key (`~/.ssh/id_rsa.pub`) or paste it

6. Click **Create** and wait for the instance to be in **RUNNING** state

### 3.2 Note Your Public IP

Once the instance is running, copy the **Public IP Address** from the instance details page. You will need this for SSH, DNS, and CI/CD configuration.

> **Note:** Both staging and production can run on the same VM. They use separate Docker containers, volumes, and networks, so they are fully isolated.

---

## 4. SSH Into the VM

**`[LOCAL]`**

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<YOUR_VM_PUBLIC_IP>
```

> **Tip:** Add this to your `~/.ssh/config` for convenience:
> ```
> Host synflow-vm
>     HostName <YOUR_VM_PUBLIC_IP>
>     User ubuntu
>     IdentityFile ~/.ssh/id_rsa
> ```
> Then connect with: `ssh synflow-vm`

---

## 5. Create a Deploy User

### 5.1 Create the User

Run as `ubuntu`:

```bash
# Create the deploy user with a home directory
sudo adduser --disabled-password --gecos "Deploy User" deploy

# Add deploy user to the docker group and sudo group
sudo usermod -aG docker,sudo deploy

# Allow deploy user to run sudo without password
echo "deploy ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/deploy
```

### 5.2 Set Up SSH Access for the Deploy User

```bash
# Create .ssh directory for the deploy user
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

# Copy your authorized key (so you can SSH in as deploy)
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### 5.3 Generate a Deploy Key for GitHub Actions

```bash
# Switch to the deploy user
sudo su - deploy

# Generate an SSH key pair for CI/CD
ssh-keygen -t ed25519 -C "synflow-deploy" -f ~/.ssh/deploy_key -N ""

# Display the public key — add this to GitHub > Repo > Settings > Deploy Keys
cat ~/.ssh/deploy_key.pub

# Display the private key — add this as a GitHub Actions secret
cat ~/.ssh/deploy_key

# Configure SSH to use deploy key for GitHub
cat >> ~/.ssh/config << 'EOF'
Host github.com
    IdentityFile ~/.ssh/deploy_key
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config

# Exit back to ubuntu user
exit
```

### 5.4 Verify SSH Access

**`[LOCAL]`** Verify you can connect as the `deploy` user:

```bash
ssh -i ~/.ssh/id_rsa deploy@<YOUR_VM_PUBLIC_IP>
```

> **From this point forward, all VM commands run as `deploy`** unless noted otherwise.

---

## 6. Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg git

# Install Docker (official method)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 7. Configure Firewall Rules

Oracle Cloud requires firewall rules at **two levels**: the OCI Security List (cloud-level) and the OS-level firewall (iptables/ufw). You must configure both.

### 7.1 OCI Security List

**`[OCI CONSOLE]`**

1. Go to **Networking > Virtual Cloud Networks**
2. Click on your VCN, then your **Public Subnet**
3. Click the **Security List** (usually "Default Security List")
4. Add the following **Ingress Rules**:

| Source CIDR | Protocol | Dest Port | Description |
|-------------|----------|-----------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

> Do **not** expose port 3001 directly. Nginx will reverse-proxy traffic from 80/443 to 3001.

### 7.2 OS-Level Firewall (iptables + ufw)

Oracle Cloud Ubuntu VMs often have iptables rules that block ports 80/443 by default even if the OCI Security List allows them. You need to handle both iptables and ufw.

#### Check and fix iptables

```bash
# Check if iptables is blocking traffic
sudo iptables -L -n

# If you see DROP rules blocking 80/443, open them
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save the rules so they persist across reboots
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

#### Configure ufw

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 8. Clone the Repository

```bash
cd ~
git clone https://github.com/JosephGenio/synflow.git
cd synflow
```

> **For private repos**, set up an SSH deploy key or a GitHub personal access token:
> ```bash
> GIT_SSH_COMMAND="ssh -i ~/.ssh/deploy_key" git clone git@github.com:JosephGenio/synflow.git
> ```

---

## 9. Create Environment Files

Environment files are **not** committed to git. They are created manually on the VM or injected by CI/CD.

### 9.1 Staging Environment

```bash
mkdir -p ~/synflow/env
nano ~/synflow/env/.env.staging
```

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=synflow_user
DB_PASSWORD=<GENERATE_A_STRONG_PASSWORD>
DB_NAME=synflow_staging
JWT_SECRET=<RUN: openssl rand -hex 32>
BREVO_API_KEY=<YOUR_BREVO_API_KEY>
BREVO_SENDER_EMAIL=staging@synflo.space
BREVO_SENDER_NAME=Synflo Staging
APP_URL=https://staging.synflo.space
PORT=3001
NODE_ENV=production
```

### 9.2 Production Environment

```bash
nano ~/synflow/env/.env.production
```

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=synflow_user
DB_PASSWORD=<GENERATE_A_DIFFERENT_STRONG_PASSWORD>
DB_NAME=synflow
JWT_SECRET=<RUN: openssl rand -hex 32>
BREVO_API_KEY=<YOUR_BREVO_API_KEY>
BREVO_SENDER_EMAIL=noreply@synflo.space
BREVO_SENDER_NAME=Synflo
APP_URL=https://synflo.space
PORT=3001
NODE_ENV=production
```

### Generate secure values

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate DB_PASSWORD
openssl rand -base64 24
```

> **CRITICAL**: `APP_URL` must match the Vercel frontend domain exactly (no trailing slash). This controls CORS and email links.
>
> **CRITICAL**: Use **different** `JWT_SECRET` and `DB_PASSWORD` values for staging vs production.

---

## 10. Deploy with Docker Compose

### 10.1 Deploy Staging

```bash
cd ~/synflow
git checkout staging

docker compose -f docker-compose.staging.yml --env-file env/.env.staging up -d --build
```

### 10.2 Deploy Production

```bash
cd ~/synflow
git checkout master

docker compose -f docker-compose.production.yml --env-file env/.env.production up -d --build
```

Both environments can run simultaneously on the same VM — they use separate containers, volumes, and networks.

### 10.3 Watch the Logs

```bash
# Staging
docker logs -f synflow-backend-staging
docker logs -f synflow-postgres-staging

# Production
docker logs -f synflow-backend-production
docker logs -f synflow-postgres-production
```

---

## 11. Verify the Deployment

### 11.1 Check Container Status

```bash
docker ps
```

Expected output (both environments running):
```
CONTAINER ID   IMAGE                    STATUS                    PORTS                    NAMES
abc123         synflow-backend          Up 2 min (healthy)        0.0.0.0:3001->3001/tcp   synflow-backend-staging
def456         postgres:16-alpine       Up 2 min (healthy)        5432/tcp                 synflow-postgres-staging
ghi789         synflow-backend          Up 5 min (healthy)        0.0.0.0:3002->3001/tcp   synflow-backend-production
jkl012         postgres:16-alpine       Up 5 min (healthy)        5432/tcp                 synflow-postgres-production
```

> **Port conflict note:** If running both on the same VM, production must use a different host port. See [section 12](#12-set-up-nginx-reverse-proxy) — Nginx routes by domain name, so both can use the same port internally if you offset the host mapping. Update `docker-compose.production.yml` to map `3002:3001` if both run on the same VM.

### 11.2 Test Health Endpoints

```bash
# Staging
curl http://localhost:3001/api/health
curl http://localhost:3001/api/ping

# Production (if mapped to 3002)
curl http://localhost:3002/api/health
curl http://localhost:3002/api/ping
```

### 11.3 Check Database Migrations

```bash
# Staging
docker exec -it synflow-postgres-staging psql -U synflow_user -d synflow_staging -c "SELECT * FROM _migrations ORDER BY applied_at;"

# Production
docker exec -it synflow-postgres-production psql -U synflow_user -d synflow -c "SELECT * FROM _migrations ORDER BY applied_at;"
```

---

## 12. Set Up Nginx Reverse Proxy

Nginx routes requests by domain name to the correct backend container.

### 12.1 Staging API

```bash
sudo nano /etc/nginx/conf.d/synflow-api-staging.conf
```

```nginx
server {
    listen 80;
    server_name api-staging.synflo.space;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api-staging.synflo.space;

    # SSL certificates (Certbot will fill these in)
    # ssl_certificate /etc/letsencrypt/live/api-staging.synflo.space/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api-staging.synflo.space/privkey.pem;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}
```

### 12.2 Production API

```bash
sudo nano /etc/nginx/conf.d/synflow-api-production.conf
```

```nginx
server {
    listen 80;
    server_name api.synflo.space;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.synflo.space;

    # SSL certificates (Certbot will fill these in)
    # ssl_certificate /etc/letsencrypt/live/api.synflo.space/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.synflo.space/privkey.pem;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}
```

### 12.3 Test and Start Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

> **Note:** The HTTPS server blocks won't work until you set up SSL certificates in the next step. You can temporarily comment out the HTTPS blocks and test with HTTP first.

---

## 13. SSL with Let's Encrypt

### 13.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 13.2 Obtain Certificates

```bash
# Staging API
sudo certbot --nginx -d api-staging.synflo.space

# Production API
sudo certbot --nginx -d api.synflo.space
```

Certbot will:
1. Verify domain ownership via HTTP challenge
2. Obtain the SSL certificate
3. Automatically update your Nginx config with the certificate paths
4. Set up HTTP-to-HTTPS redirect

### 13.3 Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

Certificates renew automatically every 60-90 days.

---

## 14. DNS Configuration

**`[DNS PROVIDER]`**

### 14.1 API Domains

Add **A records** pointing both API subdomains to the VM's public IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `api-staging` | `<YOUR_VM_PUBLIC_IP>` | 300 |
| A | `api` | `<YOUR_VM_PUBLIC_IP>` | 300 |

### 14.2 Frontend Domains (Vercel)

Add **CNAME records** pointing to Vercel:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `staging` | `cname.vercel-dns.com` | 300 |
| A | `@` (root) | `76.76.21.21` | 300 |

> For the root domain (`synflo.space`), use Vercel's A record (`76.76.21.21`) since CNAME on root is not universally supported. Confirm the IP in your Vercel project's domain settings.

### 14.3 Burner Email Domain (Brevo Inbound)

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | `burner` | `inbound-smtp.brevo.com` | 10 | 3600 |

Configure the inbound webhook in the Brevo dashboard:
- **Webhook URL**: `https://api.synflo.space/api/burner/webhook/inbound`
- **Domain**: `burner.synflo.space`

---

## 15. Frontend on Vercel

You need **two separate Vercel projects** — one for staging, one for production.

### 15.1 Vercel Project Settings (both projects)

**`[VERCEL]`**

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `packages/app` |
| Build Command | `cd ../.. && pnpm install && pnpm --filter @synflow/app build` |
| Output Directory | `dist` |
| Install Command | _(leave empty — handled in build command)_ |
| Node.js Version | 24.x |

### 15.2 Staging Vercel Project

1. Create a new Vercel project (e.g., `synflo-staging`)
2. Connect it to the `staging` branch of the GitHub repo
3. Add a custom domain: `staging.synflo.space`
4. Set environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://api-staging.synflo.space` | All |

### 15.3 Production Vercel Project

1. Create a new Vercel project (e.g., `synflo`)
2. Connect it to the `master` branch of the GitHub repo
3. Add a custom domain: `synflo.space`
4. Set environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://api.synflo.space` | All |

### 15.4 CORS Alignment

The backend's `APP_URL` must exactly match the Vercel custom domain:

| Environment | `APP_URL` (backend) | Vercel Domain |
|-------------|---------------------|---------------|
| Staging | `https://staging.synflo.space` | `staging.synflo.space` |
| Production | `https://synflo.space` | `synflo.space` |

If these don't match, the frontend will get CORS errors when calling the API.

---

## 16. GitHub Actions CI/CD

The project supports automated deployments via GitHub Actions. The workflows trigger on pushes to specific branches.

### 16.1 Branch Strategy

| Branch | Deploys To | Vercel Project | Backend Compose File |
|--------|-----------|----------------|---------------------|
| `staging` | Staging | synflo-staging | `docker-compose.staging.yml` |
| `master` | Production | synflo | `docker-compose.production.yml` |

### 16.2 GitHub Secrets

**`[GITHUB]`** Go to **Repository > Settings > Secrets and Variables > Actions** and add:

#### Staging Secrets

| Secret Name | Value |
|-------------|-------|
| `STAGING_VM_HOST` | VM's public IP address |
| `STAGING_VM_USER` | `deploy` |
| `STAGING_VM_SSH_KEY` | Private SSH key for the VM |
| `STAGING_ENV_FILE` | Full contents of `env/.env.staging` |

#### Production Secrets

| Secret Name | Value |
|-------------|-------|
| `PRODUCTION_VM_HOST` | VM's public IP address |
| `PRODUCTION_VM_USER` | `deploy` |
| `PRODUCTION_VM_SSH_KEY` | Private SSH key for the VM |
| `PRODUCTION_ENV_FILE` | Full contents of `env/.env.production` |

> If staging and production share the same VM, `STAGING_VM_HOST` and `PRODUCTION_VM_HOST` will be the same IP.

### 16.3 Workflow Files

| Workflow | File | Trigger |
|----------|------|---------|
| Deploy Staging | `.github/workflows/deploy-staging.yml` | Push to `staging` |
| Deploy Production | `.github/workflows/deploy-production.yml` | Push to `master` |
| ESLint | `.github/workflows/eslint.yml` | PR to `master` |
| Tests | `.github/workflows/jest.yml` | PR to `master` |

### 16.4 How the CI/CD Pipeline Works

Each deploy workflow:
1. SSHs into the Oracle VM as the `deploy` user
2. Pulls latest code from the target branch
3. Writes the env file from the corresponding GitHub secret
4. Runs `docker compose -f <compose-file> --env-file <env-file> up -d --build`
5. Waits for the backend health check to pass

### 16.5 Deployment Flow

```
Feature branch → PR to master → Merge → Auto-deploy to production (Vercel + backend)
                                    ↓
                              staging branch ← Cherry-pick or merge for staging preview
                                    ↓
                              Auto-deploy to staging (Vercel + backend)
```

---

## 17. Database Backups

### 17.1 Automated Daily Backups

Create a backup script:

```bash
sudo mkdir -p /opt/synflow/backups
sudo nano /opt/synflow/backup-db.sh
```

```bash
#!/bin/bash
set -e

BACKUP_DIR="/opt/synflow/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup staging
docker exec synflow-postgres-staging pg_dump \
  -U synflow_user -d synflow_staging --no-owner --no-privileges \
  | gzip > "$BACKUP_DIR/staging_$TIMESTAMP.sql.gz"

# Backup production
docker exec synflow-postgres-production pg_dump \
  -U synflow_user -d synflow --no-owner --no-privileges \
  | gzip > "$BACKUP_DIR/production_$TIMESTAMP.sql.gz"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backups created at $TIMESTAMP"
```

```bash
sudo chmod +x /opt/synflow/backup-db.sh
```

### 17.2 Schedule with Cron

```bash
sudo crontab -e

# Add — runs daily at 2:00 AM
0 2 * * * /opt/synflow/backup-db.sh >> /var/log/synflow-backup.log 2>&1
```

### 17.3 Restore from Backup

```bash
# Restore staging
gunzip -c /opt/synflow/backups/staging_20260318_020000.sql.gz | \
  docker exec -i synflow-postgres-staging psql -U synflow_user -d synflow_staging

# Restore production
gunzip -c /opt/synflow/backups/production_20260318_020000.sql.gz | \
  docker exec -i synflow-postgres-production psql -U synflow_user -d synflow
```

---

## 18. Monitoring and Maintenance

### 18.1 Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Database connectivity check | `{"status":"ok","timestamp":"..."}` |
| `GET /api/ping` | Simple liveness check | `{"ok":true,"time":"..."}` |

### 18.2 View Logs

```bash
# Staging
docker logs --tail 100 -f synflow-backend-staging
docker logs --tail 100 -f synflow-postgres-staging

# Production
docker logs --tail 100 -f synflow-backend-production
docker logs --tail 100 -f synflow-postgres-production
```

### 18.3 Restart Services

```bash
cd ~/synflow

# Restart staging
docker compose -f docker-compose.staging.yml --env-file env/.env.staging restart

# Restart production
docker compose -f docker-compose.production.yml --env-file env/.env.production restart

# Full rebuild (staging)
docker compose -f docker-compose.staging.yml --env-file env/.env.staging up -d --build

# Full rebuild (production)
docker compose -f docker-compose.production.yml --env-file env/.env.production up -d --build
```

### 18.4 Docker Disk Cleanup

```bash
docker system prune -f
docker image prune -a -f
docker system df
```

### 18.5 OS Updates

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 19. Non-Docker Deployment (Alternative)

If you prefer running the backend directly on the VM without Docker:

### 19.1 Install Node.js 24

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install 24
nvm use 24
nvm alias default 24

corepack enable
corepack prepare pnpm@latest --activate
```

### 19.2 Install PostgreSQL 16 Directly

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16
```

#### Create Databases and User

```bash
sudo -u postgres psql

CREATE USER synflow_user WITH PASSWORD '<YOUR_DB_PASSWORD>';
CREATE DATABASE synflow OWNER synflow_user;
CREATE DATABASE synflow_staging OWNER synflow_user;
GRANT ALL PRIVILEGES ON DATABASE synflow TO synflow_user;
GRANT ALL PRIVILEGES ON DATABASE synflow_staging TO synflow_user;
\q
```

#### Configure pg_hba.conf for Local Connections

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add or modify:

```
# TYPE  DATABASE    USER            ADDRESS         METHOD
local   all         synflow_user                    md5
host    all         synflow_user    127.0.0.1/32    md5
```

```bash
sudo systemctl restart postgresql
```

### 19.3 Install Dependencies and Build

```bash
cd ~/synflow
pnpm install
pnpm build
```

### 19.4 Set Up the Environment File

For non-Docker, change `DB_HOST` to `localhost` in both env files.

### 19.5 Run Migrations

```bash
cd ~/synflow
NODE_ENV=production pnpm migrate
```

### 19.6 Create systemd Services

Create a service for each environment:

```bash
sudo nano /etc/systemd/system/synflow-staging.service
```

```ini
[Unit]
Description=Synflo Staging Backend API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/synflow
Environment=NODE_ENV=production
EnvironmentFile=/home/deploy/synflow/env/.env.staging
ExecStart=/home/deploy/.nvm/versions/node/v24.0.0/bin/node packages/server/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=synflow-staging
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/home/deploy/synflow

[Install]
WantedBy=multi-user.target
```

Repeat for production with a different service name (`synflow-production.service`), env file, and `PORT` value.

> **Note:** Update the `ExecStart` path to match your actual Node.js binary location. Find it with: `which node`

```bash
sudo systemctl daemon-reload
sudo systemctl enable synflow-staging synflow-production
sudo systemctl start synflow-staging synflow-production
```

---

## 20. Troubleshooting

### Backend container won't start

```bash
# Check container logs
docker logs synflow-backend-staging --tail 50     # or -production

# Check if port is already in use
sudo ss -tlnp | grep 3001

# Rebuild from scratch
docker compose -f docker-compose.staging.yml --env-file env/.env.staging down
docker compose -f docker-compose.staging.yml --env-file env/.env.staging up -d --build
```

### Database connection refused

```bash
# Check if PostgreSQL container is running and healthy
docker ps | grep postgres

# Test connectivity from inside the backend container
docker exec -it synflow-backend-staging sh
wget -qO- http://localhost:3001/api/health

# Check PostgreSQL logs
docker logs synflow-postgres-staging --tail 30
```

### CORS errors in browser

- Verify `APP_URL` in `.env.staging` / `.env.production` exactly matches the Vercel frontend URL (including `https://`)
- No trailing slash: `https://staging.synflo.space` not `https://staging.synflo.space/`
- Restart the backend after changing `APP_URL`

### Nginx returns 502 Bad Gateway

```bash
# Check if backend is actually running on the expected port
curl http://localhost:3001/api/ping    # staging
curl http://localhost:3002/api/ping    # production

# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# Verify Nginx config
sudo nginx -t
```

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew --force-renewal

# Check if port 80 is accessible (required for HTTP challenge)
curl -I http://api-staging.synflo.space
```

### Ports blocked despite Security List rules

```bash
# Check iptables
sudo iptables -L INPUT -n --line-numbers

# If you see DROP rules before your ACCEPT rules
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### Out of disk space

```bash
df -h
docker system prune -a -f
docker volume prune -f
du -sh /var/lib/docker/
```

### Emails not being received (Burner Email)

1. Verify MX record: `dig MX burner.synflo.space`
2. Verify webhook URL in Brevo dashboard points to `https://api.synflo.space/api/burner/webhook/inbound`
3. Check backend logs for incoming webhook requests

---

## Quick Reference

### Common Commands

```bash
cd ~/synflow

# === Staging ===
docker compose -f docker-compose.staging.yml --env-file env/.env.staging up -d --build    # deploy
docker compose -f docker-compose.staging.yml down                                          # stop
docker logs -f synflow-backend-staging                                                     # logs
curl http://localhost:3001/api/health                                                      # health
docker exec -it synflow-postgres-staging psql -U synflow_user -d synflow_staging           # db shell

# === Production ===
docker compose -f docker-compose.production.yml --env-file env/.env.production up -d --build   # deploy
docker compose -f docker-compose.production.yml down                                            # stop
docker logs -f synflow-backend-production                                                       # logs
curl http://localhost:3002/api/health                                                           # health
docker exec -it synflow-postgres-production psql -U synflow_user -d synflow                    # db shell

# === Shared ===
/opt/synflow/backup-db.sh                    # manual backup
sudo certbot renew                           # SSL renewal
```

### Environment Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host (`postgres` in Docker, `localhost` without) | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database username | `synflow_user` |
| `DB_PASSWORD` | Database password | `<secure random>` |
| `DB_NAME` | Database name | `synflow` / `synflow_staging` |
| `JWT_SECRET` | Auth token signing key | `<openssl rand -hex 32>` |
| `BREVO_API_KEY` | Brevo email service API key | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | From address for outgoing emails | `noreply@synflo.space` |
| `BREVO_SENDER_NAME` | From display name | `Synflo` |
| `APP_URL` | Frontend URL (used for CORS & email links) | `https://synflo.space` |
| `PORT` | Backend listening port | `3001` |
| `NODE_ENV` | Runtime environment | `production` |
| `VITE_API_URL` | Backend API URL (frontend, set in Vercel) | `https://api.synflo.space` |
