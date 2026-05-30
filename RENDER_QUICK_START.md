# Render Free Tier - Quick Start Guide

## 🚀 After Deployment

Once your backend is deployed on Render, follow these steps:

### 1. Set SEED_KEY Environment Variable

1. Go to your Render dashboard
2. Click on your backend service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key**: `SEED_KEY`
   - **Value**: `sptm-seed-2024` (or any secure string)
6. Click **Save Changes**

The service will automatically redeploy.

### 2. Wait for Deployment

- Migrations run automatically during build
- Wait for "Deploy succeeded" message
- Check logs for any errors

### 3. Seed Database

Replace `your-backend-url` with your actual Render URL (e.g., `sptm-backend.onrender.com`)

#### Check Status:
```bash
curl https://your-backend-url.onrender.com/api/seed/status
```

#### Create Super Admin:
```bash
curl -X POST https://your-backend-url.onrender.com/api/seed/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@sptm.com",
    "password": "SuperAdmin123!",
    "name": "Super Administrator",
    "seedKey": "sptm-seed-2024"
  }'
```

#### Seed Demo Data (Optional):
```bash
curl -X POST https://your-backend-url.onrender.com/api/seed/demo-data \
  -H "Content-Type: application/json" \
  -d '{
    "seedKey": "sptm-seed-2024"
  }'
```

### 4. Test Backend

```bash
# Health check
curl https://your-backend-url.onrender.com/health

# API documentation
open https://your-backend-url.onrender.com/api-docs
```

### 5. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select `web-dashboard` as root directory
4. Add environment variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`
5. Click **Deploy**

### 6. Login to Web Dashboard

Visit your Vercel URL and login with:
- **Email**: `superadmin@sptm.com`
- **Password**: `SuperAdmin123!` (or what you set)

## 📝 Demo Accounts (if you seeded demo data)

### Web Dashboard
- **Admin**: admin@sptm.com / Admin123!
- **Org 1**: citybus@example.com / CityBus123!
- **Org 2**: metrotrans@example.com / Metro123!

### Driver App
- **Driver 1**: driver1@citybus.com / Driver123!
- **Driver 2**: driver2@metro.com / Driver123!

### Passenger App
- **Passenger 1**: passenger1@example.com / Pass123!
- **Passenger 2**: passenger2@example.com / Pass123!

## 🔧 Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify DATABASE_URL is set correctly
- Ensure migrations completed successfully

### Seeding fails
- Verify SEED_KEY matches exactly
- Check if super admin already exists
- Review Render logs for detailed errors

### Frontend can't connect
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running (free tier sleeps after inactivity)

## 📚 Full Documentation

- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Detailed Seeding Instructions](./RENDER_FREE_TIER_SEEDING.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## ⚠️ Important Notes

1. **Free Tier Limitations**:
   - Backend sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Database limited to 1GB storage

2. **Security**:
   - Change all demo passwords after setup
   - Keep SEED_KEY secure
   - Consider removing SEED_KEY after initial setup

3. **Migrations**:
   - Run automatically during deployment
   - No manual intervention needed
   - Check logs if tables are missing
