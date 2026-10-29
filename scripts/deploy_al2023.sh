#!/bin/bash
# ==============================================================================
# CloudGuard AI - Amazon Linux 2023 EC2 Deployment Script
# Target: Amazon Linux 2023 (t3.micro / t3.small)
# ==============================================================================

set -e

echo "=== [1/7] Updating system packages ==="
sudo dnf update -y

echo "=== [2/7] Configuring 2GB Swap (Prevents OOM on t3.micro during npm build) ==="
if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    echo "Swap created successfully."
fi

echo "=== [3/7] Installing Git, Python 3, Node.js 20 & Nginx ==="
sudo dnf install -y git python3 python3-pip nginx
# Install Node.js 20 LTS
sudo dnf install -y nodejs || {
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
}

echo "=== [4/7] Setting up CloudGuard AI Repository ==="
cd /home/ec2-user
if [ ! -d "CloudGuard" ]; then
    git clone https://github.com/atyushamohanty24/CloudGuard.git
    cd CloudGuard
else
    cd CloudGuard
    git pull origin main
fi

echo "=== [5/7] Installing Backend Dependencies ==="
cd /home/ec2-user/CloudGuard/backend
python3 -m pip install -r requirements.txt

echo "=== [6/7] Building Frontend Application ==="
cd /home/ec2-user/CloudGuard/frontend
export VITE_USE_MOCKS=false
export VITE_API_URL=""
npm install
npm run build

echo "=== [7/7] Configuring Services (Nginx & Systemd Backend) ==="

# 1. Create Systemd Service for CloudGuard Backend API
sudo tee /etc/systemd/system/cloudguard-backend.service > /dev/null << 'EOF'
[Unit]
Description=CloudGuard AI Backend API Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/CloudGuard/backend
ExecStart=/usr/bin/python3 /home/ec2-user/CloudGuard/backend/server.py 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# 2. Configure Nginx Reverse Proxy & Static SPA Hosting
sudo tee /etc/nginx/conf.d/cloudguard.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    root /home/ec2-user/CloudGuard/frontend/dist;
    index index.html;

    # Frontend Single Page Application routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API requests to backend server
    location ~ ^/(summary|findings|costs|chat|scan|health) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Grant nginx permission to read home directory build files
chmod o+x /home/ec2-user
chmod -R o+r /home/ec2-user/CloudGuard/frontend/dist

# Reload and enable services
sudo systemctl daemon-reload
sudo systemctl enable --now cloudguard-backend
sudo systemctl enable --now nginx
sudo systemctl restart cloudguard-backend
sudo systemctl restart nginx

echo "=============================================================="
echo " CloudGuard AI successfully deployed!"
echo " Visit: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo 'YOUR_EC2_PUBLIC_IP')"
echo "=============================================================="
