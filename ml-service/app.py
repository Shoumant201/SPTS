from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv

from services.eta_predictor import ETAPredictor
from models.eta_models import ETARequest, ETAResponse, TrainingDataRequest
from services.weather_service import WeatherService
from services.traffic_service import TrafficService

load_dotenv()

app = FastAPI(
    title="ML Service - ETA Prediction",
    description="Machine Learning service for estimating arrival times in ride-sharing platform",
    version="1.0.0"
)

# Initialize services
eta_predictor = ETAPredictor()
weather_service = WeatherService()
traffic_service = TrafficService()

@app.on_event("startup")
async def startup_event():
    """Initialize ML models on startup"""
    await eta_predictor.initialize()

@app.get("/")
async def root():
    return {"message": "ML Service - ETA Prediction API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-eta-prediction"}

@app.post("/predict-eta", response_model=ETAResponse)
async def predict_eta(request: ETARequest):
    """
    Predict estimated arrival time based on multiple factors
    """
    try:
        prediction = await eta_predictor.predict(request)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train-model")
async def train_model(data: TrainingDataRequest):
    """
    Train the ETA prediction model with new data
    """
    try:
        result = await eta_predictor.train_model(data)
        return {"message": "Model training completed", "metrics": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """
    Get information about the current model
    """
    return await eta_predictor.get_model_info()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )