# SPTM Web Dashboard

Next.js web application providing comprehensive management interface for administrators, fleet managers, and organization admins.

## Features

- 🏢 **Multi-tenant Organization Management**: Manage multiple transport organizations
- 👥 **User Management**: Admin, fleet manager, and driver account management
- 🚌 **Fleet Management**: Vehicle tracking, maintenance, and assignment
- 📊 **Real-time Analytics**: Live dashboards with transport metrics
- 🗺️ **Route Management**: Create, edit, and optimize bus routes
- 📱 **Driver Monitoring**: Real-time driver location and status
- 💰 **Financial Reporting**: Revenue tracking and payment analytics
- 🔐 **Role-based Access Control**: Secure multi-tier authentication
- 📈 **Performance Metrics**: KPIs and operational insights

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### Authentication

The dashboard supports multi-tier authentication:
- **Super Admin**: System-wide access
- **Organization Admin**: Organization-specific management
- **Fleet Manager**: Fleet operations and driver management

## Project Structure

```
web-dashboard/
├── src/
│   ├── app/             # Next.js 13+ app directory
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript definitions
├── public/              # Static assets
└── styles/              # Global styles (Tailwind CSS)
```

## Key Pages

- **Dashboard**: Overview with key metrics and real-time data
- **Fleet Management**: Vehicle inventory and tracking
- **Route Management**: Route creation and optimization
- **User Management**: Admin and driver account management
- **Analytics**: Detailed reports and performance metrics
- **Settings**: Organization and system configuration

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with accessibility
- **State Management**: React Context + hooks
- **Authentication**: Custom JWT-based auth
- **Charts**: Chart.js or similar for analytics
- **Maps**: Integration with mapping services

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

### Code Style

- Use TypeScript for type safety
- Follow Next.js best practices
- Use Tailwind CSS for styling
- Implement responsive design
- Follow accessibility guidelines

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

The dashboard can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Docker containers
- Traditional hosting

### Docker Deployment

```dockerfile
# Dockerfile included in project
docker build -t sptm-dashboard .
docker run -p 3000:3000 sptm-dashboard
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Contributing

1. Follow Next.js and React best practices
2. Use TypeScript for all new code
3. Implement responsive design
4. Write tests for new features
5. Follow the existing code structure