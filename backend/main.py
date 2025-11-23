from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os
import logging
import time
import base64
from typing import Optional, Dict, Any

from models.text_detector import TextDetector
from models.image_detector import ImageDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Detection API",
    description="API for detecting AI-generated text and images",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances (loaded on startup)
text_detector = None
image_detector = None


# Pydantic models for request/response
class TextDetectionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")


class ImageDetectionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image data")


class DetectionResponse(BaseModel):
    is_ai_generated: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    model_name: str
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    global text_detector, image_detector
    
    try:
        logger.info("Loading AI detection models...")
        text_detector = TextDetector()
        image_detector = ImageDetector()
        logger.info("✅ All models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        # Continue anyway - endpoints will handle missing models


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Detection API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "detect_text": "/api/detect/text",
            "detect_image": "/api/detect/image"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": {
            "text": "loaded" if text_detector else "not_loaded",
            "image": "loaded" if image_detector else "not_loaded"
        },
        "version": "1.0.0"
    }


@app.post("/api/detect/text", response_model=DetectionResponse)
async def detect_text(request: TextDetectionRequest):
    """
    Detect if text is AI-generated
    
    Args:
        request: TextDetectionRequest with text to analyze
        
    Returns:
        DetectionResponse with detection results
    """
    if not text_detector:
        raise HTTPException(status_code=503, detail="Text detection model not loaded")
    
    start_time = time.time()
    
    try:
        # Validate input
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Run detection
        result = text_detector.detect(request.text)
        processing_time = time.time() - start_time
        
        # Check for errors in result
        if "error" in result and result["error"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return DetectionResponse(
            is_ai_generated=result["is_ai_generated"],
            confidence=result["confidence"],
            processing_time=processing_time,
            model_name=result["model_name"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in text detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect/image", response_model=DetectionResponse)
async def detect_image(request: ImageDetectionRequest):
    """
    Detect if image is AI-generated
    
    Args:
        request: ImageDetectionRequest with base64 encoded image
        
    Returns:
        DetectionResponse with detection results
    """
    if not image_detector:
        raise HTTPException(status_code=503, detail="Image detection model not loaded")
    
    start_time = time.time()
    
    try:
        # Decode base64 image
        try:
            # Remove data URL prefix if present
            if "," in request.image:
                image_data = request.image.split(",")[1]
            else:
                image_data = request.image
            
            image_bytes = base64.b64decode(image_data)
            
            # Validate image size (max 10MB)
            if len(image_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        # Run detection
        result = image_detector.detect(image_bytes)
        processing_time = time.time() - start_time
        
        # Check for errors in result
        if "error" in result and result["error"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return DetectionResponse(
            is_ai_generated=result["is_ai_generated"],
            confidence=result["confidence"],
            processing_time=processing_time,
            model_name=result["model_name"],
            details=result.get("details")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in image detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host=host, port=port)
