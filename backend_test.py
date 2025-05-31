
import requests
import sys
import time
import uuid
from datetime import datetime

class DataGuardProTester:
    def __init__(self, base_url):
        self.base_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        if success:
            print(f"API Version: {response.get('version', 'unknown')}")
        return success
    
    def test_initialize_data_brokers(self):
        """Test data broker initialization"""
        success, response = self.run_test(
            "Initialize Data Brokers",
            "POST",
            "data-brokers/initialize",
            200
        )
        if success:
            print(f"Message: {response.get('message', 'No message')}")
        return success
    
    def test_get_data_brokers(self):
        """Test getting all data brokers"""
        success, response = self.run_test(
            "Get Data Brokers",
            "GET",
            "data-brokers",
            200
        )
        if success:
            print(f"Retrieved {len(response)} data brokers")
            if len(response) > 0:
                print(f"First broker: {response[0]['name']}")
                # Check for automation_available field
                print(f"Automation available: {response[0].get('automation_available', False)}")
                # Count automated vs manual brokers
                automated = sum(1 for broker in response if broker.get('automation_available', False))
                print(f"Automated brokers: {automated}, Manual brokers: {len(response) - automated}")
        return success, response
    
    def test_create_user(self):
        """Test user creation"""
        test_user_id = str(uuid.uuid4())
        user_data = {
            "full_name": "Test User",
            "first_name": "Test",
            "last_name": "User",
            "email": f"test{test_user_id[:8]}@example.com",
            "phone": "555-123-4567",
            "current_address": "123 Test St, Test City, TS 12345",
            "previous_addresses": ["456 Old St, Old City, OC 67890"],
            "date_of_birth": "1990-01-01",
            "family_members": ["Family Member 1", "Family Member 2"]
        }
        
        success, response = self.run_test(
            "Create User Profile",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"Created user with ID: {self.user_id}")
        return success
    
    def test_get_user(self):
        """Test getting user by ID"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            f"users/{self.user_id}",
            200
        )
        
        if success:
            print(f"Retrieved user: {response['full_name']}")
        return success
    
    def test_bulk_create_removal_requests(self):
        """Test bulk creation of removal requests"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Bulk Create Removal Requests",
            "POST",
            f"removal-requests/bulk-create/{self.user_id}",
            200
        )
        
        if success:
            print(f"Message: {response.get('message', 'No message')}")
            print(f"Total brokers: {response.get('total_brokers', 0)}")
            print(f"New requests: {response.get('new_requests', 0)}")
        return success
    
    def test_get_user_removal_requests(self):
        """Test getting removal requests for a user"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get User Removal Requests",
            "GET",
            f"removal-requests/user/{self.user_id}",
            200
        )
        
        if success:
            print(f"Retrieved {len(response)} removal requests")
            if len(response) > 0:
                print(f"First request status: {response[0]['status']}")
        return success, response
    
    def test_get_removal_summary(self):
        """Test getting removal summary for a user"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Removal Summary",
            "GET",
            f"removal-requests/summary/{self.user_id}",
            200
        )
        
        if success:
            print(f"Total brokers: {response.get('total_brokers', 0)}")
            print(f"Pending: {response.get('pending', 0)}")
            print(f"In progress: {response.get('in_progress', 0)}")
            print(f"Completed: {response.get('completed', 0)}")
            print(f"Success rate: {response.get('success_rate', 0)}%")
        return success
    
    def test_update_removal_status(self):
        """Test updating removal request status"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        # First get a removal request ID
        success, requests = self.test_get_user_removal_requests()
        if not success or not requests:
            print("❌ No removal requests available for testing")
            return False
            
        request_id = requests[0]['id']
        
        success, response = self.run_test(
            "Update Removal Status",
            "PUT",
            f"removal-requests/{request_id}/status?status=in_progress&notes=Testing status update",
            200
        )
        
        if success:
            print(f"Message: {response.get('message', 'No message')}")
        return success
    
    def test_get_automation_status(self):
        """Test getting automation status for a user"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Automation Status",
            "GET",
            f"removal-requests/automation-status/{self.user_id}",
            200
        )
        
        if success:
            print(f"Total requests: {response.get('total_requests', 0)}")
            print(f"Automated brokers: {response.get('automated_brokers', {}).get('count', 0)}")
            print(f"Manual brokers: {response.get('manual_brokers', {}).get('count', 0)}")
            
            # Print details of automated brokers
            automated_brokers = response.get('automated_brokers', {}).get('brokers', [])
            if automated_brokers:
                print("\nAutomated brokers:")
                for broker in automated_brokers[:3]:  # Show first 3 for brevity
                    print(f"  - {broker.get('broker_name', 'Unknown')}: {broker.get('status', 'unknown')}")
                if len(automated_brokers) > 3:
                    print(f"  - ... and {len(automated_brokers) - 3} more")
            
            # Print details of manual brokers
            manual_brokers = response.get('manual_brokers', {}).get('brokers', [])
            if manual_brokers:
                print("\nManual brokers:")
                for broker in manual_brokers[:3]:  # Show first 3 for brevity
                    print(f"  - {broker.get('broker_name', 'Unknown')}: {broker.get('status', 'unknown')}")
                if len(manual_brokers) > 3:
                    print(f"  - ... and {len(manual_brokers) - 3} more")
        
        return success, response
    
    def test_process_automated_removals(self):
        """Test processing automated removal requests"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Process Automated Removals",
            "POST",
            f"removal-requests/process-automated/{self.user_id}",
            200
        )
        
        if success:
            print(f"Message: {response.get('message', 'No message')}")
            print(f"Total brokers: {response.get('total_brokers', 0)}")
            print(f"Processed: {response.get('processed', 0)}")
            
            # Print details of results
            results = response.get('results', [])
            if results:
                print("\nAutomation results:")
                for result in results[:3]:  # Show first 3 for brevity
                    broker_name = result.get('broker_name', 'Unknown')
                    success = result.get('success', False)
                    status = result.get('status', 'unknown')
                    message = result.get('message', 'No message')
                    print(f"  - {broker_name}: {'✅' if success else '❌'} {status} - {message}")
                if len(results) > 3:
                    print(f"  - ... and {len(results) - 3} more")
        
        return success
    
    def test_get_manual_instructions(self):
        """Test getting manual removal instructions for a user"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Manual Instructions",
            "GET",
            f"manual-instructions/{self.user_id}",
            200
        )
        
        if success:
            checklist = response.get('checklist', {})
            print(f"User name: {checklist.get('user_name', 'Unknown')}")
            print(f"Total manual brokers: {checklist.get('total_manual_brokers', 0)}")
            print(f"Estimated total time: {checklist.get('estimated_total_time', 'Unknown')}")
            
            # Print details of manual brokers
            brokers = checklist.get('brokers', [])
            if brokers:
                print("\nManual broker instructions:")
                for broker in brokers:
                    print(f"  - {broker.get('broker_name', 'Unknown')}")
                    print(f"    Website: {broker.get('website', 'Unknown')}")
                    print(f"    Removal URL: {broker.get('removal_url', 'Unknown')}")
                    
                    # Check if email template is available
                    if 'email_template' in broker:
                        print(f"    Email template available: Yes")
                    
                    # Check if instructions are available
                    if 'instructions' in broker:
                        instructions = broker.get('instructions', {})
                        print(f"    Difficulty: {instructions.get('difficulty', 'Unknown')}")
                        print(f"    Estimated time: {instructions.get('estimated_time', 'Unknown')}")
                        
                        # Check if steps are available
                        steps = instructions.get('steps', [])
                        print(f"    Number of steps: {len(steps)}")
        
        return success
    
    def test_generate_email_template(self):
        """Test generating email template for manual removal"""
        if not self.user_id:
            print("❌ No user ID available for testing")
            return False
            
        # First get a manual broker ID
        success, response = self.test_get_automation_status()
        if not success:
            print("❌ Failed to get automation status")
            return False
            
        manual_brokers = response.get('manual_brokers', {}).get('brokers', [])
        if not manual_brokers:
            print("❌ No manual brokers available for testing")
            return False
            
        broker_id = manual_brokers[0].get('broker_id')
        if not broker_id:
            print("❌ No broker ID available for testing")
            return False
            
        success, response = self.run_test(
            "Generate Email Template",
            "POST",
            f"manual-instructions/generate-email?user_id={self.user_id}&broker_id={broker_id}",
            200
        )
        
        if success:
            print(f"Broker name: {response.get('broker_name', 'Unknown')}")
            
            # Check if email template is available
            email_template = response.get('email_template', {})
            if email_template:
                print(f"Email subject: {email_template.get('subject', 'Unknown')}")
                print(f"Email recipient: {email_template.get('recipient', 'Unknown')}")
                print(f"Email body length: {len(email_template.get('body', ''))}")
        
        return success
    
    def test_get_broker_instructions(self):
        """Test getting detailed instructions for a specific broker"""
        # First get a broker ID
        success, response = self.test_get_data_brokers()
        if not success or not response:
            print("❌ No brokers available for testing")
            return False
            
        broker_id = response[0]['id']
        
        success, response = self.run_test(
            "Get Broker Instructions",
            "GET",
            f"manual-instructions/broker/{broker_id}",
            200
        )
        
        if success:
            print(f"Broker name: {response.get('broker_name', 'Unknown')}")
            
            # Check if instructions are available
            instructions = response.get('instructions', {})
            if instructions:
                print(f"Difficulty: {instructions.get('difficulty', 'Unknown')}")
                print(f"Estimated time: {instructions.get('estimated_time', 'Unknown')}")
                print(f"Success rate: {instructions.get('success_rate', 'Unknown')}")
                
                # Check if steps are available
                steps = instructions.get('steps', [])
                print(f"Number of steps: {len(steps)}")
                
                # Check if tips are available
                tips = instructions.get('tips', [])
                print(f"Number of tips: {len(tips)}")
        
        return success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting DataGuard Pro API Tests\n")
        
        # Basic API tests
        self.test_api_root()
        self.test_initialize_data_brokers()
        self.test_get_data_brokers()
        
        # User flow tests
        self.test_create_user()
        self.test_get_user()
        
        # Removal request tests
        self.test_bulk_create_removal_requests()
        self.test_get_user_removal_requests()
        self.test_get_removal_summary()
        self.test_update_removal_status()
        
        # Automation tests
        self.test_get_automation_status()
        self.test_process_automated_removals()
        
        # Manual instructions tests
        self.test_get_manual_instructions()
        self.test_generate_email_template()
        self.test_get_broker_instructions()
        
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        return self.tests_passed == self.tests_run

def main():
    # Get backend URL from frontend .env
    backend_url = "https://5192b957-5fc7-4150-b231-d943b0f44f4a.preview.emergentagent.com"
    
    # Run tests
    tester = DataGuardProTester(backend_url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
