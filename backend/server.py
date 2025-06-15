from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
import requests
from playwright.async_api import async_playwright

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dataguard_pro')]

# FastAPI app
app = FastAPI(title="DataGuard Pro API", description="Privacy Protection & Data Broker Removal Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
api_router = APIRouter(prefix="/api")

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data Models
class PersonalInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: Optional[str] = None
    addresses: List[Dict[str, str]] = []

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personal_info: PersonalInfo
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RemovalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    broker_name: str
    removal_type: str  # 'automated' or 'manual'
    status: str = 'pending'  # pending, in_progress, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    removal_url: Optional[str] = None
    confirmation_code: Optional[str] = None

# Data Broker Configurations
DATA_BROKERS = {
    "whitepages": {
        "name": "Whitepages",
        "type": "automated",
        "removal_url": "https://www.whitepages.com/suppression-requests",
        "description": "Major people search engine"
    },
    "spokeo": {
        "name": "Spokeo", 
        "type": "automated",
        "removal_url": "https://www.spokeo.com/optout",
        "description": "People search and background check service"
    },
    "beenverified": {
        "name": "BeenVerified",
        "type": "automated", 
        "removal_url": "https://www.beenverified.com/app/optout/search",
        "description": "Background check and people search"
    },
    "intelius": {
        "name": "Intelius",
        "type": "automated",
        "removal_url": "https://www.intelius.com/optout",
        "description": "People search and public records"
    },
    "truepeoplesearch": {
        "name": "TruePeopleSearch", 
        "type": "automated",
        "removal_url": "https://www.truepeoplesearch.com/removal",
        "description": "Free people search engine"
    },
    "mylife": {
        "name": "MyLife",
        "type": "automated", 
        "removal_url": "https://www.mylife.com/privacy-policy",
        "description": "People search and reputation management"
    },
    "peoplefinder": {
        "name": "PeopleFinder",
        "type": "manual",
        "removal_url": "https://www.peoplefinder.com/optout",
        "description": "Public records search service"
    },
    "familytreenow": {
        "name": "FamilyTreeNow",
        "type": "manual",
        "removal_url": "https://www.familytreenow.com/optout",
        "description": "Genealogy and people search"
    }
}

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "DataGuard Pro API - Privacy Protection Service"}

@api_router.get("/brokers")
async def get_data_brokers():
    """Get list of all supported data brokers"""
    return {"brokers": DATA_BROKERS}

