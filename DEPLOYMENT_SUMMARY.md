# SPTM Deployment Summary

Quick reference for deploying SPTM to production.

---

## 🚀 Quick Start

### 1. Deploy Backend to Render (5 minutes)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Create PostgreSQL Database:
   - Click "New +" → "PostgreSQL"
   - Name: `sptm-db`
   - Region: Singapore
   - Plan: Free
   - **Copy the Internal Database URL**

3. Create Web Service:
   - Click "New +" → "Web Service"
   - Connect repository: `SPTS`
   - Root Directory: `backend`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Add environment variables (see below)

4. After deployment, open Shell and run:
   ```bash
   npx prisma migrate deploy
   npm run db:seed:licenses
   ```

### 2. Deploy Frontend to Vercel (3 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click "Add New..." → "Project"
3. Import repository: `SPTS`
4. Configure:
   - Framework: Next.js
   - Root Directory: `web-dashboard`
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
     NEXT_PUBLIC_APP_NAME=SPTM
     ```
5. Click "Deploy"

### 3. Update Backend CORS

Go back to Render → Backend → Environment:
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```
Redeploy backend.

---

## 🔑 Required Environment Variables

### Backend (Render)

**Essential:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<from-render-database>
JWT_SECRET=<generate-32-char-random>
JWT_REFRESH_SECRET=<generate-32-char-random>
ALLOWED_ORIGINS=<your-vercel-url>
FRONTEND_URL=<your-vercel-url>
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**SMS (Sparrow SMS for Nepal):**
```bash
SPARROW_SMS_TOKEN=<your-token>
SPARROW_SMS_FROM=SPTM
```

**Email (Gmail):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-gmail>
SMTP_PASS=<gmail-app-password>
SMTP_FROM=noreply@sptm.com
```

**Optional:**
```bash
APP_NAME=SPTM
SWAGGER_ENABLED=true
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_NAME=SPTM
```

---

## 📱 Update Mobile Apps

After deployment, update API URLs in mobile apps:

**passenger-app/src/config/api.ts:**
```typescript
export const API_BASE_URL = 'https://your-backend.onrender.com';
```

**driver-app/src/config/api.ts:**
```typescript
export const API_BASE_URL = 'https://your-backend.onrender.com';
```

---

## ✅ Verification Steps

1. **Backend Health Check:**
   ```
   https://your-backend.onrender.com/api/health
   ```
   Should return: `{"status":"OK"}`

2. **API Documentation:**
   ```
   https://your-backend.onrender.com/api-docs
   ```

3. **Frontend:**
   ```
   https://your-app.vercel.app
   ```
   Should load login page

4. **Test Login:**
   - Create super admin (see below)
   - Login with credentials
   - Verify dashboard loads

---

## 👤 Create Super Admin

In Render backend Shell:

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

**Login Credentials:**
- Email: `admin@sptm.com`
- Password: `Admin@123`
- **⚠️ Change password immediately after first login!**

---

## 🔧 Common Issues & Solutions

### Backend won't start
- Check all environment variables are set
- Verify DATABASE_URL is correct
- Check build logs in Render

### Database connection error
- Ensure DATABASE_URL uses internal URL (not external)
- Verify database is running
- Check region matches

### Frontend can't reach backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Ensure backend is deployed and running

### SMS not sending
- Verify Sparrow SMS token
- Check account balance
- Test with development mode first

---

## 📊 Deployment URLs

After deployment, you'll have:

- **Backend API**: `https://sptm-backend-xxxx.onrender.com`
- **Web Dashboard**: `https://sptm-xxxx.vercel.app`
- **API Docs**: `https://sptm-backend-xxxx.onrender.com/api-docs`
- **Database**: Managed by Render

---

## 🎯 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Update CORS settings
4. ✅ Create super admin
5. ✅ Test login
6. ✅ Update mobile app URLs
7. ✅ Configure SMS provider
8. ✅ Configure email
9. ✅ Test all features
10. ✅ Change default passwords

---

## 📚 Documentation

- **Full Guide**: `DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `web-dashboard/README.md`

---

## 🆘 Need Help?

1. Check deployment logs in Render/Vercel
2. Review environment variables
3. Consult DEPLOYMENT_GUIDE.md
4. Check GitHub issues

---

**Estimated Total Time**: 10-15 minutes

**Cost**: $0 (using free tiers)

**Status**: Ready to deploy! 🚀
