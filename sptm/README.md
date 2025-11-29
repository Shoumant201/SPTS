# SPTM - Smart Public Transport Management

A comprehensive monorepo for managing public transport operations with real-time tracking, intelligent routing, and multi-tier authentication system.

## 🚀 Features

- **Real-time Bus Tracking**: Live GPS tracking with ETA predictions
- **Multi-tier Authentication**: Secure role-based access control
- **Intelligent Routing**: AI-powered route optimization
- **Fleet Management**: Comprehensive vehicle and driver management
- **Mobile Apps**: Native iOS/Android apps for passengers and drivers
- **Web Dashboard**: Admin interface for fleet and organization management
- **ML-powered Analytics**: Demand forecasting and performance optimization

## 📁 Project Structure

```
sptm/
├── backend/           # Node.js + Express + PostgreSQL API
│   ├── src/           # Source code with controllers, services, middleware
│   ├── prisma/        # Database schema and migrations
│   └── docs/          # API documentation
├── passenger-app/     # React Native app for passengers
├── driver-app/        # React Native app for drivers  
├── web-dashboard/     # Next.js admin & company dashboard
├── ml-service/        # Python Flask ML service for ETA prediction
└── .kiro/            # Kiro IDE specifications and configurations
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **PostgreSQL** 14+
- **React Native CLI**
- **Android Studio** / **Xcode** (for mobile development)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. ML Service Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

ML service will run on `http://localhost:5000`

### 3. Web Dashboard Setup

```bash
cd web-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Dashboard will run on `http://localhost:3001`

### 4. Mobile Apps Setup

```bash
# Passenger App
cd passenger-app
npm install
npm start
npm run android  # or npm run ios

# Driver App  
cd driver-app
npm install
npm start
npm run android  # or npm run ios
```

## 🏗️ Architecture

### Backend API
- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Security**: Rate limiting, CORS, input validation
- **Documentation**: Auto-generated Swagger/OpenAPI

### Mobile Apps
- **Framework**: React Native + TypeScript
- **Navigation**: React Navigation
- **State Management**: React Context + hooks
- **Storage**: AsyncStorage for secure token storage
- **Maps**: Integration with mapping services

### Web Dashboard
- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Custom JWT-based auth
- **Charts**: Analytics and reporting dashboards

### ML Service
- **Framework**: Python Flask
- **Models**: ETA prediction, route optimization, demand forecasting
- **Data**: PostgreSQL + Redis caching
- **APIs**: RESTful endpoints for ML predictions

## 🔐 Authentication System

Multi-tier role-based authentication:

- **SUPER_ADMIN**: System-wide administration
- **ORGANIZATION_ADMIN**: Organization management
- **FLEET_MANAGER**: Fleet operations
- **DRIVER**: Driver-specific features
- **PASSENGER**: Basic user access

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd web-dashboard && npm test

# ML service tests
cd ml-service && python -m pytest
```

## 📚 Documentation

Each service has detailed documentation:
- [Backend API](./backend/README.md) - API endpoints and authentication
- [Web Dashboard](./web-dashboard/README.md) - Admin interface setup
- [Passenger App](./passenger-app/README.md) - Mobile app for passengers
- [Driver App](./driver-app/README.md) - Mobile app for drivers
- [ML Service](./ml-service/README.md) - Machine learning capabilities

## 🚀 Deployment

### Production Checklist
1. Set up production databases (PostgreSQL)
2. Configure environment variables
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging
6. Deploy services using Docker or cloud platforms

### Docker Deployment
```bash
# Build and run all services
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards for each service
4. Write tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the individual service READMEs
2. Review troubleshooting sections
3. Create an issue in the repository
