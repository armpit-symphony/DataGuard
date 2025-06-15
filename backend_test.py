import requests
import sys
import time
from datetime import datetime

class DataGuardProAPITester:
    def __init__(self, base_url="https://8a2c7313-e0cd-49c3-803d-32e0fb805802.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

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

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        print(f"Error: {response.json()}")
                    except:
                        print(f"Error: {response.text}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test the API health check endpoint"""
        return self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )

    def test_get_status_checks(self):
        """Test getting all status checks"""
        return self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )

    def test_create_status_check(self, client_name):
        """Test creating a new status check"""
        return self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": client_name}
        )

def main():
    # Setup
    tester = DataGuardProAPITester()
    test_client_name = f"test_client_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print("=" * 50)
    print("DataGuard Pro API Test Suite")
    print("=" * 50)
    
    # Run tests
    health_success, _ = tester.test_health_check()
    if not health_success:
        print("❌ API health check failed, stopping tests")
        return 1
    
    # Get initial status checks
    get_success, initial_checks = tester.test_get_status_checks()
    if not get_success:
        print("❌ Getting status checks failed, stopping tests")
        return 1
    
    # Create a new status check
    create_success, new_check = tester.test_create_status_check(test_client_name)
    if not create_success:
        print("❌ Creating status check failed, stopping tests")
        return 1
    
    # Verify the new status check was added
    time.sleep(1)  # Small delay to ensure data is saved
    get_success, updated_checks = tester.test_get_status_checks()
    if not get_success:
        print("❌ Getting updated status checks failed")
        return 1
    
    # Check if the new status check is in the updated list
    if len(updated_checks) > len(initial_checks):
        print(f"✅ New status check was successfully added to the database")
    else:
        print(f"❌ New status check was not found in the database")
        tester.tests_passed -= 1
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())