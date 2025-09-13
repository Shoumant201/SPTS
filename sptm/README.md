# SPTM - Smart Public Transport Management

A comprehensive monorepo for managing public transport operations including passenger and driver mobile apps, web dashboard, backend API, and ML services.

## Project Structure

```
sptm/
├── passenger-app/     # React Native app for passengers
├── driver-app/        # React Native app for drivers  
├── web-dashboard/     # Next.js admin & company dashboard
├── backend/           # Node.js + Express + PostgreSQL API
└── ml-service/        # Python Flask ML service for ETA
```

## Getting Started

Each subproject can be run independently. Navigate to the specific folder and follow the README instructions.

### Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL
- React Native CLI
- Android Studio / Xcode (for mobile development)

## Development Workflow

1. Start the backend API first
2. Start the ML service
3. Run the web dashboard
4. Run mobile apps on simulators/devices

## Environment Setup

Each subproject has its own `.env.example` file. Copy to `.env` and configure as needed.