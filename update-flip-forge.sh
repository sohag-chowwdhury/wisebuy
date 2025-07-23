#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
APP_NAME="flip-forge"
APP_DIR="~/services/flip-forge"

echo -e "${BLUE}🚀 FlipForge Update Script${NC}"
echo "=================================="

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Navigate to app directory
echo -e "${YELLOW}📂 Navigating to application directory...${NC}"
cd ~/services/flip-forge
check_success "Directory change"

# Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
git status --porcelain
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git repository error${NC}"
    exit 1
fi

# Stash any local changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}💾 Stashing local changes...${NC}"
    git stash
    check_success "Git stash"
fi

# Pull latest changes
echo -e "${YELLOW}🔄 Pulling latest changes from main branch...${NC}"
git pull origin main
check_success "Git pull"

# Install/update dependencies
echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
pnpm install
check_success "Dependencies installation"

# Build the application
echo -e "${YELLOW}🏗️ Building application for production...${NC}"
pnpm run build:deploy
check_success "Application build"

# Check if PM2 process exists
echo -e "${YELLOW}🔍 Checking PM2 process status...${NC}"
if pm2 describe $APP_NAME > /dev/null 2>&1; then
    echo -e "${BLUE}🔄 Restarting existing PM2 process...${NC}"
    pm2 restart $APP_NAME
    check_success "PM2 restart"
else
    echo -e "${BLUE}🚀 Starting new PM2 process...${NC}"
    PORT=3001 pm2 start "pnpm start" --name $APP_NAME
    check_success "PM2 start"
fi

# Save PM2 configuration
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save
check_success "PM2 save"

# Show final status
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Current PM2 Status:${NC}"
pm2 status

echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "- FlipForge: http://154.53.32.15:3001"
echo "- Health Check: http://154.53.32.15:3001/api/health"

echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo "- View logs: pm2 logs $APP_NAME"
echo "- Monitor: pm2 monit"
echo "- Restart: pm2 restart $APP_NAME"
echo "" 