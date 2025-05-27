from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import asyncio
from automation_engine import automation_engine

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Data Broker Removal API")

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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    website: str
    type: DataBrokerType
    removal_url: Optional[str] = None
    removal_method: str  # "automated", "form", "email", "phone", "mail"
    automation_available: bool = False
    removal_instructions: str
    verification_method: Optional[str] = None
    estimated_time: str  # "instant", "24h", "3-5 days", "2-3 weeks"
    success_rate: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RemovalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    data_broker_id: str
    status: RemovalStatus = RemovalStatus.PENDING
    method_used: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
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

# Initialize data brokers
INITIAL_DATA_BROKERS = [
    {
        "name": "Whitepages",
        "website": "whitepages.com",
        "type": "people_search",
        "removal_url": "https://www.whitepages.com/suppression_requests",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "Fill out online opt-out form with name, address, and phone number",
        "verification_method": "email_confirmation",
        "estimated_time": "24h"
    },
    {
        "name": "Spokeo",
        "website": "spokeo.com",
        "type": "people_search",
        "removal_url": "https://www.spokeo.com/optout",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "Search for your profile, then use opt-out form",
        "verification_method": "email_confirmation",
        "estimated_time": "3-5 days"
    },
    {
        "name": "BeenVerified",
        "website": "beenverified.com",
        "type": "background_check",
        "removal_url": "https://www.beenverified.com/app/optout/search",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "Search for profile and submit opt-out request",
        "verification_method": "email_confirmation",
        "estimated_time": "24h"
    },
    {
        "name": "PeopleFinder",
        "website": "peoplefinder.com",
        "type": "people_search",
        "removal_url": "https://www.peoplefinder.com/optout.php",
        "removal_method": "form",
        "automation_available": False,
        "removal_instructions": "Manual form submission required with ID verification",
        "verification_method": "manual_review",
        "estimated_time": "2-3 weeks"
    },
    {
        "name": "Intelius",
        "website": "intelius.com",
        "type": "background_check",
        "removal_url": "https://www.intelius.com/optout",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "Online opt-out form with email verification",
        "verification_method": "email_confirmation",
        "estimated_time": "24h"
    },
    {
        "name": "TruePeopleSearch",
        "website": "truepeoplesearch.com",
        "type": "people_search",
        "removal_url": "https://www.truepeoplesearch.com/removal",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "Find your listing and submit removal request",
        "verification_method": "email_confirmation",
        "estimated_time": "24h"
    },
    {
        "name": "FamilyTreeNow",
        "website": "familytreenow.com",
        "type": "people_search",
        "removal_url": "https://www.familytreenow.com/optout",
        "removal_method": "form",
        "automation_available": False,
        "removal_instructions": "Manual opt-out process with identity verification",
        "verification_method": "manual_review",
        "estimated_time": "2-3 weeks"
    },
    {
        "name": "MyLife",
        "website": "mylife.com",
        "type": "people_search",
        "removal_url": "https://www.mylife.com/ccpa",
        "removal_method": "form",
        "automation_available": True,
        "removal_instructions": "CCPA opt-out form available",
        "verification_method": "email_confirmation",
        "estimated_time": "3-5 days"
    }
]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Data Broker Removal API", "version": "1.0.0"}

@api_router.post("/users", response_model=UserProfile)
async def create_user_profile(user_data: UserProfileCreate):
    """Create a new user profile"""
    user_dict = user_data.dict()
    user_obj = UserProfile(**user_dict)
    await db.user_profiles.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

