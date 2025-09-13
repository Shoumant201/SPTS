# Web Dashboard

Next.js 14 TypeScript application with TailwindCSS for admin and company dashboards.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env.local
```

## Running the App

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

## Development

- Next.js 14 with App Router
- TypeScript configured
- TailwindCSS for styling
- ESLint for code quality

## Environment Variables

Configure the following in your `.env.local` file:
- NEXT_PUBLIC_API_URL: Backend API endpoint
- DATABASE_URL: Database connection string
- NEXTAUTH_SECRET: Authentication secret