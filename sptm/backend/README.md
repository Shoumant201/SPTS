# SPTM Backend API

Node.js + Express + PostgreSQL API with comprehensive authentication and authorization for Smart Public Transport Management.

## Features

- 🔐 Multi-tier JWT Authentication with refresh tokens
- 👥 Role-based access control (RBAC) 
- 🏢 Multi-tenant organization support
- 🛡️ Advanced security (Rate limiting, Account lockout, CORS)
- ✅ Input validation with comprehensive error handling
- 🔒 Secure password hashing with bcrypt
- 📊 Prisma ORM with PostgreSQL
- 📖 Auto-generated Swagger API documentation
- 🧪 Comprehensive test coverage

## User Roles & Hierarchy

- **SUPER_ADMIN**: System-wide administration
- **ORGANIZATION_ADMIN**: Organization management
- **FLEET_MANAGER**: Fleet operations management
- **DRIVER**: Driver-specific features
- **PASSENGER**: Basic user access

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed

# Start development server
npm run dev
```

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- API Health: `http://localhost:3000/health`

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, security
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (JWT, password, etc.)
│   ├── types/           # TypeScript definitions
│   └── schemas/         # Validation schemas
├── prisma/              # Database schema & migrations
├── scripts/             # Deployment & maintenance scripts
└── docs/                # Additional documentation
```

## Security Features

- **Rate Limiting**: Per-user type and endpoint
- **Account Lockout**: Automatic lockout after failed attempts
- **Password Policy**: Strength validation and hashing
- **Security Logging**: Comprehensive audit trail
- **Input Validation**: All endpoints validated
- **Error Handling**: Standardized secure responses

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run security tests
npm run test:security
```

## Deployment

See `DEPLOYMENT_CHECKLIST.md` for production deployment steps.

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sptm
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
PORT=3000
```
- **ORGANIZATION**: Organization-level access
- **ADMIN**: Organization admin access
- **SUPER_ADMIN**: Full system access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sptm_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
```

4. Set up database:
```bash
npm run db:generate
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

The server will run on http://localhost:3001

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /change-password` - Change password

### Organizations (`/api/organizations`)
- `GET /` - Get all organizations (Super Admin)
- `POST /` - Create organization (Super Admin)
- `GET /:id` - Get organization details
- `PUT /:id` - Update organization
- `GET /:id/users` - Get organization users
- `GET /:id/vehicles` - Get organization vehicles

## Testing

Test the authentication system:
```bash
npx tsx src/test-auth.ts
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Refresh token rotation
- Rate limiting on authentication endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization