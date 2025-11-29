# SPTM ML Service

Python Flask microservice providing machine learning capabilities for intelligent transport management, including ETA prediction, route optimization, and demand forecasting.

## Features

- 🕐 **ETA Prediction**: Real-time arrival time estimation using traffic data
- 🗺️ **Route Optimization**: AI-powered route planning and optimization
- 📈 **Demand Forecasting**: Predict passenger demand patterns
- 🚌 **Fleet Analytics**: Performance metrics and optimization suggestions
- 🌐 **Traffic Analysis**: Real-time traffic pattern analysis
- 📊 **Predictive Maintenance**: Vehicle maintenance scheduling
- 🎯 **Dynamic Pricing**: Demand-based fare optimization

## Prerequisites

- Python 3.8+
- pip or conda
- PostgreSQL (for data storage)
- Redis (for caching, optional)

## Quick Start

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start the service
python app.py
```

The service will be available at `http://localhost:5000`

## Configuration

### Environment Variables

```env
# .env
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/sptm_ml
REDIS_URL=redis://localhost:6379/0
API_KEY=your-api-key-for-external-services
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## API Endpoints

### ETA Prediction
```http
POST /api/eta/predict
Content-Type: application/json

{
  "route_id": "route_123",
  "current_location": {"lat": 40.7128, "lng": -74.0060},
  "destination": {"lat": 40.7589, "lng": -73.9851},
  "traffic_conditions": "moderate"
}
```

### Route Optimization
```http
POST /api/routes/optimize
Content-Type: application/json

{
  "stops": [
    {"lat": 40.7128, "lng": -74.0060, "demand": 15},
    {"lat": 40.7589, "lng": -73.9851, "demand": 8}
  ],
  "constraints": {"max_duration": 120, "vehicle_capacity": 50}
}
```

## Project Structure

```
ml-service/
├── app.py                 # Flask application entry point
├── models/                # ML models and training scripts
│   ├── eta_predictor.py   # ETA prediction model
│   ├── route_optimizer.py # Route optimization algorithms
│   └── demand_forecaster.py # Demand prediction model
├── services/              # Business logic services
├── utils/                 # Utility functions
├── data/                  # Data processing and storage
├── tests/                 # Unit and integration tests
└── requirements.txt       # Python dependencies
```

## Machine Learning Models

### ETA Prediction Model
- **Algorithm**: Gradient Boosting with traffic data
- **Features**: Historical travel times, traffic conditions, weather, events
- **Accuracy**: ~85% within 2-minute window

### Route Optimization
- **Algorithm**: Genetic Algorithm + A* pathfinding
- **Optimization**: Minimize travel time and fuel consumption
- **Constraints**: Vehicle capacity, time windows, driver schedules

### Demand Forecasting
- **Algorithm**: LSTM Neural Network
- **Features**: Historical ridership, weather, events, seasonality
- **Prediction Window**: 1 hour to 7 days ahead

## Development

### Running Tests

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Run specific test file
python -m pytest tests/test_eta_prediction.py
```

### Training Models

```bash
# Train ETA prediction model
python models/train_eta_model.py

# Train demand forecasting model
python models/train_demand_model.py

# Evaluate model performance
python models/evaluate_models.py
```

### Data Pipeline

```bash
# Process historical data
python data/process_historical_data.py

# Update models with new data
python data/update_models.py
```

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t sptm-ml-service .

# Run container
docker run -p 5000:5000 --env-file .env sptm-ml-service
```

### Production Considerations

- Use Gunicorn for production WSGI server
- Implement model versioning and A/B testing
- Set up monitoring and logging
- Use Redis for caching predictions
- Implement rate limiting for API endpoints

## Monitoring

The service includes built-in monitoring endpoints:

- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/model-status` - Model performance metrics

## Contributing

1. Follow PEP 8 style guidelines
2. Write comprehensive tests for new features
3. Document all API endpoints
4. Use type hints for better code clarity
5. Validate model performance before deployment