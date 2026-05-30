# SPTM Deployment Checklist

Quick checklist for deploying SPTM to production.

---

## 🎯 Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API endpoints tested locally
- [ ] Frontend connects to backend successfully
- [ ] SMS provider configured (Sparrow SMS or Twilio)
- [ ] Email provider configured (Gmail SMTP)

---

## 🗄️ Database (Render PostgreSQL)

### Setup
- [ ] Create PostgreSQL database on Render
- [ ] Copy internal database URL
- [ ] Database region: Singapore (or closest)
- [ ] Plan: Free tier

### Configuration
- [ ] Database name: `sptm_production`
- [ ] User: `sptm_user`
- [ ] Connection string saved securely

---

## 🔧 Backend (Render Web Service)

### Deployment
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Root directory: `backend`
- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Start command: `npm start`
- [ ] Region: Singapore
- [ ] Plan: Free tier

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DATABASE_URL=<from-render-database>`
- [ ] `JWT_SECRET=<32-char-random-string>`
- [ ] `JWT_REFRESH_SECRET=<32-char-random-string>`
- [ ] `JWT_EXPIRES_IN=15m`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `ALLOWED_ORIGINS=<vercel-url>`
- [ ] `FRONTEND_URL=<vercel-url>`
- [ ] `SPARROW_SMS_TOKEN=<your-token>`
- [ ] `SPARROW_SMS_FROM=SPTM`
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_SECURE=false`
- [ ] `SMTP_USER=<your-gmail>`
- [ ] `SMTP_PASS=<gmail-app-password>`
- [ ] `SMTP_FROM=noreply@sptm.com`
- [ ] `APP_NAME=SPTM`
- [ ] `SWAGGER_ENABLED=true`

### Post-Deployment
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed licenses: `npm run db:seed:licenses`
- [ ] Create super admin account
- [ ] Test health endpoint: `/api/health`
- [ ] Test API docs: `/api-docs`
- [ ] Copy backend URL for frontend

---

## 🌐 Frontend (Vercel)

### Deployment
- [ ] Create new project on Vercel
- [ ] Import GitHub repository
- [ ] Framework: Next.js
- [ ] Root directory: `web-dashboard`
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL=<render-backend-url>`
- [ ] `NEXT_PUBLIC_APP_NAME=SPTM`

### Post-Deployment
- [ ] Copy Vercel URL
- [ ] Update backend CORS with Vercel URL
- [ ] Test login functionality
- [ ] Test API connectivity
- [ ] Configure custom domain (optional)

---

## 🤖 ML Service (Render - Optional)

### Deployment
- [ ] Create new Web Service on Render
- [ ] Root directory: `ml-service`
- [ ] Runtime: Python 3
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `python app.py`

### Environment Variables
- [ ] `FLASK_ENV=production`
- [ ] `PORT=5000`
- [ ] `OPENWEATHER_API_KEY=<optional>`
- [ ] `TOMTOM_API_KEY=<optional>`

### Post-Deployment
- [ ] Copy ML service URL
- [ ] Add to backend env: `ML_SERVICE_URL=<ml-url>`
- [ ] Test ETA prediction endpoint

---

## 🔐 Security Configuration

### Secrets Generation
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Gmail App Password
1. [ ] Enable 2-Factor Authentication on Gmail
2. [ ] Go to Google Account → Security → App Passwords
3. [ ] Generate new app password
4. [ ] Copy and save securely

### SMS Provider (Sparrow SMS)
1. [ ] Sign up at sparrowsms.com
2. [ ] Get API token
3. [ ] Add credits to account
4. [ ] Test SMS sending

---

## ✅ Post-Deployment Verification

### Backend Tests
- [ ] Health check: `https://your-backend.onrender.com/api/health`
- [ ] API docs: `https://your-backend.onrender.com/api-docs`
- [ ] Test login endpoint
- [ ] Test OTP sending
- [ ] Check database connection
- [ ] Review deployment logs

### Frontend Tests
- [ ] Homepage loads: `https://your-app.vercel.app`
- [ ] Login page works
- [ ] Can authenticate
- [ ] Dashboard displays
- [ ] API calls succeed
- [ ] No console errors

### Integration Tests
- [ ] Frontend → Backend communication
- [ ] Database queries work
- [ ] SMS sending works
- [ ] Email sending works
- [ ] File uploads work (if applicable)
- [ ] Real-time features work

---

## 📱 Mobile Apps Configuration

### Update API URLs
- [ ] Update `passenger-app/src/config/api.ts`
- [ ] Update `driver-app/src/config/api.ts`
- [ ] Change `API_BASE_URL` to production backend URL
- [ ] Test mobile apps with production backend

---

## 🔄 Update Backend CORS

After getting Vercel URL, update backend:

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Then redeploy backend service.

---

## 📊 Monitoring Setup

### Render
- [ ] Enable email notifications
- [ ] Set up health check alerts
- [ ] Monitor resource usage
- [ ] Check deployment logs regularly

### Vercel
- [ ] Enable deployment notifications
- [ ] Monitor build times
- [ ] Check analytics
- [ ] Review error logs

---

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- Check environment variables
- Verify DATABASE_URL
- Review build logs
- Check Node version (18+)

**Database connection fails:**
- Verify DATABASE_URL format
- Check database is running
- Test connection in Render shell

**Frontend can't reach backend:**
- Verify NEXT_PUBLIC_API_URL
- Check CORS settings
- Ensure backend is deployed

**SMS not sending:**
- Verify SMS provider credentials
- Check account balance
- Review error logs

---

## 📝 Final Steps

- [ ] Change default admin password
- [ ] Document all URLs and credentials
- [ ] Share access with team
- [ ] Set up monitoring alerts
- [ ] Create backup schedule
- [ ] Document deployment process
- [ ] Test all critical features
- [ ] Announce deployment to users

---

## 🎉 Deployment Complete!

Your SPTM application is now live:

- **Backend API**: `https://your-backend.onrender.com`
- **Web Dashboard**: `https://your-app.vercel.app`
- **API Documentation**: `https://your-backend.onrender.com/api-docs`

---

## 📞 Support

If you encounter issues:
1. Check deployment logs
2. Review environment variables
3. Consult DEPLOYMENT_GUIDE.md
4. Contact support team

---

**Last Updated**: May 30, 2026
