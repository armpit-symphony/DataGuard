"""
DataGuard Pro Desktop - Local SQLite Database Manager
Handles all database operations for the desktop application
"""
import aiosqlite
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import os
from pathlib import Path

class DesktopDatabase:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Use user's app data directory
            app_data = Path.home() / "AppData" / "Local" / "DataGuardPro" if os.name == 'nt' else Path.home() / ".dataguardpro"
            app_data.mkdir(parents=True, exist_ok=True)
            db_path = app_data / "dataguard.db"
        
        self.db_path = db_path
        self.connection = None
    
    async def initialize(self):
        """Initialize database connection and create tables"""
        self.connection = await aiosqlite.connect(self.db_path)
        await self.create_tables()
        await self.initialize_data_brokers()
    
    async def create_tables(self):
        """Create all necessary tables"""
        
        # User profiles table
        await self.connection.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                current_address TEXT NOT NULL,
                previous_addresses TEXT, -- JSON array
                date_of_birth TEXT,
                family_members TEXT, -- JSON array
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        # Data brokers table
        await self.connection.execute("""
            CREATE TABLE IF NOT EXISTS data_brokers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                website TEXT NOT NULL,
                type TEXT NOT NULL,
                removal_url TEXT,
                removal_method TEXT NOT NULL,
                automation_available INTEGER DEFAULT 0,
                removal_instructions TEXT,
                verification_method TEXT,
                estimated_time TEXT,
                success_rate REAL DEFAULT 0.0,
                created_at TEXT
            )
        """)
        
        # Removal requests table
        await self.connection.execute("""
            CREATE TABLE IF NOT EXISTS removal_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                data_broker_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                method_used TEXT,
                submitted_at TEXT,
                completed_at TEXT,
                confirmation_details TEXT, -- JSON
                notes TEXT,
                retry_count INTEGER DEFAULT 0,
                next_retry_at TEXT,
                FOREIGN KEY (user_id) REFERENCES user_profiles (id),
                FOREIGN KEY (data_broker_id) REFERENCES data_brokers (id)
            )
        """)
        
        await self.connection.commit()
    
    async def initialize_data_brokers(self):
        """Initialize with default data brokers"""
        
        # Check if data brokers already exist
        cursor = await self.connection.execute("SELECT COUNT(*) FROM data_brokers")
        count = await cursor.fetchone()
        
        if count[0] > 0:
            return  # Already initialized
        
        initial_brokers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Whitepages",
                "website": "whitepages.com",
                "type": "people_search",
                "removal_url": "https://www.whitepages.com/suppression_requests",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "Fill out online opt-out form with name, address, and phone number",
                "verification_method": "email_confirmation",
                "estimated_time": "24h",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Spokeo",
                "website": "spokeo.com",
                "type": "people_search",
                "removal_url": "https://www.spokeo.com/optout",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "Search for your profile, then use opt-out form",
                "verification_method": "email_confirmation",
                "estimated_time": "3-5 days",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "BeenVerified",
                "website": "beenverified.com",
                "type": "background_check",
                "removal_url": "https://www.beenverified.com/app/optout/search",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "Search for profile and submit opt-out request",
                "verification_method": "email_confirmation",
                "estimated_time": "24h",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "PeopleFinder",
                "website": "peoplefinder.com",
                "type": "people_search",
                "removal_url": "https://www.peoplefinder.com/optout.php",
                "removal_method": "form",
                "automation_available": 0,
                "removal_instructions": "Manual form submission required with ID verification",
                "verification_method": "manual_review",
                "estimated_time": "2-3 weeks",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Intelius",
                "website": "intelius.com",
                "type": "background_check",
                "removal_url": "https://www.intelius.com/optout",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "Online opt-out form with email verification",
                "verification_method": "email_confirmation",
                "estimated_time": "24h",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "TruePeopleSearch",
                "website": "truepeoplesearch.com",
                "type": "people_search",
                "removal_url": "https://www.truepeoplesearch.com/removal",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "Find your listing and submit removal request",
                "verification_method": "email_confirmation",
                "estimated_time": "24h",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "FamilyTreeNow",
                "website": "familytreenow.com",
                "type": "people_search",
                "removal_url": "https://www.familytreenow.com/optout",
                "removal_method": "form",
                "automation_available": 0,
                "removal_instructions": "Manual opt-out process with identity verification",
                "verification_method": "manual_review",
                "estimated_time": "2-3 weeks",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "MyLife",
                "website": "mylife.com",
                "type": "people_search",
                "removal_url": "https://www.mylife.com/ccpa",
                "removal_method": "form",
                "automation_available": 1,
                "removal_instructions": "CCPA opt-out form available",
                "verification_method": "email_confirmation",
                "estimated_time": "3-5 days",
                "success_rate": 0.0,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        for broker in initial_brokers:
            await self.connection.execute("""
                INSERT INTO data_brokers 
                (id, name, website, type, removal_url, removal_method, automation_available,
                 removal_instructions, verification_method, estimated_time, success_rate, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                broker["id"], broker["name"], broker["website"], broker["type"],
                broker["removal_url"], broker["removal_method"], broker["automation_available"],
                broker["removal_instructions"], broker["verification_method"],
                broker["estimated_time"], broker["success_rate"], broker["created_at"]
            ))
        
        await self.connection.commit()
    
    # User Profile Operations
    async def create_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user profile"""
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        await self.connection.execute("""
            INSERT INTO user_profiles 
            (id, full_name, first_name, last_name, email, phone, current_address,
             previous_addresses, date_of_birth, family_members, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, user_data["full_name"], user_data["first_name"], user_data["last_name"],
            user_data["email"], user_data.get("phone"), user_data["current_address"],
            json.dumps(user_data.get("previous_addresses", [])),
            user_data.get("date_of_birth"),
            json.dumps(user_data.get("family_members", [])),
            now, now
        ))
        
        await self.connection.commit()
        return await self.get_user_profile(user_id)
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        cursor = await self.connection.execute("""
            SELECT * FROM user_profiles WHERE id = ?
        """, (user_id,))
        
        row = await cursor.fetchone()
        if not row:
            return None
        
        columns = [description[0] for description in cursor.description]
        user_dict = dict(zip(columns, row))
        
        # Parse JSON fields
        user_dict["previous_addresses"] = json.loads(user_dict["previous_addresses"] or "[]")
        user_dict["family_members"] = json.loads(user_dict["family_members"] or "[]")
        
        return user_dict
    
    async def get_all_user_profiles(self) -> List[Dict[str, Any]]:
        """Get all user profiles"""
        cursor = await self.connection.execute("SELECT * FROM user_profiles")
        rows = await cursor.fetchall()
        
        profiles = []
        columns = [description[0] for description in cursor.description]
        
        for row in rows:
            user_dict = dict(zip(columns, row))
            user_dict["previous_addresses"] = json.loads(user_dict["previous_addresses"] or "[]")
            user_dict["family_members"] = json.loads(user_dict["family_members"] or "[]")
            profiles.append(user_dict)
        
        return profiles
    
    # Data Broker Operations
    async def get_all_data_brokers(self) -> List[Dict[str, Any]]:
        """Get all data brokers"""
        cursor = await self.connection.execute("SELECT * FROM data_brokers")
        rows = await cursor.fetchall()
        
        brokers = []
        columns = [description[0] for description in cursor.description]
        
        for row in rows:
            broker_dict = dict(zip(columns, row))
            broker_dict["automation_available"] = bool(broker_dict["automation_available"])
            brokers.append(broker_dict)
        
        return brokers
    
    # Removal Request Operations
    async def create_removal_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new removal request"""
        request_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        await self.connection.execute("""
            INSERT INTO removal_requests 
            (id, user_id, data_broker_id, status, method_used, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            request_id, request_data["user_id"], request_data["data_broker_id"],
            request_data.get("status", "pending"), request_data.get("method_used", ""),
            now
        ))
        
        await self.connection.commit()
        return await self.get_removal_request(request_id)
    
    async def get_removal_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get removal request by ID"""
        cursor = await self.connection.execute("""
            SELECT * FROM removal_requests WHERE id = ?
        """, (request_id,))
        
        row = await cursor.fetchone()
        if not row:
            return None
        
        columns = [description[0] for description in cursor.description]
        request_dict = dict(zip(columns, row))
        
        # Parse JSON field
        if request_dict["confirmation_details"]:
            request_dict["confirmation_details"] = json.loads(request_dict["confirmation_details"])
        
        return request_dict
    
    async def get_user_removal_requests(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all removal requests for a user"""
        cursor = await self.connection.execute("""
            SELECT * FROM removal_requests WHERE user_id = ?
        """, (user_id,))
        
        rows = await cursor.fetchall()
        requests = []
        columns = [description[0] for description in cursor.description]
        
        for row in rows:
            request_dict = dict(zip(columns, row))
            if request_dict["confirmation_details"]:
                request_dict["confirmation_details"] = json.loads(request_dict["confirmation_details"])
            requests.append(request_dict)
        
        return requests
    
    async def update_removal_request(self, request_id: str, update_data: Dict[str, Any]):
        """Update removal request"""
        set_clauses = []
        values = []
        
        for key, value in update_data.items():
            if key == "confirmation_details" and value:
                set_clauses.append(f"{key} = ?")
                values.append(json.dumps(value))
            else:
                set_clauses.append(f"{key} = ?")
                values.append(value)
        
        values.append(request_id)
        
        query = f"UPDATE removal_requests SET {', '.join(set_clauses)} WHERE id = ?"
        await self.connection.execute(query, values)
        await self.connection.commit()
    
    async def bulk_create_removal_requests(self, user_id: str) -> Dict[str, Any]:
        """Create removal requests for all data brokers for a user"""
        brokers = await self.get_all_data_brokers()
        created_requests = []
        
        for broker in brokers:
            # Check if request already exists
            cursor = await self.connection.execute("""
                SELECT id FROM removal_requests WHERE user_id = ? AND data_broker_id = ?
            """, (user_id, broker["id"]))
            
            existing = await cursor.fetchone()
            if not existing:
                request_data = {
                    "user_id": user_id,
                    "data_broker_id": broker["id"],
                    "method_used": broker["removal_method"]
                }
                request = await self.create_removal_request(request_data)
                created_requests.append(request)
        
        return {
            "message": f"Created {len(created_requests)} removal requests",
            "total_brokers": len(brokers),
            "new_requests": len(created_requests)
        }
    
    async def get_removal_summary(self, user_id: str) -> Dict[str, Any]:
        """Get removal summary for a user"""
        # Get total brokers
        cursor = await self.connection.execute("SELECT COUNT(*) FROM data_brokers")
        total_brokers = (await cursor.fetchone())[0]
        
        # Get status counts
        cursor = await self.connection.execute("""
            SELECT status, COUNT(*) FROM removal_requests WHERE user_id = ? GROUP BY status
        """, (user_id,))
        
        status_rows = await cursor.fetchall()
        status_counts = {
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "failed": 0,
            "requires_manual": 0
        }
        
        total_requests = 0
        for status, count in status_rows:
            if status in status_counts:
                status_counts[status] = count
            total_requests += count
        
        # Calculate success rate
        completed = status_counts["completed"]
        success_rate = (completed / total_requests * 100) if total_requests > 0 else 0.0
        
        return {
            "total_brokers": total_brokers,
            "pending": status_counts["pending"],
            "in_progress": status_counts["in_progress"],
            "completed": status_counts["completed"],
            "failed": status_counts["failed"],
            "requires_manual": status_counts["requires_manual"],
            "success_rate": round(success_rate, 1)
        }
    
    async def close(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()

# Global database instance
desktop_db = DesktopDatabase()