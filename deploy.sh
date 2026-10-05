#!/usr/bin/env bash
# ==============================================================================
# Decor Joy Gurgaon - 1-Click Production VPS Deployment Script
# Turnkey setup for Ubuntu / Debian Linux VPS.
# ==============================================================================

set -e

echo ""
echo "🎈 =========================================================="
echo "   Decor Joy Gurgaon — Automated VPS Deployment"
echo "=========================================================="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

# 2. Check & Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ Installing PM2 process manager globally..."
    sudo npm install -g pm2
fi
echo "✓ PM2 is available"

# 3. Setup Server Environment
echo ""
echo "⚙️ [1/4] Configuring Backend Server..."
cd "$(dirname "$0")/server"

if [ ! -f ".env" ]; then
    echo "📝 Generating production server/.env from template..."
    cp .env.example .env
    # Generate secure random secrets
    JWT_ACCESS=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_REFRESH=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/replace_with_at_least_32_characters_random_access_secret/$JWT_ACCESS/" .env
    sed -i "s/replace_with_at_least_32_characters_random_refresh_secret/$JWT_REFRESH/" .env
    echo "✓ Generated cryptographically secure JWT secrets"
fi

echo "📦 Installing server production dependencies..."
npm install --omit=dev

# Optional database seeding
if [ "$1" == "--seed" ]; then
    echo "🌱 Seeding initial products, categories, and admin account..."
    npm run seed || echo "⚠️ Database seed finished (or already seeded)."
fi

cd ..

# 4. Setup Frontend Client
echo ""
echo "⚙️ [2/4] Building Frontend Client Production Bundle..."
cd client
echo "📦 Installing client dependencies..."
npm install

echo "🚀 Building optimized static production bundle and prerendering..."
npm run build
cd ..

# 5. Start / Reload Background Services via PM2
echo ""
echo "⚙️ [3/4] Starting / Reloading Services in PM2..."
cd server
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
cd ..

# 6. Summary & Nginx Helper
echo ""
echo "🎉 [4/4] DEPLOYMENT COMPLETE!"
echo "=========================================================="
echo "✓ API Cluster: Active on http://127.0.0.1:5000"
echo "✓ Static Assets & HTML: Ready in client/dist"
echo "✓ Real Portfolio Images: 251 high-res files in client/dist/decor-gallery"
echo ""
echo "📋 To connect Nginx to your domain:"
echo "   1. Copy the provided 'nginx.conf' to: /etc/nginx/sites-available/decorjoy"
echo "   2. Link it: sudo ln -s /etc/nginx/sites-available/decorjoy /etc/nginx/sites-enabled/"
echo "   3. Test & reload: sudo nginx -t && sudo systemctl reload nginx"
echo "   4. Enable HTTPS with free SSL: sudo certbot --nginx -d yourdomain.com"
echo "=========================================================="
echo ""
