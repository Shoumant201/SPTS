# Backend API

Node.js Express API with TypeScript, PostgreSQL, and Prisma ORM for the SPTM system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Set up database:
```bash
npm run db:generate
npm run db:push
```

## Running the API

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Database Commands

### Generate Prisma Client
```bash
npm run db:generate
```

### Push schema to database
```bash
npm run db:push
```

### Run migrations
```bash
npm run db:migrate
```

### Open Prisma Studio
```bash
npm run db:studio
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/v1/status` - Service status

## Environment Variables

Configure the following in your `.env` file:
- DATABASE_URL: PostgreSQL connection string
- PORT: Server port (default: 3000)
- NODE_ENV: Environment (development/production)