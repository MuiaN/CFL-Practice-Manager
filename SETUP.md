# CFL Legal Practice Management System - Setup Guide

This guide will help you set up the CFL Legal Practice Management System on your local machine and deploy it to a VPS server running Ubuntu.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment on Ubuntu VPS](#production-deployment-on-ubuntu-vps)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Development
- **Node.js** (v20.x or higher)
- **npm** (v9.x or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

### Production VPS
- **Ubuntu Server** (20.04 LTS or higher)
- **Root or sudo access**
- **Domain name** (optional but recommended)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd cfl-legal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL Database

#### Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database and User

```bash
# Access PostgreSQL as superuser
sudo -u postgres psql

# Create database
CREATE DATABASE cfl_legal;

# Create user with password
CREATE USER cfl_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cfl_legal TO cfl_user;

# Grant schema privileges (required for PostgreSQL 15+)
\c cfl_legal
GRANT ALL ON SCHEMA public TO cfl_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cfl_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cfl_user;

# Exit PostgreSQL
\q
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If .env.example exists, otherwise create new file
```

Edit `.env` and add the following:

```env
# Database Configuration
DATABASE_URL=postgresql://cfl_user:your_secure_password@localhost:5432/cfl_legal

# Session Secret (generate a random string)
SESSION_SECRET=your_random_secret_key_minimum_32_characters_long

# Node Environment
NODE_ENV=development
```

**Generate a secure SESSION_SECRET:**
```bash
# On Linux/macOS
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Initialize Database Schema

```bash
# Push schema to database
npm run db:push
```

This will create all necessary tables and seed initial data (roles and practice areas).

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

**Default Admin Credentials:**
- Email: `admin@cfllegal.co.ke`
- Password: `admin123`

**⚠️ Important:** Change the admin password immediately after first login!

---

## Production Deployment on Ubuntu VPS

### 1. Initial Server Setup

#### Connect to your VPS
```bash
ssh root@your_server_ip
```

#### Create a deployment user
```bash
adduser cfllegal
usermod -aG sudo cfllegal
su - cfllegal
```

### 2. Install Required Software

#### Update system packages
```bash
sudo apt update
sudo apt upgrade -y
```

#### Install Node.js (v20.x)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Install Nginx (reverse proxy)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Install Git
```bash
sudo apt install -y git
```

#### Install PM2 (process manager)
```bash
sudo npm install -g pm2
```

### 3. Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE cfl_legal_prod;

# Create user with strong password
CREATE USER cfl_prod_user WITH PASSWORD 'your_very_secure_production_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cfl_legal_prod TO cfl_prod_user;

# Grant schema privileges
\c cfl_legal_prod
GRANT ALL ON SCHEMA public TO cfl_prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cfl_prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cfl_prod_user;
ALTER DATABASE cfl_legal_prod OWNER TO cfl_prod_user;

# Exit
\q
```

### 4. Deploy Application

#### Clone repository
```bash
cd /home/cfllegal
git clone <your-repository-url> app
cd app
```

#### Install dependencies
```bash
npm install --production
```

#### Configure Environment Variables

Create production `.env` file:
```bash
nano .env
```

Add the following (use production values):
```env
# Database Configuration
DATABASE_URL=postgresql://cfl_prod_user:your_very_secure_production_password@localhost:5432/cfl_legal_prod

# Session Secret (generate a new one for production)
SESSION_SECRET=production_random_secret_key_64_characters_minimum_security_required

# Node Environment
NODE_ENV=production

# Port (optional, defaults to 5000)
PORT=5000
```

**Generate production SESSION_SECRET:**
```bash
openssl rand -base64 64
```

#### Initialize database
```bash
npm run db:push
```

#### Build the application
```bash
npm run build
```

### 5. Configure PM2

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

Add:
```javascript
module.exports = {
  apps: [{
    name: 'cfl-legal',
    script: 'npm',
    args: 'start',
    cwd: '/home/cfllegal/app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

#### Start application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Configure Nginx Reverse Proxy

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/cfl-legal
```

Add:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase client body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cfl-legal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Set Up SSL Certificate (Recommended)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

### 8. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `SESSION_SECRET` | Secret key for JWT tokens | `random_64_character_string` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |

---

## Database Setup

### Schema Overview

The application uses the following tables:
- **users** - User accounts with authentication
- **roles** - Role-based access control (admin, senior_associate, associate)
- **practice_areas** - Legal practice areas
- **user_practice_areas** - Many-to-many relationship between users and practice areas
- **cases** - Legal case management
- **case_assignments** - User assignments to cases
- **documents** - Document storage and metadata
- **settings** - Application settings

### Database Migrations

The project uses Drizzle ORM for database management:

```bash
# Apply schema changes to database
npm run db:push

# Generate migration files (if needed)
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

### Database Backup (Production)

**Create backup:**
```bash
sudo -u postgres pg_dump cfl_legal_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore backup:**
```bash
sudo -u postgres psql cfl_legal_prod < backup_20240101_120000.sql
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts both frontend (Vite) and backend (Express) servers with hot reload.

### Production Mode

```bash
npm run build  # Build frontend
npm start      # Start production server
```

Or using PM2:
```bash
pm2 start ecosystem.config.js
pm2 logs cfl-legal  # View logs
pm2 restart cfl-legal  # Restart app
pm2 stop cfl-legal  # Stop app
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Permission Errors

**Error:** `permission denied for schema public`

**Solution:**
```bash
sudo -u postgres psql
\c cfl_legal
GRANT ALL ON SCHEMA public TO cfl_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cfl_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cfl_user;
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Application Not Starting

**Check logs:**
```bash
# PM2 logs (production)
pm2 logs cfl-legal

# Check all PM2 processes
pm2 list

# Check system logs
sudo journalctl -u nginx -f
```

### File Upload Issues

**Error:** File uploads failing or `EACCES` errors

**Solution:**
```bash
# Ensure uploads directory exists and has correct permissions
mkdir -p uploads
chmod 755 uploads
chown -R cfllegal:cfllegal uploads
```

### Database Schema Out of Sync

**Solution:**
```bash
# Force push schema (⚠️ may lose data in development)
npm run db:push -- --force

# Or regenerate and apply migrations
npm run db:generate
npm run db:push
```

---

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Use strong, unique SESSION_SECRET in production
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS in production
- [ ] Configure firewall (ufw) properly
- [ ] Keep system and packages updated
- [ ] Set up regular database backups
- [ ] Restrict database access to localhost only
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` file to version control

---

## Updating the Application

### Pull latest changes
```bash
cd /home/cfllegal/app
git pull origin main
npm install --production
npm run build
pm2 restart cfl-legal
```

---

## Support

For issues or questions, please contact your system administrator or refer to the project documentation.

**Important:** Always backup your database before making significant changes!
