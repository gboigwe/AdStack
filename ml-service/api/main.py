"""
FastAPI Application for Fraud Detection
Real-time inference API with blockchain integration
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import logging
from datetime import datetime

from ..models.fraud_detector import FraudDetector
from ..config import config
from .inference import InferenceService
from .blockchain import BlockchainService

logging.basicConfig(level=config.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AdStack Fraud Detection API",
    description="AI-powered fraud detection oracle with blockchain integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
inference_service: Optional[InferenceService] = None
blockchain_service: Optional[BlockchainService] = None


# Pydantic models
class TrafficData(BaseModel):
    """Traffic data for fraud detection"""
    campaign_id: int = Field(..., description="Campaign ID")
    publisher_id: str = Field(..., description="Publisher principal address")
    impressions: int = Field(..., ge=0, description="Number of impressions")
    clicks: int = Field(..., ge=0, description="Number of clicks")
    session_duration: int = Field(..., ge=0, description="Average session duration in seconds")
    bounce_rate: float = Field(..., ge=0.0, le=1.0, description="Bounce rate (0-1)")
    time_of_day: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0-6)")
    device_type: Optional[str] = Field(None, description="Device type")
    referrer_type: Optional[str] = Field(None, description="Referrer type")


class FraudPredictionResponse(BaseModel):
    """Fraud prediction response"""
    campaign_id: int
    publisher_id: str
    is_fraud: bool
    fraud_score: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    features_hash: str
    merkle_root: str
    timestamp: str
    model_version: str


class BatchPredictionRequest(BaseModel):
    """Batch prediction request"""
    traffic_data: List[TrafficData]


class ModelMetricsResponse(BaseModel):
    """Model performance metrics"""
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    deployment_time: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    blockchain_connected: bool
    timestamp: str


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global inference_service, blockchain_service

    logger.info("Starting Fraud Detection API...")

    try:
        # Initialize inference service
        inference_service = InferenceService(config.MODEL_PATH)
        logger.info("Inference service initialized")

        # Initialize blockchain service
        blockchain_service = BlockchainService(
            config.STACKS_API_URL,
            config.CONTRACT_ADDRESS,
            config.ORACLE_PRIVATE_KEY
        )
        logger.info("Blockchain service initialized")

        logger.info("API startup complete")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Fraud Detection API...")


# Dependency to get inference service
def get_inference_service() -> InferenceService:
    """Get inference service instance"""
    if inference_service is None:
        raise HTTPException(status_code=503, detail="Inference service not available")
    return inference_service


# Dependency to get blockchain service
def get_blockchain_service() -> BlockchainService:
    """Get blockchain service instance"""
    if blockchain_service is None:
        raise HTTPException(status_code=503, detail="Blockchain service not available")
    return blockchain_service


# API Endpoints

@app.get("/", response_model=Dict)
async def root():
    """Root endpoint"""
    return {
        "service": "AdStack Fraud Detection API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=inference_service is not None and inference_service.is_ready(),
        blockchain_connected=blockchain_service is not None and blockchain_service.is_connected(),
        timestamp=datetime.now().isoformat()
    )


@app.post("/predict", response_model=FraudPredictionResponse)
async def predict_fraud(
    data: TrafficData,
    inference: InferenceService = Depends(get_inference_service),
    blockchain: BlockchainService = Depends(get_blockchain_service)
):
    """
    Predict fraud for a single traffic instance

    Args:
        data: Traffic data for prediction

    Returns:
        Fraud prediction with score and confidence
    """
    try:
        # Make prediction
        result = await inference.predict(data.dict())

        # Submit to blockchain if fraud detected
        if result['is_fraud'] and result['confidence'] >= config.CONFIDENCE_THRESHOLD:
            tx_result = await blockchain.submit_fraud_prediction(
                campaign_id=data.campaign_id,
                publisher_id=data.publisher_id,
                fraud_score=int(result['fraud_score'] * 100),
                confidence=int(result['confidence'] * 100),
                risk_level=result['risk_level'],
                features_hash=result['features_hash'],
                merkle_root=result['merkle_root']
            )
            logger.info(f"Fraud prediction submitted to blockchain: {tx_result}")

        return FraudPredictionResponse(
            campaign_id=data.campaign_id,
            publisher_id=data.publisher_id,
            is_fraud=result['is_fraud'],
            fraud_score=result['fraud_score'],
            confidence=result['confidence'],
            risk_level=result['risk_level'],
            features_hash=result['features_hash'],
            merkle_root=result['merkle_root'],
            timestamp=datetime.now().isoformat(),
            model_version=config.MODEL_VERSION
        )

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch", response_model=List[FraudPredictionResponse])
async def predict_fraud_batch(
    request: BatchPredictionRequest,
    inference: InferenceService = Depends(get_inference_service)
):
    """
    Batch fraud prediction

    Args:
        request: Batch prediction request with multiple traffic instances

    Returns:
        List of fraud predictions
    """
    try:
        results = []

        for data in request.traffic_data:
            result = await inference.predict(data.dict())

            results.append(FraudPredictionResponse(
                campaign_id=data.campaign_id,
                publisher_id=data.publisher_id,
                is_fraud=result['is_fraud'],
                fraud_score=result['fraud_score'],
                confidence=result['confidence'],
                risk_level=result['risk_level'],
                features_hash=result['features_hash'],
                merkle_root=result['merkle_root'],
                timestamp=datetime.now().isoformat(),
                model_version=config.MODEL_VERSION
            ))

        return results

    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.get("/model/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics(
    inference: InferenceService = Depends(get_inference_service)
):
    """
    Get model performance metrics

    Returns:
        Model metrics including accuracy, precision, recall, F1
    """
    try:
        metrics = inference.get_metrics()

        return ModelMetricsResponse(
            model_version=config.MODEL_VERSION,
            accuracy=metrics.get('accuracy', 0.0),
            precision=metrics.get('precision', 0.0),
            recall=metrics.get('recall', 0.0),
            f1_score=metrics.get('f1_score', 0.0),
            deployment_time=metrics.get('deployment_time', '')
        )

    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@app.get("/model/features")
async def get_feature_importance(
    inference: InferenceService = Depends(get_inference_service)
):
    """
    Get feature importance rankings

    Returns:
        Feature importance scores
    """
    try:
        importance = inference.get_feature_importance()
        return importance

    except Exception as e:
        logger.error(f"Failed to get feature importance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get feature importance: {str(e)}")


@app.post("/model/reload")
async def reload_model(
    inference: InferenceService = Depends(get_inference_service)
):
    """
    Reload the ML model from disk

    Returns:
        Reload status
    """
    try:
        inference.reload_model()
        return {
            "status": "success",
            "message": "Model reloaded successfully",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Model reload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model reload failed: {str(e)}")


@app.get("/blockchain/status")
async def get_blockchain_status(
    blockchain: BlockchainService = Depends(get_blockchain_service)
):
    """
    Get blockchain connection status

    Returns:
        Blockchain status information
    """
    try:
        status = await blockchain.get_status()
        return status

    except Exception as e:
        logger.error(f"Failed to get blockchain status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get blockchain status: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        workers=config.API_WORKERS,
        reload=True
    )
