# SPTM Deployment Guide

Complete guide for deploying the SPTM project to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Web Dashboard Deployment (Vercel)](#web-dashboard-deployment-vercel)
4. [ML Service Deployment (Render)](#ml-service-deployment-render)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with repository access
- ✅ Vercel account (free tier available)
- ✅ Render account (free tier available)
- ✅ All code pushed to GitHub
- ✅ Environment variables ready

---

## Backend Deployment (Render)

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure database:
   - **Name**: `sptm-db`
   - **Database**: `sptm_production`
   - **User**: `sptm_user`
   - **Region**: Singapore (or closest to your users)
   - **Plan**: Free
3. Click **"Create Database"**
4. Wait for database to be provisioned (2-3 minutes)
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 3: Deploy Backend Service

#### Option A: Using render.yaml (Recommended)

1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select the repository: `SPTS`
4. Render will auto-detect `backend/render.yaml`
5. Click **"Apply"**
6. Configure environment variables (see below)
7. Click **"Create"**

#### Option B: Manual Setup

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sptm-backend`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Plan**: Free

### Step 4: Configure Environment Variables

In Render dashboard, go to **Environment** tab and add:

```bash
# Required
NODE_ENV=production
PORT=3001
DATABASE_URL=<your-internal-database-url>
JWT_SECRET=<generate-random-string-32-chars>
JWT_REFRESH_SECRET=<generate-random-string-32-chars>

# CORS (add your Vercel URL after deployment)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app

# Frontend URL (add your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app

# SMS Service (choose one)
SPARROW_SMS_TOKEN=<your-sparrow-token>
SPARROW_SMS_FROM=SPTM

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-gmail>
SMTP_PASS=<your-app-password>
SMTP_FROM=noreply@sptm.com

# App Config
APP_NAME=SPTM
SWAGGER_ENABLED=true
```

**Generate Secrets:**
```bash
# Generate JWT secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Database Seeding

**Important**: Render's free tier doesn't provide shell access. Use HTTP endpoints for seeding.

See **[RENDER_FREE_TIER_SEEDING.md](./RENDER_FREE_TIER_SEEDING.md)** for detailed instructions.

**Quick Steps:**

1. **Add SEED_KEY** to Render environment variables:
   - Go to Environment tab in Render
   - Add: `SEED_KEY` = `your-secret-seed-key-2024`
   - Save (service will redeploy)

2. **Check database status:**
   ```bash
   curl https://your-backend.onrender.com/api/seed/status
   ```

3. **Create super admin:**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/seed/super-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "superadmin@sptm.com",
       "password": "SecurePass123!",
       "name": "Super Admin",
       "seedKey": "your-secret-seed-key-2024"
     }'
   ```

4. **Seed demo data (optional):**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/seed/demo-data \
     -H "Content-Type: application/json" \
     -d '{"seedKey": "your-secret-seed-key-2024"}'
   ```

### Step 6: Verify Deployment

1. Check deployment logs for errors
2. Visit: `https://your-backend.onrender.com/api/health`
3. Should return: `{"status":"ok"}`
4. Visit: `https://your-backend.onrender.com/api-docs` (Swagger UI)

---

## Web Dashboard Deployment (Vercel)

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository: `SPTS`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web-dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Add these in Vercel project settings:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_NAME=SPTM
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide a URL: `https://your-app.vercel.app`

### Step 5: Update Backend CORS

Go back to Render backend environment variables and update:

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Then redeploy the backend service.

### Step 6: Configure Custom Domain (Optional)

1. In Vercel project settings → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update backend CORS with new domain

---

## ML Service Deployment (Render)

### Step 1: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sptm-ml-service`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `ml-service`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     python app.py
     ```
   - **Plan**: Free

### Step 2: Configure Environment Variables

```bash
FLASK_ENV=production
PORT=5000
OPENWEATHER_API_KEY=<your-key>
TOMTOM_API_KEY=<your-key>
```

### Step 3: Update Backend

Add ML service URL to backend environment variables:

```bash
ML_SERVICE_URL=https://your-ml-service.onrender.com
```

---

## Post-Deployment Configuration

### 1. Create Super Admin

SSH into Render backend shell and run:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const admin = await prisma.superAdmin.create({
    data: {
      email: 'admin@sptm.com',
      password: hashedPassword,
      name: 'Super Administrator',
      isActive: true
    }
  });
  
  console.log('Super Admin created:', admin.email);
}

createSuperAdmin().then(() => process.exit(0));
"
```

### 2. Seed License Data

```bash
npm run db:seed:licenses
```

### 3. Test Authentication

1. Go to your Vercel URL
2. Login with: `admin@sptm.com` / `Admin@123`
3. Change password immediately

### 4. Configure SMS Provider

Choose one SMS provider and add credentials:

**Sparrow SMS (Nepal):**
- Sign up at [sparrowsms.com](https://sparrowsms.com)
- Get API token
- Add to Render environment variables

**Twilio (Global):**
- Sign up at [twilio.com](https://twilio.com)
- Get Account SID, Auth Token, Phone Number
- Add to Render environment variables

### 5. Configure Email

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Add to Render environment variables:
   - `SMTP_USER`: your-email@gmail.com
   - `SMTP_PASS`: your-app-password

---

## Environment Variables

### Backend (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Yes | Server port | `3001` |
| `DATABASE_URL` | Yes | PostgreSQL connection | Auto-filled by Render |
| `JWT_SECRET` | Yes | JWT signing key | Generate random 32 chars |
| `JWT_REFRESH_SECRET` | Yes | Refresh token key | Generate random 32 chars |
| `ALLOWED_ORIGINS` | Yes | CORS origins | Vercel URL |
| `FRONTEND_URL` | Yes | Frontend URL | Vercel URL |
| `SPARROW_SMS_TOKEN` | No | SMS API token | From provider |
| `SMTP_USER` | Yes | Email username | Gmail address |
| `SMTP_PASS` | Yes | Email password | Gmail app password |

### Web Dashboard (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | Render URL |
| `NEXT_PUBLIC_APP_NAME` | No | App name | `SPTM` |

### ML Service (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FLASK_ENV` | Yes | Flask environment | `production` |
| `PORT` | Yes | Service port | `5000` |
| `OPENWEATHER_API_KEY` | No | Weather API key | From OpenWeather |
| `TOMTOM_API_KEY` | No | Traffic API key | From TomTom |

---

## Database Setup

### Initial Migration

After database is created, run migrations:

```bash
# In Render backend shell
npx prisma migrate deploy
```

### Seed Data

```bash
# Seed licenses
npm run db:seed:licenses

# Seed demo data (optional)
npm run db:seed
```

### Backup Database

```bash
# From Render dashboard
# Go to Database → Backups → Create Backup
```

### Connect to Database

```bash
# Get connection string from Render
# Use with any PostgreSQL client (pgAdmin, DBeaver, etc.)
```

---

## Troubleshooting

### Backend Issues

**Build Fails:**
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and rebuild
npm cache clean --force
npm install
```

**Database Connection Error:**
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npm run db:test-connection
```

**Migration Fails:**
```bash
# Reset and re-run
npx prisma migrate reset --force
npx prisma migrate deploy
```

### Frontend Issues

**Build Fails:**
```bash
# Check environment variables
# Ensure NEXT_PUBLIC_API_URL is set

# Clear cache
rm -rf .next
npm run build
```

**API Connection Error:**
- Verify backend URL is correct
- Check CORS settings in backend
- Ensure backend is running

### Common Errors

**"Cannot connect to database"**
- Check DATABASE_URL format
- Ensure database is running
- Verify network connectivity

**"CORS error"**
- Add frontend URL to ALLOWED_ORIGINS
- Redeploy backend after changes

**"SMS not sending"**
- Verify SMS provider credentials
- Check provider balance
- Review logs for errors

**"Email not sending"**
- Verify SMTP credentials
- Check Gmail app password
- Enable "Less secure app access" if needed

---

## Monitoring & Maintenance

### Health Checks

- Backend: `https://your-backend.onrender.com/api/health`
- ML Service: `https://your-ml-service.onrender.com/health`

### Logs

- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Deployments → View logs

### Performance

- Monitor response times
- Check database query performance
- Review error rates

### Updates

```bash
# Pull latest changes
git pull origin main

# Render and Vercel auto-deploy on push
git push origin main
```

---

## Security Checklist

- ✅ Change default super admin password
- ✅ Use strong JWT secrets (32+ characters)
- ✅ Enable HTTPS only
- ✅ Configure CORS properly
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting
- ✅ Regular database backups
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated

---

## Support

For issues:
1. Check logs in Render/Vercel dashboard
2. Review this guide
3. Check GitHub issues
4. Contact support

---

## Quick Reference

### Useful Commands

```bash
# Backend
npm run build          # Build for production
npm start             # Start production server
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database

# Frontend
npm run build         # Build Next.js app
npm start            # Start production server

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate deploy  # Deploy migrations
```

### URLs

- **Backend API**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/api-docs`
- **Web Dashboard**: `https://your-app.vercel.app`
- **ML Service**: `https://your-ml-service.onrender.com`

---

**Deployment Complete! 🚀**

Your SPTM application is now live and ready to use.
