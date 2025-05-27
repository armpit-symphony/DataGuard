"""
Data Broker Automation Engine
Handles automated removal requests for data brokers that support automation
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from playwright.async_api import async_playwright, Page, Browser
from datetime import datetime, timedelta
import re
import json

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None
        
    async def start(self):
        """Initialize the automation engine"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        
    async def stop(self):
        """Clean up resources"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def process_removal_request(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an automated removal request for a specific data broker
        
        Args:
            user_data: User's personal information
            broker_data: Data broker configuration and endpoints
            
        Returns:
            Dict containing status, success, and details
        """
        broker_name = broker_data.get('name', '').lower()
        
        try:
            if not broker_data.get('automation_available', False):
                return {
                    'success': False,
                    'status': 'requires_manual',
                    'message': f'{broker_name} requires manual removal',
                    'details': {
                        'removal_url': broker_data.get('removal_url'),
                        'instructions': broker_data.get('removal_instructions')
                    }
                }
            
            # Route to specific automation handler
            if 'whitepages' in broker_name:
                return await self._process_whitepages(user_data, broker_data)
            elif 'spokeo' in broker_name:
                return await self._process_spokeo(user_data, broker_data)
            elif 'beenverified' in broker_name:
                return await self._process_beenverified(user_data, broker_data)
            elif 'intelius' in broker_name:
                return await self._process_intelius(user_data, broker_data)
            elif 'truepeoplesearch' in broker_name:
                return await self._process_truepeoplesearch(user_data, broker_data)
            elif 'mylife' in broker_name:
                return await self._process_mylife(user_data, broker_data)
            else:
                return await self._process_generic_form(user_data, broker_data)
                
        except Exception as e:
            logger.error(f"Error processing removal for {broker_name}: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'Automation failed for {broker_name}: {str(e)}',
                'error': str(e)
            }
    
    async def _process_whitepages(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process Whitepages removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to Whitepages opt-out page
            await page.goto('https://www.whitepages.com/suppression_requests', wait_until='networkidle')
            
            # Fill out the form
            await page.fill('input[name="firstName"]', user_data.get('first_name', ''))
            await page.fill('input[name="lastName"]', user_data.get('last_name', ''))
            await page.fill('input[name="email"]', user_data.get('email', ''))
            await page.fill('input[name="phone"]', user_data.get('phone', ''))
            await page.fill('input[name="address"]', user_data.get('current_address', ''))
            
            # Submit the form
            await page.click('button[type="submit"]')
            
            # Wait for confirmation
            await page.wait_for_selector('.success-message', timeout=10000)
            
            return {
                'success': True,
                'status': 'in_progress',
                'message': 'Whitepages removal request submitted successfully',
                'verification_required': True,
                'estimated_completion': '24h'
            }
            
        except Exception as e:
            logger.error(f"Whitepages automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'Whitepages automation failed: {str(e)}',
                'fallback_url': 'https://www.whitepages.com/suppression_requests'
            }
        finally:
            await page.close()
    
    async def _process_spokeo(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process Spokeo removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to Spokeo opt-out page
            await page.goto('https://www.spokeo.com/optout', wait_until='networkidle')
            
            # Search for the user's profile first
            search_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}"
            await page.fill('input[name="q"]', search_name)
            await page.click('button[type="submit"]')
            
            # Wait for search results
            await page.wait_for_selector('.search-results', timeout=10000)
            
            # Look for matching profiles
            profiles = await page.query_selector_all('.profile-card')
            
            if profiles:
                # Click on the first matching profile
                await profiles[0].click()
                
                # Look for opt-out link
                opt_out_link = await page.query_selector('a[href*="optout"]')
                if opt_out_link:
                    await opt_out_link.click()
                    
                    # Fill out opt-out form
                    await page.fill('input[name="email"]', user_data.get('email', ''))
                    await page.click('button[type="submit"]')
                    
                    return {
                        'success': True,
                        'status': 'in_progress',
                        'message': 'Spokeo removal request submitted successfully',
                        'verification_required': True,
                        'estimated_completion': '3-5 days'
                    }
            
            # If no profile found or automation failed, provide manual instructions
            return {
                'success': False,
                'status': 'requires_manual',
                'message': 'Could not locate profile automatically. Manual removal required.',
                'fallback_url': 'https://www.spokeo.com/optout'
            }
            
        except Exception as e:
            logger.error(f"Spokeo automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'Spokeo automation failed: {str(e)}',
                'fallback_url': 'https://www.spokeo.com/optout'
            }
        finally:
            await page.close()
    
    async def _process_beenverified(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process BeenVerified removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to BeenVerified opt-out page
            await page.goto('https://www.beenverified.com/app/optout/search', wait_until='networkidle')
            
            # Fill search form
            await page.fill('input[name="firstName"]', user_data.get('first_name', ''))
            await page.fill('input[name="lastName"]', user_data.get('last_name', ''))
            await page.fill('input[name="state"]', self._extract_state(user_data.get('current_address', '')))
            
            # Submit search
            await page.click('button[type="submit"]')
            
            # Wait for results
            await page.wait_for_selector('.search-results', timeout=10000)
            
            # Look for matching records
            records = await page.query_selector_all('.record-item')
            
            if records:
                # Select the first matching record
                await records[0].click()
                
                # Fill out removal form
                await page.fill('input[name="email"]', user_data.get('email', ''))
                await page.fill('input[name="reason"]', 'Privacy concerns')
                await page.click('button[value="remove"]')
                
                return {
                    'success': True,
                    'status': 'in_progress',
                    'message': 'BeenVerified removal request submitted successfully',
                    'verification_required': True,
                    'estimated_completion': '24h'
                }
            
            return {
                'success': False,
                'status': 'requires_manual',
                'message': 'Could not locate record automatically. Manual removal required.',
                'fallback_url': 'https://www.beenverified.com/app/optout/search'
            }
            
        except Exception as e:
            logger.error(f"BeenVerified automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'BeenVerified automation failed: {str(e)}',
                'fallback_url': 'https://www.beenverified.com/app/optout/search'
            }
        finally:
            await page.close()
    
    async def _process_intelius(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process Intelius removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to Intelius opt-out page
            await page.goto('https://www.intelius.com/optout', wait_until='networkidle')
            
            # Fill out opt-out form
            await page.fill('input[name="fname"]', user_data.get('first_name', ''))
            await page.fill('input[name="lname"]', user_data.get('last_name', ''))
            await page.fill('input[name="email"]', user_data.get('email', ''))
            await page.fill('input[name="address"]', user_data.get('current_address', ''))
            
            # Submit form
            await page.click('button[type="submit"]')
            
            # Wait for confirmation
            await page.wait_for_selector('.confirmation-message', timeout=10000)
            
            return {
                'success': True,
                'status': 'in_progress',
                'message': 'Intelius removal request submitted successfully',
                'verification_required': True,
                'estimated_completion': '24h'
            }
            
        except Exception as e:
            logger.error(f"Intelius automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'Intelius automation failed: {str(e)}',
                'fallback_url': 'https://www.intelius.com/optout'
            }
        finally:
            await page.close()
    
    async def _process_truepeoplesearch(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process TruePeopleSearch removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to TruePeopleSearch removal page
            await page.goto('https://www.truepeoplesearch.com/removal', wait_until='networkidle')
            
            # Fill removal form
            await page.fill('input[name="first_name"]', user_data.get('first_name', ''))
            await page.fill('input[name="last_name"]', user_data.get('last_name', ''))
            await page.fill('input[name="email"]', user_data.get('email', ''))
            await page.fill('textarea[name="additional_info"]', 
                           f"Address: {user_data.get('current_address', '')}")
            
            # Submit form
            await page.click('input[type="submit"]')
            
            # Wait for confirmation
            await page.wait_for_selector('.success', timeout=10000)
            
            return {
                'success': True,
                'status': 'in_progress',
                'message': 'TruePeopleSearch removal request submitted successfully',
                'verification_required': True,
                'estimated_completion': '24h'
            }
            
        except Exception as e:
            logger.error(f"TruePeopleSearch automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'TruePeopleSearch automation failed: {str(e)}',
                'fallback_url': 'https://www.truepeoplesearch.com/removal'
            }
        finally:
            await page.close()
    
    async def _process_mylife(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process MyLife removal request"""
        page = await self.browser.new_page()
        
        try:
            # Navigate to MyLife CCPA opt-out page
            await page.goto('https://www.mylife.com/ccpa', wait_until='networkidle')
            
            # Fill CCPA form
            await page.fill('input[name="first_name"]', user_data.get('first_name', ''))
            await page.fill('input[name="last_name"]', user_data.get('last_name', ''))
            await page.fill('input[name="email"]', user_data.get('email', ''))
            await page.select_option('select[name="state"]', self._extract_state(user_data.get('current_address', '')))
            
            # Select deletion request
            await page.check('input[value="delete"]')
            
            # Submit form
            await page.click('button[type="submit"]')
            
            # Wait for confirmation
            await page.wait_for_selector('.confirmation', timeout=10000)
            
            return {
                'success': True,
                'status': 'in_progress',
                'message': 'MyLife removal request submitted successfully',
                'verification_required': True,
                'estimated_completion': '3-5 days'
            }
            
        except Exception as e:
            logger.error(f"MyLife automation error: {str(e)}")
            return {
                'success': False,
                'status': 'failed',
                'message': f'MyLife automation failed: {str(e)}',
                'fallback_url': 'https://www.mylife.com/ccpa'
            }
        finally:
            await page.close()
    
    async def _process_generic_form(self, user_data: Dict[str, Any], broker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic form processor for brokers with standard opt-out forms"""
        page = await self.browser.new_page()
        
        try:
            removal_url = broker_data.get('removal_url')
            if not removal_url:
                return {
                    'success': False,
                    'status': 'requires_manual',
                    'message': 'No removal URL available for automation'
                }
            
            await page.goto(removal_url, wait_until='networkidle')
            
            # Try to fill common form fields
            common_selectors = {
                'first_name': ['input[name="firstName"]', 'input[name="first_name"]', 'input[name="fname"]'],
                'last_name': ['input[name="lastName"]', 'input[name="last_name"]', 'input[name="lname"]'],
                'email': ['input[name="email"]', 'input[type="email"]'],
                'phone': ['input[name="phone"]', 'input[name="telephone"]', 'input[type="tel"]'],
                'address': ['input[name="address"]', 'textarea[name="address"]']
            }
            
            for field, selectors in common_selectors.items():
                value = user_data.get(field) or user_data.get(field.replace('_', ''), '')
                if value:
                    for selector in selectors:
                        try:
                            await page.fill(selector, value)
                            break
                        except:
                            continue
            
            # Try to submit the form
            submit_selectors = ['button[type="submit"]', 'input[type="submit"]', 'button[value="submit"]']
            for selector in submit_selectors:
                try:
                    await page.click(selector)
                    break
                except:
                    continue
            
            # Wait a bit to see if there's a success message
            await page.wait_for_timeout(3000)
            
            return {
                'success': True,
                'status': 'in_progress',
                'message': f'Generic form submission attempted for {broker_data.get("name")}',
                'requires_verification': True
            }
            
        except Exception as e:
            logger.error(f"Generic form automation error: {str(e)}")
            return {
                'success': False,
                'status': 'requires_manual',
                'message': f'Generic automation failed. Manual removal required.',
                'fallback_url': broker_data.get('removal_url')
            }
        finally:
            await page.close()
    
    def _extract_state(self, address: str) -> str:
        """Extract state abbreviation from address"""
        # Simple regex to find 2-letter state codes
        state_match = re.search(r'\b([A-Z]{2})\b', address.upper())
        return state_match.group(1) if state_match else 'CA'
    
    async def batch_process_removals(self, user_data: Dict[str, Any], brokers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process multiple removal requests in batch
        
        Args:
            user_data: User's personal information
            brokers: List of data broker configurations
            
        Returns:
            List of results for each broker
        """
        results = []
        
        for broker in brokers:
            try:
                result = await self.process_removal_request(user_data, broker)
                result['broker_id'] = broker.get('id')
                result['broker_name'] = broker.get('name')
                result['processed_at'] = datetime.utcnow().isoformat()
                results.append(result)
                
                # Small delay between requests to be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error processing {broker.get('name')}: {str(e)}")
                results.append({
                    'broker_id': broker.get('id'),
                    'broker_name': broker.get('name'),
                    'success': False,
                    'status': 'failed',
                    'message': f'Batch processing failed: {str(e)}',
                    'processed_at': datetime.utcnow().isoformat()
                })
        
        return results

# Global automation engine instance
automation_engine = AutomationEngine()