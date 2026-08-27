#!/bin/bash
# ==============================================================================
# Automated Production Deployment Script for Hostinger VPS
# Sandip Prodhan Portfolio (sandipprodhan.in) & Fund Lens App (fundlens.sandipprodhan.in)
# ==============================================================================

set -e

echo "🚀 Starting Automated Server Setup & Deployment..."

# 1. System Updates & Prerequisites
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installing Node.js 20.x, Python 3.11, Nginx, Certbot, and Git..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git docker.io docker-compose

echo "📦 Installing PM2 globally..."
sudo npm install -g pm2

# 2. Directory Setup
echo "📁 Setting up project directory at /var/www/fundlens..."
sudo mkdir -p /var/www/fundlens
sudo chown -R $USER:$USER /var/www/fundlens

# 3. Environment Check
if [ ! -f "/var/www/fundlens/backend-fastapi/.env" ]; then
    echo "⚠️  Creating default .env file in backend-fastapi..."
    cat <<EOT > /var/www/fundlens/backend-fastapi/.env
GEMINI_API_KEY="your-gemini-api-key-here"
DATABASE_URL="postgresql://postgres:postgres_secure_pass@localhost:5432/fundlens"
REDIS_URL="redis://localhost:6379/0"
ENVIRONMENT="production"
EOT
    echo "❗ Please remember to update /var/www/fundlens/backend-fastapi/.env with your actual GEMINI_API_KEY!"
fi

# 4. Build & Install Backend
echo "🐍 Setting up Python Virtual Environment & Backend dependencies..."
cd /var/www/fundlens/backend-fastapi
python3 -m venv venv || true
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. Build Frontend
echo "⚡ Installing Frontend dependencies and building SSR bundle..."
cd /var/www/fundlens/frontend-node
npm ci
npm run build

# 6. PM2 Launch
echo "🔄 Starting services via PM2 Process Manager..."
cd /var/www/fundlens
pm2 start infrastructure/ecosystem.config.js --env production || pm2 reload infrastructure/ecosystem.config.js --env production
pm2 save
pm2 startup || true

# 7. Nginx Setup
echo "🌐 Configuring Nginx Reverse Proxy..."
sudo cp /var/www/fundlens/infrastructure/nginx.conf /etc/nginx/sites-available/fundlens
sudo ln -sf /etc/nginx/sites-available/fundlens /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment setup complete!"
echo "👉 Next step: Run Certbot to generate SSL certificates for your domain:"
echo "   sudo certbot --nginx -d sandipprodhan.in -d www.sandipprodhan.in -d fundlens.sandipprodhan.in"
