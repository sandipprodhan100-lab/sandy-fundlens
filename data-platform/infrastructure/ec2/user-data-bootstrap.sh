#!/bin/bash
# ==============================================================================
# FundLens Apache Airflow & dbt EC2 (t3.medium) Bootstrap Script
# Runs automatically on first boot as EC2 User Data
# ==============================================================================

set -e
export DEBIAN_FRONTEND=noninteractive

echo "==> 1. Updating packages and installing prerequisites..."
apt-get update -y
apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common git git-lfs htop

echo "==> 2. Setting up 2GB Swap Space for t3.medium memory stability..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 3. Installing Docker & Docker Compose..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose

# Add ubuntu user to docker group
usermod -aG docker ubuntu

echo "==> 4. Setting up FundLens Airflow workspace in /opt/fundlens..."
mkdir -p /opt/fundlens
chown -R ubuntu:ubuntu /opt/fundlens

# Clone repository if not present
if [ ! -d /opt/fundlens/sandy-fundlens ]; then
    git clone https://github.com/sandipprodhan100-lab/sandy-fundlens.git /opt/fundlens/sandy-fundlens
    chown -R ubuntu:ubuntu /opt/fundlens/sandy-fundlens
fi

cd /opt/fundlens/sandy-fundlens/data-platform/airflow
if [ ! -f .env ]; then
    cp .env.airflow.example .env
fi

echo "==> 5. Creating Systemd Service for Auto-Start on Boot..."
cat << 'EOF' > /etc/systemd/system/fundlens-airflow.service
[Unit]
Description=FundLens Apache Airflow Docker Cluster
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=ubuntu
WorkingDirectory=/opt/fundlens/sandy-fundlens/data-platform/airflow
ExecStart=/usr/bin/docker-compose -f docker-compose.airflow.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.airflow.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fundlens-airflow.service

# Start the cluster now
echo "==> 6. Starting Airflow containers..."
systemctl start fundlens-airflow.service

echo "==> Bootstrap Complete! Airflow is running and configured to auto-start on every EC2 boot."