@api_router.post("/users", response_model=User)
async def register_user(personal_info: PersonalInfo):
    """Register a new user with personal information"""
    user = User(personal_info=personal_info)
    await db.users.insert_one(user.dict())
    logger.info(f"User registered: {user.id}")
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user information"""
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

@api_router.post("/removal/bulk")
async def create_bulk_removal_requests(user_id: str, background_tasks: BackgroundTasks):
    """Create removal requests for all data brokers"""
    # Verify user exists
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    removal_requests = []
    
    # Create removal requests for all brokers
    for broker_id, broker_info in DATA_BROKERS.items():
        removal_request = RemovalRequest(
            user_id=user_id,
            broker_name=broker_info["name"],
            removal_type=broker_info["type"]
        )
        removal_requests.append(removal_request.dict())
    
    # Insert all removal requests
    await db.removal_requests.insert_many(removal_requests)
    
    # Start automated removal process in background
    background_tasks.add_task(process_automated_removals, user_id)
    
    logger.info(f"Created {len(removal_requests)} removal requests for user {user_id}")
    return {
        "message": f"Created {len(removal_requests)} removal requests", 
        "total_requests": len(removal_requests),
        "automated_requests": len([r for r in removal_requests if r["removal_type"] == "automated"]),
        "manual_requests": len([r for r in removal_requests if r["removal_type"] == "manual"])
    }

@api_router.get("/removal/status/{user_id}")
async def get_removal_status(user_id: str):
    """Get removal status for all brokers for a user"""
    cursor = db.removal_requests.find({"user_id": user_id})
    requests = await cursor.to_list(length=100)
    
    # Convert MongoDB documents to proper format
    formatted_requests = []
    for request in requests:
        # Remove MongoDB _id field and convert datetime objects
        request.pop('_id', None)
        if 'created_at' in request and hasattr(request['created_at'], 'isoformat'):
            request['created_at'] = request['created_at'].isoformat()
        if 'completed_at' in request and request['completed_at'] and hasattr(request['completed_at'], 'isoformat'):
            request['completed_at'] = request['completed_at'].isoformat()
        formatted_requests.append(request)
    
    stats = {
        "total": len(formatted_requests),
        "pending": sum(1 for r in formatted_requests if r["status"] == "pending"),
        "in_progress": sum(1 for r in formatted_requests if r["status"] == "in_progress"), 
        "completed": sum(1 for r in formatted_requests if r["status"] == "completed"),
        "failed": sum(1 for r in formatted_requests if r["status"] == "failed")
    }
    
    return {"requests": formatted_requests, "stats": stats}

@api_router.get("/removal/manual/{broker_name}")
async def get_manual_instructions(broker_name: str):
    """Get manual removal instructions for a specific broker"""
    broker_key = broker_name.lower().replace(" ", "")
    
    if broker_key not in DATA_BROKERS:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    if DATA_BROKERS[broker_key]["type"] != "manual":
        raise HTTPException(status_code=400, detail="This broker has automated removal")
    
    instructions = MANUAL_INSTRUCTIONS.get(broker_key, {})
    return {
        "broker": DATA_BROKERS[broker_key],
        "instructions": instructions
    }

@api_router.post("/removal/manual/complete")
async def mark_manual_removal_complete(user_id: str, broker_name: str, confirmation_code: Optional[str] = None):
    """Mark a manual removal as completed"""
    result = await db.removal_requests.update_one(
        {"user_id": user_id, "broker_name": broker_name},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "confirmation_code": confirmation_code
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Removal request not found")
    
    return {"message": "Manual removal marked as completed"}

@api_router.get("/email-template/{broker_name}")
async def get_email_template(broker_name: str, user_id: str):
    """Generate personalized email template for manual removal"""
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = User(**user_doc)
    broker_key = broker_name.lower().replace(" ", "")
    
    if broker_key not in EMAIL_TEMPLATES:
        raise HTTPException(status_code=404, detail="Email template not found")
    
    # Personalize template
    template = EMAIL_TEMPLATES[broker_key]
    personalized_template = template.format(
        first_name=user.personal_info.first_name,
        last_name=user.personal_info.last_name,
        email=user.personal_info.email,
        phone=user.personal_info.phone,
        full_name=f"{user.personal_info.first_name} {user.personal_info.last_name}"
    )
    
    return {
        "broker": broker_name,
        "template": personalized_template,
        "subject": f"Data Removal Request - {user.personal_info.first_name} {user.personal_info.last_name}"
    }

# Background task for automated removals
async def process_automated_removals(user_id: str):
    """Process automated removals using Playwright"""
    logger.info(f"Starting automated removal process for user {user_id}")
    
    # Get user information
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        logger.error(f"User {user_id} not found")
        return
    
    user = User(**user_doc)
    
    # Get automated removal requests
    automated_requests = await db.removal_requests.find({
        "user_id": user_id,
        "removal_type": "automated",
        "status": "pending"
    }).to_list(100)
    
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context()
        
        for request in automated_requests:
            try:
                # Update status to in_progress
                await db.removal_requests.update_one(
                    {"id": request["id"]},
                    {"$set": {"status": "in_progress"}}
                )
                
                # Process removal based on broker
                broker_name = request["broker_name"].lower().replace(" ", "")
                success = await process_broker_removal(context, broker_name, user)
                
                # Update status based on result
                if success:
                    await db.removal_requests.update_one(
                        {"id": request["id"]},
                        {
                            "$set": {
                                "status": "completed",
                                "completed_at": datetime.utcnow()
                            }
                        }
                    )
                else:
                    await db.removal_requests.update_one(
                        {"id": request["id"]},
                        {
                            "$set": {
                                "status": "failed",
                                "error_message": "Automated removal failed"
                            }
                        }
                    )
                
                # Wait between requests to avoid rate limiting
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error processing removal for {request['broker_name']}: {str(e)}")
                await db.removal_requests.update_one(
                    {"id": request["id"]},
                    {
                        "$set": {
                            "status": "failed",
                            "error_message": str(e)
                        }
                    }
                )
        
        await browser.close()

async def process_broker_removal(context, broker_name: str, user: User) -> bool:
    """Process removal for a specific broker using Playwright"""
    try:
        page = await context.new_page()
        
        if broker_name == "whitepages":
            return await process_whitepages_removal(page, user)
        elif broker_name == "spokeo":
            return await process_spokeo_removal(page, user)
        elif broker_name == "beenverified":
            return await process_beenverified_removal(page, user)
        elif broker_name == "intelius":
            return await process_intelius_removal(page, user)
        elif broker_name == "truepeoplesearch":
            return await process_truepeoplesearch_removal(page, user)
        elif broker_name == "mylife":
            return await process_mylife_removal(page, user)
        else:
            logger.warning(f"No removal process defined for broker: {broker_name}")
            return False
            
    except Exception as e:
        logger.error(f"Error in broker removal for {broker_name}: {str(e)}")
        return False
    finally:
        await page.close()

# Broker-specific removal functions
async def process_whitepages_removal(page, user: User) -> bool:
    """Process Whitepages removal"""
    try:
        await page.goto("https://www.whitepages.com/suppression-requests")
        await page.wait_for_load_state("networkidle")
        
        # Fill form fields
        await page.fill('input[name="first_name"]', user.personal_info.first_name)
        await page.fill('input[name="last_name"]', user.personal_info.last_name)
        await page.fill('input[name="email"]', user.personal_info.email)
        
        # Submit form
        await page.click('button[type="submit"]')
        await page.wait_for_load_state("networkidle")
        
        # Check for success indicators
        success_text = await page.text_content("body")
        return "submitted" in success_text.lower() or "received" in success_text.lower()
        
    except Exception as e:
        logger.error(f"Whitepages removal error: {str(e)}")
        return False

async def process_spokeo_removal(page, user: User) -> bool:
    """Process Spokeo removal"""
    try:
        await page.goto("https://www.spokeo.com/optout")
        await page.wait_for_load_state("networkidle")
        
        # Fill form
        await page.fill('input[name="email"]', user.personal_info.email)
        await page.fill('input[name="fname"]', user.personal_info.first_name)
        await page.fill('input[name="lname"]', user.personal_info.last_name)
        
        # Submit
        await page.click('button[type="submit"]')
        await page.wait_for_load_state("networkidle")
        
        # Check success
        return await page.is_visible("text=request has been submitted")
        
    except Exception as e:
        logger.error(f"Spokeo removal error: {str(e)}")
        return False

async def process_beenverified_removal(page, user: User) -> bool:
    """Process BeenVerified removal"""
    try:
        await page.goto("https://www.beenverified.com/app/optout/search")
        await page.wait_for_load_state("networkidle")
        
        # Search for profile first
        await page.fill('input[name="firstName"]', user.personal_info.first_name)
        await page.fill('input[name="lastName"]', user.personal_info.last_name)
        await page.click('button[type="submit"]')
        
        await page.wait_for_load_state("networkidle")
        
        # If profile found, proceed with removal
        if await page.is_visible("text=Remove"):
            await page.click("text=Remove")
            await page.fill('input[name="email"]', user.personal_info.email)
            await page.click('button[type="submit"]')
            return True
            
        return False
        
    except Exception as e:
        logger.error(f"BeenVerified removal error: {str(e)}")
        return False

async def process_intelius_removal(page, user: User) -> bool:
    """Process Intelius removal"""
    try:
        await page.goto("https://www.intelius.com/optout")
        await page.wait_for_load_state("networkidle")
        
        # Fill removal form
        await page.fill('input[name="first_name"]', user.personal_info.first_name)
        await page.fill('input[name="last_name"]', user.personal_info.last_name)
        await page.fill('input[name="email"]', user.personal_info.email)
        
        await page.click('button[type="submit"]')
        await page.wait_for_load_state("networkidle")
        
        return await page.is_visible("text=successfully")
        
    except Exception as e:
        logger.error(f"Intelius removal error: {str(e)}")
        return False

async def process_truepeoplesearch_removal(page, user: User) -> bool:
    """Process TruePeopleSearch removal"""
    try:
        await page.goto("https://www.truepeoplesearch.com/removal")
        await page.wait_for_load_state("networkidle")
        
        # Fill form
        await page.fill('input[name="name"]', f"{user.personal_info.first_name} {user.personal_info.last_name}")
        await page.fill('input[name="email"]', user.personal_info.email)
        
        await page.click('button[type="submit"]')
        await page.wait_for_load_state("networkidle")
        
        return await page.is_visible("text=submitted")
        
    except Exception as e:
        logger.error(f"TruePeopleSearch removal error: {str(e)}")
        return False

async def process_mylife_removal(page, user: User) -> bool:
    """Process MyLife removal"""
    try:
        await page.goto("https://www.mylife.com/privacy-policy")
        await page.wait_for_load_state("networkidle")
        
        # Look for contact email or form
        if await page.is_visible("text=privacy@mylife.com"):
            # Manual email required
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"MyLife removal error: {str(e)}")
        return False

# Manual removal instructions
MANUAL_INSTRUCTIONS = {
    "peoplefinder": {
        "steps": [
            "Go to https://www.peoplefinder.com/optout",
            "Search for your name to find your profile",
            "Click on your profile link",
            "Copy the URL of your profile page",
            "Click on the 'Remove this record' link at the bottom",
            "Fill out the removal form with your information",
            "Submit the form and save the confirmation number"
        ],
        "email_required": False,
        "estimated_time": "5-10 minutes"
    },
    "familytreenow": {
        "steps": [
            "Go to https://www.familytreenow.com/optout", 
            "Search for your name and location",
            "Find your profile in the search results",
            "Click on 'Opt Out Information' link",
            "Fill out the opt-out form completely",
            "Verify your email address when prompted",
            "Wait for confirmation email (may take 24-48 hours)"
        ],
        "email_required": True,
        "estimated_time": "10-15 minutes"
    }
}

# Email templates for manual removals
EMAIL_TEMPLATES = {
    "peoplefinder": """
Subject: Data Removal Request - {full_name}

Dear PeopleFinder Privacy Team,

I am writing to request the removal of my personal information from your database.

Personal Information:
- Name: {full_name}
- Email: {email}
- Phone: {phone}

I would like all records containing my personal information to be permanently removed from your database and website. Please confirm this removal and provide a reference number for my request.

Thank you for your prompt attention to this matter.

Best regards,
{full_name}
""",
    "familytreenow": """
Subject: Opt-Out Request - {full_name}

Dear FamilyTreeNow Support,

I am requesting to opt-out and remove all my personal information from your website and database.

Personal Details:
- Full Name: {full_name}
- Email Address: {email}
- Phone Number: {phone}

Please remove all records associated with my name and contact information. I would appreciate confirmation once this process is complete.

Thank you for respecting my privacy.

Sincerely,
{full_name}
"""
}

# Include router
app.include_router(api_router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "DataGuard Pro API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)