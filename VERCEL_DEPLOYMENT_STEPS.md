# Vercel Deployment Steps for Web Dashboard

## Issue Fixed
Removed `vercel.json` - Vercel will auto-detect Next.js when Root Directory is configured properly.

## Required Vercel Configuration

### Configure in Vercel Dashboard (REQUIRED)

**IMPORTANT**: You MUST configure the Root Directory in Vercel dashboard for this to work.

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project (SPTS)
3. Go to **Settings** → **General**
4. Find **Root Directory** section
5. Click **Edit**
6. Set Root Directory to: `web-dashboard`
7. Click **Save**
8. Go to **Deployments** tab
9. Click **Redeploy** on the latest deployment (or push a new commit)

Vercel will now:
- Auto-detect Next.js framework
- Run `npm install` in the web-dashboard directory
- Run `npm run build` automatically
- Deploy the `.next` output directory

## Environment Variables to Add in Vercel

Go to **Settings** → **Environment Variables** and add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://your-app.onrender.com`) | Production |
| `NODE_ENV` | `production` | Production |

## Deployment Process

1. **Push to GitHub** (Already done ✓)
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically detect the push
   - Build will start automatically
   - Check deployment logs in Vercel dashboard

3. **Verify Deployment**
   - Once deployed, visit your Vercel URL
   - Test login functionality
   - Check browser console for any API connection errors

## Troubleshooting

### If build still fails:
1. Check Vercel build logs for specific errors
2. Ensure Root Directory is set to `web-dashboard`
3. Verify all environment variables are set
4. Check that `NEXT_PUBLIC_API_URL` points to your Render backend

### If app loads but API calls fail:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check CORS settings in backend (should allow your Vercel domain)
3. Ensure backend is deployed and running on Render

## Backend CORS Configuration

Make sure your backend allows requests from your Vercel domain. In `backend/src/index.ts`, the CORS should include:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',  // Add your Vercel URL
    // ... other origins
  ],
  credentials: true
}));
```

## Next Steps After Deployment

1. ✅ Frontend deployed to Vercel
2. ✅ Backend deployed to Render
3. 🔄 Seed database using HTTP endpoints (see `RENDER_FREE_TIER_SEEDING.md`)
4. 🔄 Test complete authentication flow
5. 🔄 Verify all features work end-to-end

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **Seeding Guide**: See `RENDER_FREE_TIER_SEEDING.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
