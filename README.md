# FlipForge
## Installation and dev
For first time of the repo
```bash
pnpm install
```
Then, run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Phase 1: Product Recognition & Data Capture

1. Bulk Photo Upload Interface
2. AI Product Identification - Use computer vision to identify:
   - Brand, model, and product category
   - Condition assessment from photos
   - Key visual features and defects
3. Data Validation Queue - Flagged items for manual review when AI confidence is low. Get product model from user

## Phase 2: Automated Data Enrichment

1. MSRP & Market Research - Auto-fetch from multiple sources:
   - Manufacturer websites
   - Major retailers (Amazon, Best Buy, etc.)
   - Price comparison sites
   - Historical pricing data
2. Specification Gathering - Pull technical specs, dimensions, features
3. Competitive Analysis - Check similar listings on eBay, Mercari, Facebook Marketplace

## Phase 3: Intelligent Pricing & Content

1. Dynamic Pricing Algorithm - Suggest pricing based on:

   - Current MSRP vs. condition
   - Local market demand
   - Your historical sales data
   - Seasonal trends

2. Auto-Generated Descriptions - Create SEO-optimized content including:
   - Condition details from photo analysis
   - Key features and specifications
   - Comparison to new product value

## Phase 4: SEO & Publishing

1. SEO Optimization - Auto-generate:

   - Title tags with long-tail keywords
   - Meta descriptions
   - Alt text for images
   - Schema markup for rich snippets

2. Multi-Channel Publishing - Simultaneously list on:
   - Your main e-commerce site
   - eBay, Amazon, Facebook Marketplace
   - Google Shopping



# VPS Next.js Deployment Guide

## Current Setup

- **Server IP**: 154.53.32.15
- **proposal-view**: http://154.53.32.15 (port 80 → internal port 3000)
- **flip-forge**: http://154.53.32.15:3001 (direct port 3001)

## Prerequisites

Make sure these are installed on your VPS:
- Node.js and npm
- pnpm (`npm install -g pnpm`)
- PM2 (`npm install -g pm2`)

## Updating Existing Applications

### Update proposal-view
```bash
cd ~/services/proposal-view
git pull
pnpm install
pnpm build
pm2 restart proposal-view
```

### Update flip-forge
```bash
cd ~/services/flip-forge
git pull
pnpm install
pnpm build
pm2 restart flip-forge
```

## Deploying a New Application

### 1. Clone the repository
```bash
cd ~/services
git clone <your-repo-url> <app-name>
cd <app-name>
pnpm install
```

### 2. Build for production
```bash
pnpm build
```

### 3. Choose deployment method

#### Option A: Direct port access (like flip-forge)
```bash
# Start on a specific port (e.g., 3002)
PORT=3002 pm2 start "pnpm start" --name "<app-name>"

# Allow port through firewall
sudo ufw allow 3002
```
**Access**: http://154.53.32.15:3002

#### Option B: Main domain with port forwarding (like proposal-view)
```bash
# Start on internal port
pm2 start "pnpm start" --name "<app-name>"

# Forward external port to internal port
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

# Save iptables rules
sudo netfilter-persistent save
```
**Access**: http://154.53.32.15

### 4. Save PM2 configuration
```bash
pm2 save
```

## Useful PM2 Commands

### Process Management
```bash
# List all processes
pm2 list

# View logs for specific app
pm2 logs <app-name>

# View logs for all apps
pm2 logs

# Monitor all processes
pm2 monit

# Restart specific app
pm2 restart <app-name>

# Stop specific app
pm2 stop <app-name>

# Delete app from PM2
pm2 delete <app-name>

# Restart all apps
pm2 restart all
```

### System Management
```bash
# Save current process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Reload saved processes
pm2 resurrect
```

## Port Management

### Check which ports are in use
```bash
# Check PM2 processes and their ports
pm2 list

# Check all listening ports
sudo netstat -tlnp

# Check specific port
sudo lsof -i :3001
```

### Port Forwarding Rules
```bash
# View current iptables rules
sudo iptables -t nat -L

# Add new port forwarding rule
sudo iptables -t nat -A PREROUTING -p tcp --dport <external-port> -j REDIRECT --to-port <internal-port>

# Save rules (make persistent)
sudo netfilter-persistent save

# Allow port through UFW firewall
sudo ufw allow <port-number>
```

## Troubleshooting

### App won't start
1. Check logs: `pm2 logs <app-name>`
2. Verify build completed: `pnpm build`
3. Test locally: `pnpm start`
4. Check port conflicts: `sudo lsof -i :<port>`

### App is errored/stopped
1. Delete and recreate: `pm2 delete <app-name>` then start again
2. Check if port is available
3. Verify environment variables

### Can't access from browser
1. Check firewall: `sudo ufw status`
2. Verify port forwarding: `sudo iptables -t nat -L`
3. Check if app is running: `pm2 list`
4. Test locally: `curl localhost:<port>`

### Server reboot
After server restart, PM2 should automatically start your apps if you've run:
```bash
pm2 startup
pm2 save
```

If not working:
```bash
pm2 resurrect
```

## Example: Adding a third app "my-dashboard"

```bash
# 1. Clone and setup
cd ~/services
git clone https://github.com/user/my-dashboard.git my-dashboard
cd my-dashboard
pnpm install
pnpm build

# 2. Start on port 3003
PORT=3003 pm2 start "pnpm start" --name "my-dashboard"

# 3. Allow port through firewall
sudo ufw allow 3003

# 4. Save PM2 config
pm2 save
```

**Access**: http://154.53.32.15:3003

## Current Application Ports

- **proposal-view**: Internal 3000 → External 80
- **flip-forge**: Direct 3001
- **Available for new apps**: 3002, 3003, 3004, etc.

## Security Notes

- Only open ports you need in UFW firewall
- Consider using a reverse proxy (nginx) for production
- Keep your applications updated
- Monitor logs regularly with `pm2 logs`


#   U p l o a d e r - w i s e b u y  
 #   w i s e b u y  
 