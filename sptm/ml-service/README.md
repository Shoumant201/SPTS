# ML Service

Python Flask service for machine learning operations including ETA calculations.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

## Running the Service

### Development
```bash
python app.py
```

### Production (with Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

- `GET /ping` - Health check
- `GET /api/v1/status` - Service status
- `POST /api/v1/eta` - Calculate ETA for routes

## Environment Variables

Configure the following in your `.env` file:
- PORT: Service port (default: 5000)
- FLASK_ENV: Environment (development/production)

## Development

- Flask web framework
- NumPy and Pandas for data processing
- Scikit-learn for ML models
- Placeholder ETA calculation (ready for ML model integration)