@api_router.put("/users/{user_id}", response_model=UserProfile)
async def update_user_profile(user_id: str, user_data: UserProfileCreate):
    """Update user profile"""
    user_dict = user_data.dict()
    user_dict["updated_at"] = datetime.utcnow()
    
    result = await db.user_profiles.update_one(
        {"id": user_id}, 
        {"$set": user_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.user_profiles.find_one({"id": user_id})
    return UserProfile(**updated_user)

@api_router.get("/data-brokers", response_model=List[DataBroker])
async def get_data_brokers():
    """Get all data brokers"""
    brokers = await db.data_brokers.find().to_list(1000)
    return [DataBroker(**broker) for broker in brokers]

@api_router.post("/data-brokers/initialize")
async def initialize_data_brokers():
    """Initialize data brokers database"""
    # Check if already initialized
    existing_count = await db.data_brokers.count_documents({})
    if existing_count > 0:
        return {"message": f"Data brokers already initialized. Count: {existing_count}"}
    
    # Insert initial data brokers
    broker_objects = []
    for broker_data in INITIAL_DATA_BROKERS:
        broker_obj = DataBroker(**broker_data)
        broker_objects.append(broker_obj.dict())
    
    await db.data_brokers.insert_many(broker_objects)
    return {"message": f"Initialized {len(broker_objects)} data brokers"}

@api_router.post("/removal-requests", response_model=RemovalRequest)
async def create_removal_request(request_data: RemovalRequestCreate):
    """Create a new removal request"""
    # Verify user exists
    user = await db.user_profiles.find_one({"id": request_data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify data broker exists
    broker = await db.data_brokers.find_one({"id": request_data.data_broker_id})
    if not broker:
        raise HTTPException(status_code=404, detail="Data broker not found")
    
    # Check if request already exists
    existing_request = await db.removal_requests.find_one({
        "user_id": request_data.user_id,
        "data_broker_id": request_data.data_broker_id
    })
    
    if existing_request:
        return RemovalRequest(**existing_request)
    
    # Create new request
    request_dict = request_data.dict()
    request_dict["method_used"] = broker["removal_method"]
    
    request_obj = RemovalRequest(**request_dict)
    await db.removal_requests.insert_one(request_obj.dict())
    return request_obj

@api_router.get("/removal-requests/user/{user_id}", response_model=List[RemovalRequest])
async def get_user_removal_requests(user_id: str):
    """Get all removal requests for a user"""
    requests = await db.removal_requests.find({"user_id": user_id}).to_list(1000)
    return [RemovalRequest(**request) for request in requests]

@api_router.get("/removal-requests/summary/{user_id}", response_model=RemovalSummary)
async def get_removal_summary(user_id: str):
    """Get removal summary for a user"""
    # Get total number of data brokers
    total_brokers = await db.data_brokers.count_documents({})
    
    # Get user's removal requests
    requests = await db.removal_requests.find({"user_id": user_id}).to_list(1000)
    
    # Count by status
    status_counts = {
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
        "failed": 0,
        "requires_manual": 0
    }
    
    for request in requests:
        status = request.get("status", "pending")
        if status in status_counts:
            status_counts[status] += 1
    
    # Calculate success rate
    total_requests = len(requests)
    completed = status_counts["completed"]
    success_rate = (completed / total_requests * 100) if total_requests > 0 else 0.0
    
    return RemovalSummary(
        total_brokers=total_brokers,
        pending=status_counts["pending"],
        in_progress=status_counts["in_progress"],
        completed=status_counts["completed"],
        failed=status_counts["failed"],
        requires_manual=status_counts["requires_manual"],
        success_rate=round(success_rate, 1)
    )

@api_router.put("/removal-requests/{request_id}/status")
async def update_removal_status(request_id: str, status: RemovalStatus, notes: Optional[str] = None):
    """Update removal request status"""
    update_data = {"status": status, "updated_at": datetime.utcnow()}
    
    if status == RemovalStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    
    if notes:
        update_data["notes"] = notes
    
    result = await db.removal_requests.update_one(
        {"id": request_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Removal request not found")
    
    return {"message": "Status updated successfully"}

@api_router.post("/removal-requests/bulk-create/{user_id}")
async def bulk_create_removal_requests(user_id: str):
    """Create removal requests for all data brokers for a user"""
    # Verify user exists
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all data brokers
    brokers = await db.data_brokers.find().to_list(1000)
    
    created_requests = []
    for broker in brokers:
        # Check if request already exists
        existing_request = await db.removal_requests.find_one({
            "user_id": user_id,
            "data_broker_id": broker["id"]
        })
        
        if not existing_request:
            request_obj = RemovalRequest(
                user_id=user_id,
                data_broker_id=broker["id"],
                method_used=broker["removal_method"]
            )
            await db.removal_requests.insert_one(request_obj.dict())
            created_requests.append(request_obj)
    
    return {
        "message": f"Created {len(created_requests)} removal requests",
        "total_brokers": len(brokers),
        "new_requests": len(created_requests)
    }

@api_router.post("/removal-requests/process-automated/{user_id}")
async def process_automated_removals(user_id: str):
    """Process automated removal requests for a user"""
    # Verify user exists
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all data brokers with automation available
    brokers = await db.data_brokers.find({"automation_available": True}).to_list(1000)
    
    if not brokers:
        return {
            "message": "No automated brokers available",
            "processed": 0
        }
    
    try:
        # Process automated removals
        results = await automation_engine.batch_process_removals(user, brokers)
        
        # Update removal requests with results
        processed_count = 0
        for result in results:
            broker_id = result.get('broker_id')
            if broker_id:
                # Find the removal request
                request = await db.removal_requests.find_one({
                    "user_id": user_id,
                    "data_broker_id": broker_id
                })
                
                if request:
                    # Update status based on automation result
                    if result['success']:
                        status = result.get('status', 'in_progress')
                    else:
                        status = result.get('status', 'failed')
                    
                    update_data = {
                        "status": status,
                        "notes": result.get('message', ''),
                        "confirmation_details": {
                            "automation_result": result,
                            "processed_at": datetime.utcnow().isoformat()
                        }
                    }
                    
                    if status == 'completed':
                        update_data["completed_at"] = datetime.utcnow()
                    
                    await db.removal_requests.update_one(
                        {"id": request["id"]}, 
                        {"$set": update_data}
                    )
                    processed_count += 1
        
        return {
            "message": f"Processed {processed_count} automated removal requests",
            "total_brokers": len(brokers),
            "processed": processed_count,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error processing automated removals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Automation processing failed: {str(e)}")

@api_router.get("/removal-requests/automation-status/{user_id}")
async def get_automation_status(user_id: str):
    """Get automation status for a user's removal requests"""
    # Get user's removal requests
    requests = await db.removal_requests.find({"user_id": user_id}).to_list(1000)
    
    # Get broker information
    broker_ids = [req["data_broker_id"] for req in requests]
    brokers = await db.data_brokers.find({"id": {"$in": broker_ids}}).to_list(1000)
    broker_map = {broker["id"]: broker for broker in brokers}
    
    # Categorize by automation capability
    automated_brokers = []
    manual_brokers = []
    
    for request in requests:
        broker = broker_map.get(request["data_broker_id"])
        if broker:
            broker_info = {
                "broker_name": broker["name"],
                "broker_id": broker["id"],
                "status": request["status"],
                "automation_available": broker.get("automation_available", False),
                "removal_method": broker.get("removal_method"),
                "submitted_at": request["submitted_at"],
                "notes": request.get("notes")
            }
            
            if broker.get("automation_available"):
                automated_brokers.append(broker_info)
            else:
                manual_brokers.append(broker_info)
    
    return {
        "user_id": user_id,
        "total_requests": len(requests),
        "automated_brokers": {
            "count": len(automated_brokers),
            "brokers": automated_brokers
        },
        "manual_brokers": {
            "count": len(manual_brokers),
            "brokers": manual_brokers
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
async def startup_db_client():
    """Initialize automation engine on startup"""
    try:
        await automation_engine.start()
        logger.info("Automation engine started successfully")
    except Exception as e:
        logger.error(f"Error starting automation engine: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup resources on shutdown"""
    try:
        await automation_engine.stop()
        logger.info("Automation engine stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping automation engine: {str(e)}")
    
    client.close()
