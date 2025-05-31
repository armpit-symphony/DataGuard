
import requests
import sys
import json
from datetime import datetime

class DataGuardProTester:
    def __init__(self, base_url="https://5192b957-5fc7-4150-b231-d943b0f44f4a.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.broker_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return success, response.json() if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_user(self):
        """Create a test user for testing"""
        test_user = {
            "full_name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "first_name": "Test",
            "last_name": f"User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "555-123-4567",
            "current_address": "123 Test St, Test City, TS 12345",
            "previous_addresses": ["456 Old St, Old City, OC 67890"],
            "date_of_birth": "1990-01-01",
            "family_members": ["Family Member 1"]
        }
        
        success, response = self.run_test(
            "Create User Profile",
            "POST",
            "users",
            200,
            data=test_user
        )
        
        if success and response.get('id'):
            self.user_id = response['id']
            print(f"Created test user with ID: {self.user_id}")
            return True
        return False

    def get_manual_brokers(self):
        """Get manual brokers for the user"""
        if not self.user_id:
            print("❌ No user ID available. Create a user first.")
            return False
            
        success, response = self.run_test(
            "Get Manual Instructions",
            "GET",
            f"manual-instructions/{self.user_id}",
            200
        )
        
        if success and response.get('checklist') and response['checklist'].get('brokers'):
            brokers = response['checklist']['brokers']
            if brokers:
                self.broker_id = brokers[0].get('broker_id')
                print(f"Found manual broker with ID: {self.broker_id}")
                return True
        return False

    def test_email_template_generation(self):
        """Test email template generation"""
        if not self.user_id or not self.broker_id:
            print("❌ Missing user ID or broker ID. Cannot test email generation.")
            return False
            
        success, response = self.run_test(
            "Generate Email Template",
            "POST",
            f"manual-instructions/generate-email?user_id={self.user_id}&broker_id={self.broker_id}",
            200
        )
        
        if success:
            email_template = response.get('email_template')
            if email_template:
                print("\nEmail Template Generated:")
                print(f"Subject: {email_template.get('subject')}")
                print(f"Recipient: {email_template.get('recipient')}")
                print(f"Body Preview: {email_template.get('body')[:100]}...")
                return True
        return False

def main():
    tester = DataGuardProTester()
    
    # Create test user
    if not tester.create_test_user():
        print("❌ Failed to create test user, stopping tests")
        return 1
        
    # Get manual brokers
    if not tester.get_manual_brokers():
        print("❌ Failed to get manual brokers, stopping tests")
        return 1
        
    # Test email template generation
    if not tester.test_email_template_generation():
        print("❌ Failed to generate email template")
        return 1
        
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
