"""
DataGuard Pro Desktop Server
FastAPI server optimized for local desktop operation with SQLite
"""
from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import sys
import asyncio

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from desktop_database import desktop_db
from manual_removal_instructions import manual_removal_instructions

# Check if running in Electron mode
ELECTRON_MODE = os.environ.get('ELECTRON_MODE', 'false').lower() == 'true'

# Create the main app
app = FastAPI(title="DataGuard Pro Desktop API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class RemovalStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REQUIRES_MANUAL = "requires_manual"

class DataBrokerType(str, Enum):
    PEOPLE_SEARCH = "people_search"
    MARKETING = "marketing"
    BACKGROUND_CHECK = "background_check"
    PUBLIC_RECORDS = "public_records"
    SOCIAL_MEDIA = "social_media"

# Models
class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    current_address: str
    previous_addresses: List[str] = []
    date_of_birth: Optional[str] = None
    family_members: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    full_name: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    current_address: str
    previous_addresses: List[str] = []
    date_of_birth: Optional[str] = None
    family_members: List[str] = []

class DataBroker(BaseModel):
    id: str
    name: str
    website: str
    type: str
    removal_url: Optional[str] = None
    removal_method: str
    automation_available: bool = False
    removal_instructions: str
    verification_method: Optional[str] = None
    estimated_time: str
    success_rate: float = 0.0
    created_at: datetime

class RemovalRequest(BaseModel):
    id: str
    user_id: str
    data_broker_id: str
    status: RemovalStatus = RemovalStatus.PENDING
    method_used: str
    submitted_at: datetime
    completed_at: Optional[datetime] = None
    confirmation_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    retry_count: int = 0
    next_retry_at: Optional[datetime] = None

class RemovalRequestCreate(BaseModel):
    user_id: str
    data_broker_id: str

class RemovalSummary(BaseModel):
    total_brokers: int
    pending: int
    in_progress: int
    completed: int
    failed: int
    requires_manual: int
    success_rate: float

# API Routes
@api_router.get("/")
async def root():
    return {"message": "DataGuard Pro Desktop API", "version": "1.0.0", "mode": "desktop"}

@api_router.get("/status")
async def get_status():
    """Get application status"""
    try:
        # Test database connection
        brokers = await desktop_db.get_all_data_brokers()
        return {
            "status": "healthy",
            "database": "connected",
            "brokers_loaded": len(brokers),
            "mode": "desktop"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
            "mode": "desktop"
        }

# User Profile Endpoints
@api_router.post("/users", response_model=UserProfile)
async def create_user_profile(user_data: UserProfileCreate):
    """Create a new user profile"""
    try:
        user_dict = user_data.dict()
        result = await desktop_db.create_user_profile(user_dict)
        return UserProfile(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user profile: {str(e)}")

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    user = await desktop_db.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

@api_router.get("/users", response_model=List[UserProfile])
async def get_all_users():
    """Get all user profiles"""
    users = await desktop_db.get_all_user_profiles()
    return [UserProfile(**user) for user in users]

# Data Broker Endpoints
@api_router.get("/data-brokers", response_model=List[DataBroker])
async def get_data_brokers():
    """Get all data brokers"""
    brokers = await desktop_db.get_all_data_brokers()
    return [DataBroker(**broker) for broker in brokers]

@api_router.post("/data-brokers/initialize")
async def initialize_data_brokers():
    """Initialize data brokers database (called automatically on startup)"""
    try:
        await desktop_db.initialize_data_brokers()
        brokers = await desktop_db.get_all_data_brokers()
        return {"message": f"Data brokers initialized. Count: {len(brokers)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing data brokers: {str(e)}")

# Removal Request Endpoints
@api_router.post("/removal-requests", response_model=RemovalRequest)
async def create_removal_request(request_data: RemovalRequestCreate):
    """Create a new removal request"""
    # Verify user exists
    user = await desktop_db.get_user_profile(request_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get broker info
    brokers = await desktop_db.get_all_data_brokers()
    broker = next((b for b in brokers if b["id"] == request_data.data_broker_id), None)
    if not broker:
        raise HTTPException(status_code=404, detail="Data broker not found")
    
    try:
        request_dict = request_data.dict()
        request_dict["method_used"] = broker["removal_method"]
        
        result = await desktop_db.create_removal_request(request_dict)
        return RemovalRequest(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating removal request: {str(e)}")

@api_router.get("/removal-requests/user/{user_id}", response_model=List[RemovalRequest])
async def get_user_removal_requests(user_id: str):
    """Get all removal requests for a user"""
    requests = await desktop_db.get_user_removal_requests(user_id)
    return [RemovalRequest(**request) for request in requests]

@api_router.get("/removal-requests/summary/{user_id}", response_model=RemovalSummary)
async def get_removal_summary(user_id: str):
    """Get removal summary for a user"""
    summary = await desktop_db.get_removal_summary(user_id)
    return RemovalSummary(**summary)

@api_router.post("/removal-requests/bulk-create/{user_id}")
async def bulk_create_removal_requests(user_id: str):
    """Create removal requests for all data brokers for a user"""
    # Verify user exists
    user = await desktop_db.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        result = await desktop_db.bulk_create_removal_requests(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bulk removal requests: {str(e)}")

@api_router.put("/removal-requests/{request_id}/status")
async def update_removal_status(request_id: str, status: RemovalStatus, notes: Optional[str] = None):
    """Update removal request status"""
    update_data = {"status": status}
    
    if status == RemovalStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    if notes:
        update_data["notes"] = notes
    
    try:
        await desktop_db.update_removal_request(request_id, update_data)
        return {"message": "Status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating status: {str(e)}")

# Manual Instructions Endpoints
@api_router.get("/manual-instructions/{user_id}")
async def get_manual_instructions(user_id: str):
    """Get manual removal instructions for a user"""
    # Verify user exists
    user = await desktop_db.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get manual brokers
    all_brokers = await desktop_db.get_all_data_brokers()
    manual_brokers = [broker for broker in all_brokers if not broker.get("automation_available", False)]
    
    if not manual_brokers:
        return {
            "message": "No manual brokers found",
            "manual_brokers": []
        }
    
    # Generate comprehensive removal checklist
    checklist = manual_removal_instructions.generate_removal_checklist(user, manual_brokers)
    
    return {
        "user_id": user_id,
        "checklist": checklist
    }

@api_router.post("/manual-instructions/generate-email")
async def generate_email_template(user_id: str, broker_id: str):
    """Generate personalized email template for manual removal"""
    # Verify user exists
    user = await desktop_db.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get broker info
    all_brokers = await desktop_db.get_all_data_brokers()
    broker = next((b for b in all_brokers if b["id"] == broker_id), None)
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    # Generate email template
    email_template = manual_removal_instructions.generate_email_template(user, broker)
    
    return {
        "user_id": user_id,
        "broker_id": broker_id,
        "broker_name": broker["name"],
        "email_template": email_template
    }

# Include the router in the main app
app.include_router(api_router)

# Configure CORS for desktop app
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Allow all origins for desktop app
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    """Initialize database on startup"""
    try:
        await desktop_db.initialize()
        logger.info("Desktop database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_db():
    """Cleanup resources on shutdown"""
    try:
        await desktop_db.close()
        logger.info("Desktop database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Desktop app runs on localhost only
    uvicorn.run(
        app, 
        host="127.0.0.1",  # Localhost only for security
        port=8001,
        log_level="info"
    )