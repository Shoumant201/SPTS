# Database Seeding on Render Free Tier

Since Render's free tier doesn't provide shell access, we've created HTTP endpoints for database seeding.

## Prerequisites

1. Backend deployed on Render
2. PostgreSQL database connected
3. Migrations automatically run during deployment

## Setup SEED_KEY

1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to **Environment** tab
4. Add a new environment variable:
   - **Key**: `SEED_KEY`
   - **Value**: A secure random string (e.g., `my-secret-seed-key-2024`)
5. Click **Save Changes** (service will redeploy)

## Seeding Steps

### Step 1: Check Database Status

```bash
curl https://your-backend-url.onrender.com/api/seed/status
```

Response:
```json
{
  "success": true,
  "database": {
    "superAdmins": 0,
    "admins": 0,
    "organizations": 0,
    "drivers": 0,
    "passengers": 0,
    "vehicles": 0,
    "routes": 0
  },
  "isEmpty": true,
  "needsSeeding": true
}
```

### Step 2: Create Super Admin

```bash
curl -X POST https://your-backend-url.onrender.com/api/seed/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@sptm.com",
    "password": "YourSecurePassword123!",
    "name": "Super Administrator",
    "seedKey": "your-seed-key-from-render"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Super admin created successfully",
  "superAdmin": {
    "id": "...",
    "email": "superadmin@sptm.com",
    "name": "Super Administrator",
    "isActive": true,
    "createdAt": "..."
  }
}
```

### Step 3: Seed Demo Data (Optional)

```bash
curl -X POST https://your-backend-url.onrender.com/api/seed/demo-data \
  -H "Content-Type: application/json" \
  -d '{
    "seedKey": "your-seed-key-from-render"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "summary": {
    "organizations": 2,
    "admins": 1,
    "drivers": 2,
    "passengers": 2,
    "vehicles": 2,
    "routes": 2
  },
  "credentials": {
    "admin": { "email": "admin@sptm.com", "password": "Admin123!" },
    "organization1": { "email": "citybus@example.com", "password": "CityBus123!" },
    "organization2": { "email": "metrotrans@example.com", "password": "Metro123!" },
    "driver1": { "email": "driver1@citybus.com", "password": "Driver123!" },
    "driver2": { "email": "driver2@metro.com", "password": "Driver123!" },
    "passenger1": { "email": "passenger1@example.com", "password": "Pass123!" },
    "passenger2": { "email": "passenger2@example.com", "password": "Pass123!" }
  }
}
```

## Using Postman or Thunder Client

### 1. Check Status
- **Method**: GET
- **URL**: `https://your-backend-url.onrender.com/api/seed/status`

### 2. Create Super Admin
- **Method**: POST
- **URL**: `https://your-backend-url.onrender.com/api/seed/super-admin`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "superadmin@sptm.com",
  "password": "YourSecurePassword123!",
  "name": "Super Administrator",
  "seedKey": "your-seed-key-from-render"
}
```

### 3. Seed Demo Data
- **Method**: POST
- **URL**: `https://your-backend-url.onrender.com/api/seed/demo-data`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "seedKey": "your-seed-key-from-render"
}
```

## Demo Accounts Created

After seeding demo data, you can login with these accounts:

### Web Dashboard (https://your-frontend-url.vercel.app)

**Super Admin:**
- Email: `superadmin@sptm.com`
- Password: (the one you set in Step 2)

**Admin:**
- Email: `admin@sptm.com`
- Password: `Admin123!`

**Organization 1 (City Bus Services):**
- Email: `citybus@example.com`
- Password: `CityBus123!`

**Organization 2 (Metro Transit):**
- Email: `metrotrans@example.com`
- Password: `Metro123!`

### Driver App

**Driver 1 (City Bus):**
- Email: `driver1@citybus.com`
- Password: `Driver123!`

**Driver 2 (Metro):**
- Email: `driver2@metro.com`
- Password: `Driver123!`

### Passenger App

**Passenger 1:**
- Email: `passenger1@example.com`
- Password: `Pass123!`

**Passenger 2:**
- Email: `passenger2@example.com`
- Password: `Pass123!`

## Security Notes

1. **SEED_KEY Protection**: The SEED_KEY environment variable protects these endpoints from unauthorized access
2. **One-time Super Admin**: The super admin endpoint can only be called once (prevents duplicates)
3. **Production Use**: After seeding, you may want to:
   - Remove the SEED_KEY environment variable
   - Or keep it for future seeding needs
4. **Change Passwords**: Change all demo passwords after initial setup

## Troubleshooting

### Error: "Invalid seed key"
- Verify SEED_KEY is set in Render environment variables
- Ensure you're using the exact same value in your request

### Error: "Super admin already exists"
- Super admin has already been created
- Use the existing super admin account to create other accounts via the web dashboard

### Error: "Failed to seed demo data"
- Check the response for specific error details
- Verify database connection is working
- Check Render logs for detailed error messages

## Alternative: Manual Account Creation

If you prefer not to use seeding endpoints, you can:

1. Create super admin via the seed endpoint (required for first account)
2. Login to web dashboard as super admin
3. Use the UI to create:
   - Admins
   - Organizations
   - Other accounts

## Migrations

Migrations run automatically during deployment via the build command:
```bash
npm install && npx prisma generate && npm run build
```

Prisma automatically applies pending migrations when connecting to the database.
