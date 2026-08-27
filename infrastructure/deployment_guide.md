# Production Deployment Guide: Sandip Prodhan Portfolio & Fund Lens AI App

This deployment guide covers the step-by-step instructions for deploying both **Sandip Prodhan's Technical Portfolio** (`https://sandipprodhan.in/`) and the **Mutual Fund Lens AI Application** (`https://fundlens.sandipprodhan.in/`) on a Hostinger VPS (or Cloud Server) with SSL, automated PM2 process management, and GitHub Actions CI/CD.

---

## Architecture Overview

* **Domains**:
  * `sandipprodhan.in` & `www.sandipprodhan.in` -> Portfolio Landing View.
  * `fundlens.sandipprodhan.in` -> Mutual Fund Lens AI Application.
* **Frontend Stack**: TanStack Start / Node.js SSR (`port 3000`).
* **Backend Stack**: Python 3.11 + FastAPI + ReAct Agent Engine (`port 8000`).
* **Process Orchestration**: PM2 Cluster & Ecosystem (`infrastructure/ecosystem.config.js`).
* **Reverse Proxy & SSL**: Nginx (`infrastructure/nginx.conf`) + Let's Encrypt Certbot.
* **Storage**: Managed PostgreSQL / Supabase + AWS S3 / Cloudflare R2 (Parquet Data Lake) + Redis.

---

## 1. Domain & DNS Configuration

In your **Hostinger HPanel** (or Cloudflare DNS) for `sandipprodhan.in`, set up the following A records pointing to your VPS public IP:

| Record Type | Host / Name | Target IP Value | TTL | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `<YOUR_HOSTINGER_VPS_IP>` | 3600 | Main Portfolio Domain |
| **A** | `www` | `<YOUR_HOSTINGER_VPS_IP>` | 3600 | WWW Redirect Domain |
| **A** | `fundlens` | `<YOUR_HOSTINGER_VPS_IP>` | 3600 | Fund Lens Subdomain |

---

## 2. Server Provisioning & Prerequisites

SSH into your Hostinger Ubuntu VPS:
```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```

Update system packages and install Node.js 20, Python 3.11, Nginx, Git, Certbot, and PM2:
```bash
# Update APT repository
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

# Install PM2 globally
sudo npm install -g pm2
```

---

## 3. Application Setup & Environment Files

1. Create target directory and clone repository:
   ```bash
   sudo mkdir -p /var/www/fundlens
   sudo chown -R $USER:$USER /var/www/fundlens
   cd /var/www/fundlens
   git clone <YOUR_GITHUB_REPO_URL> .
   ```

2. **Configure Backend Environment**:
   ```bash
   cd /var/www/fundlens/backend-fastapi
   cp .env.production.example .env
   nano .env
   ```
   *Fill in your `GEMINI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, and `S3_BUCKET_NAME` credentials.*

3. **Install Backend Dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Install Frontend Dependencies & Build**:
   ```bash
   cd /var/www/fundlens/frontend-node
   npm ci
   npm run build
   ```

---

## 4. PM2 Orchestration Setup

Launch both the Node.js frontend server and FastAPI backend server using the repository's PM2 ecosystem file:

```bash
cd /var/www/fundlens
pm2 start infrastructure/ecosystem.config.js --env production

# Persist PM2 across server reboots
pm2 save
pm2 startup
```

Verify PM2 status:
```bash
pm2 status
```

---

## 5. Nginx Reverse Proxy & SSL Setup

1. Copy the production Nginx site configuration:
   ```bash
   sudo cp /var/www/fundlens/infrastructure/nginx.conf /etc/nginx/sites-available/fundlens
   ```

2. Enable the site and disable default Nginx page:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/fundlens /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

3. Test configuration and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Issue SSL Certificates via Let's Encrypt Certbot:
   ```bash
   sudo certbot --nginx -d sandipprodhan.in -d www.sandipprodhan.in -d fundlens.sandipprodhan.in
   ```

---

## 6. GitHub Actions CI/CD Integration

To enable automated zero-downtime deployment on push to `main`:

1. In your GitHub Repository, navigate to **Settings -> Secrets and variables -> Actions**.
2. Add the following secrets:
   * `HOSTINGER_VPS_IP`: Your server's public IPv4 address.
   * `SSH_USER`: `root` (or your VPS deployment user).
   * `SSH_PRIVATE_KEY`: Your SSH private key generated on the server (`cat ~/.ssh/id_rsa`).

Every push to `main` will automatically build the application and deploy updates to your Hostinger VPS!
