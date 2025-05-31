"""
Manual Removal Instructions Generator
Provides detailed instructions and email templates for manual data broker removal
"""

from typing import Dict, Any, List
import re

class ManualRemovalInstructions:
    
    @staticmethod
    def generate_email_template(user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate email template for manual removal request"""
        
        broker_name = broker_data.get('name', '')
        user_name = user_data.get('full_name', '')
        user_email = user_data.get('email', '')
        current_address = user_data.get('current_address', '')
        previous_addresses = user_data.get('previous_addresses', [])
        phone = user_data.get('phone', '')
        
        # Standard email template
        subject = f"Request for Data Removal - {user_name}"
        
        body = f"""Dear {broker_name} Privacy Team,

I am writing to request the removal of my personal information from your database and website under applicable privacy laws including CCPA, GDPR, and other relevant data protection regulations.

PERSONAL INFORMATION TO BE REMOVED:
- Full Name: {user_name}
- Email Address: {user_email}
- Phone Number: {phone if phone else 'Not provided'}
- Current Address: {current_address}"""

        if previous_addresses:
            body += f"\n- Previous Addresses: {', '.join(previous_addresses)}"

        body += f"""

LEGAL BASIS FOR REQUEST:
I am exercising my right to have my personal data erased under:
- California Consumer Privacy Act (CCPA) - Right to Delete
- General Data Protection Regulation (GDPR) - Right to Erasure (Article 17)
- Other applicable state and federal privacy laws

CONFIRMATION REQUESTED:
Please confirm in writing that:
1. You have removed all my personal information from your databases
2. You have removed all my personal information from your website(s)
3. You will not collect, sell, or share my personal information in the future
4. You have notified any third parties with whom you have shared my data

RESPONSE TIMELINE:
Please respond within 30 days as required by law. If you need additional information to process this request, please contact me at {user_email}.

Thank you for your prompt attention to this matter.

Sincerely,
{user_name}
{user_email}
{current_address}

---
This is a formal data removal request under applicable privacy laws. Please treat this request with appropriate legal consideration.
"""

        return {
            'subject': subject,
            'body': body,
            'recipient': f'privacy@{broker_data.get("website", "").replace("www.", "")}',
            'cc_emails': [
                f'legal@{broker_data.get("website", "").replace("www.", "")}',
                f'support@{broker_data.get("website", "").replace("www.", "")}'
            ]
        }
    
    @staticmethod
    def get_detailed_instructions(broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed manual removal instructions for specific brokers"""
        
        broker_name = broker_data.get('name', '').lower()
        
        if 'peoplefinder' in broker_name:
            return ManualRemovalInstructions._get_peoplefinder_instructions()
        elif 'familytreenow' in broker_name:
            return ManualRemovalInstructions._get_familytreenow_instructions()
        else:
            return ManualRemovalInstructions._get_generic_instructions(broker_data)
    
    @staticmethod
    def _get_peoplefinder_instructions() -> Dict[str, Any]:
        """Detailed instructions for PeopleFinder removal"""
        return {
            'broker_name': 'PeopleFinder',
            'difficulty': 'Medium',
            'estimated_time': '15-20 minutes',
            'success_rate': '85%',
            'steps': [
                {
                    'step': 1,
                    'title': 'Search for Your Profile',
                    'description': 'Go to PeopleFinder.com and search for your name and location',
                    'details': 'Use various combinations of your name, current address, and previous addresses to find all your profiles'
                },
                {
                    'step': 2,
                    'title': 'Document Your Profiles',
                    'description': 'Take screenshots of all profiles that contain your information',
                    'details': 'Make note of the profile URLs as you will need them for the removal request'
                },
                {
                    'step': 3,
                    'title': 'Visit Opt-Out Page',
                    'description': 'Navigate to https://www.peoplefinder.com/optout.php',
                    'details': 'This is their official removal request page'
                },
                {
                    'step': 4,
                    'title': 'Fill Out Removal Form',
                    'description': 'Complete the form with your personal information',
                    'details': 'Provide all addresses where you have lived and include profile URLs from step 2'
                },
                {
                    'step': 5,
                    'title': 'Identity Verification',
                    'description': 'Upload a government-issued ID for verification',
                    'details': 'PeopleFinder requires ID verification for removal requests. Ensure your ID is clear and readable.'
                },
                {
                    'step': 6,
                    'title': 'Submit and Follow Up',
                    'description': 'Submit the form and wait for confirmation',
                    'details': 'They typically respond within 2-3 weeks. Follow up if you don\'t hear back.'
                }
            ],
            'tips': [
                'Search using different name variations (with/without middle name)',
                'Check both current and previous addresses',
                'Keep records of your submission for follow-up',
                'Be patient - manual reviews take longer'
            ],
            'contact_info': {
                'email': 'privacy@peoplefinder.com',
                'phone': 'Available on their contact page',
                'address': 'Check their website for mailing address'
            }
        }
    
    @staticmethod
    def _get_familytreenow_instructions() -> Dict[str, Any]:
        """Detailed instructions for FamilyTreeNow removal"""
        return {
            'broker_name': 'FamilyTreeNow',
            'difficulty': 'Hard',
            'estimated_time': '20-30 minutes',
            'success_rate': '70%',
            'steps': [
                {
                    'step': 1,
                    'title': 'Search for Your Profile',
                    'description': 'Go to FamilyTreeNow.com and search for yourself',
                    'details': 'Search by name, location, and age. Check for family members too as your info might appear on their profiles'
                },
                {
                    'step': 2,
                    'title': 'Document All Instances',
                    'description': 'Screenshot every page where your information appears',
                    'details': 'Your info might appear on multiple family member profiles, not just your own'
                },
                {
                    'step': 3,
                    'title': 'Visit Opt-Out Page',
                    'description': 'Navigate to https://www.familytreenow.com/optout',
                    'details': 'Read their opt-out policy carefully'
                },
                {
                    'step': 4,
                    'title': 'Complete Opt-Out Form',
                    'description': 'Fill out their detailed removal request form',
                    'details': 'Include all profile URLs and explain where your information appears'
                },
                {
                    'step': 5,
                    'title': 'Identity Verification Process',
                    'description': 'Complete their identity verification requirements',
                    'details': 'May require multiple forms of ID and address verification'
                },
                {
                    'step': 6,
                    'title': 'Wait and Monitor',
                    'description': 'Wait for removal confirmation and check periodically',
                    'details': 'Can take 2-4 weeks. Your info might reappear and require additional requests'
                }
            ],
            'tips': [
                'Search for family members to find your information on their profiles',
                'Be very specific about which profiles contain your information',
                'Consider requesting removal from family member profiles separately',
                'Follow up regularly as removals may not be permanent'
            ],
            'contact_info': {
                'email': 'privacy@familytreenow.com',
                'phone': 'Check website for current number',
                'address': 'Mailing address available on contact page'
            }
        }
    
    @staticmethod
    def _get_generic_instructions(broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic instructions for manual removal"""
        broker_name = broker_data.get('name', 'Data Broker')
        removal_url = broker_data.get('removal_url', '')
        
        return {
            'broker_name': broker_name,
            'difficulty': 'Medium',
            'estimated_time': '10-15 minutes',
            'success_rate': '80%',
            'steps': [
                {
                    'step': 1,
                    'title': 'Search for Your Profile',
                    'description': f'Visit {broker_data.get("website", "")} and search for your information',
                    'details': 'Try different combinations of your name, addresses, and phone numbers'
                },
                {
                    'step': 2,
                    'title': 'Document Your Information',
                    'description': 'Take screenshots of any profiles containing your data',
                    'details': 'Save the URLs of these profiles for your removal request'
                },
                {
                    'step': 3,
                    'title': 'Access Removal Page',
                    'description': f'Navigate to their opt-out page: {removal_url}' if removal_url else 'Look for privacy policy or opt-out links',
                    'details': 'Usually found in footer links like "Privacy Policy" or "Opt Out"'
                },
                {
                    'step': 4,
                    'title': 'Submit Removal Request',
                    'description': 'Complete their removal form or send email request',
                    'details': broker_data.get('removal_instructions', 'Follow the instructions on their opt-out page')
                },
                {
                    'step': 5,
                    'title': 'Follow Up',
                    'description': 'Monitor for confirmation and follow up if needed',
                    'details': f'Response time is typically {broker_data.get("estimated_time", "1-2 weeks")}'
                }
            ],
            'tips': [
                'Be thorough in your search - try variations of your information',
                'Keep records of your submission',
                'Be patient with response times',
                'Follow up if you don\'t receive confirmation'
            ],
            'contact_info': {
                'email': f'privacy@{broker_data.get("website", "").replace("www.", "")}',
                'website': broker_data.get('website', ''),
                'removal_url': removal_url
            }
        }
    
    @staticmethod
    def generate_removal_checklist(user_data: Dict[str, Any], manual_brokers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a complete removal checklist for manual brokers"""
        
        checklist = {
            'user_name': user_data.get('full_name', ''),
            'total_manual_brokers': len(manual_brokers),
            'estimated_total_time': f"{len(manual_brokers) * 15}-{len(manual_brokers) * 25} minutes",
            'brokers': []
        }
        
        for broker in manual_brokers:
            instructions = ManualRemovalInstructions.get_detailed_instructions(broker)
            email_template = ManualRemovalInstructions.generate_email_template(user_data, broker)
            
            broker_checklist = {
                'broker_name': broker.get('name', ''),
                'website': broker.get('website', ''),
                'removal_url': broker.get('removal_url', ''),
                'instructions': instructions,
                'email_template': email_template,
                'checklist_items': [
                    {'task': f'Search for your profile on {broker.get("name", "")}', 'completed': False},
                    {'task': 'Document/screenshot your information', 'completed': False},
                    {'task': 'Submit removal request', 'completed': False},
                    {'task': 'Wait for confirmation', 'completed': False},
                    {'task': 'Verify removal completed', 'completed': False}
                ]
            }
            
            checklist['brokers'].append(broker_checklist)
        
        return checklist

# Global instance
manual_removal_instructions = ManualRemovalInstructions()