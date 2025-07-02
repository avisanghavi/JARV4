from datetime import datetime
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
from message_tracker import MessageTracker, MessageStatus

class LinkedInTracker:
    def __init__(self, data_dir, linkedin_email=None, linkedin_password=None):
        self.data_dir = data_dir
        self.message_tracker = MessageTracker(data_dir)
        self.linkedin_email = linkedin_email or os.environ.get('LINKEDIN_EMAIL')
        self.linkedin_password = linkedin_password or os.environ.get('LINKEDIN_PASSWORD')
        self.driver = None
        
    def initialize_driver(self):
        """Initialize Selenium WebDriver"""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # Run in headless mode
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(options=options)
        
    def login_to_linkedin(self):
        """Login to LinkedIn"""
        try:
            self.driver.get('https://www.linkedin.com/login')
            
            # Wait for and fill email
            email_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            email_field.send_keys(self.linkedin_email)
            
            # Fill password
            password_field = self.driver.find_element(By.ID, "password")
            password_field.send_keys(self.linkedin_password)
            
            # Click login button
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Wait for successful login
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "global-nav"))
            )
            return True
        except Exception as e:
            print(f"Error logging in to LinkedIn: {e}")
            return False
            
    def track_sent_messages(self):
        """Track messages sent through LinkedIn"""
        try:
            # Navigate to messages
            self.driver.get('https://www.linkedin.com/messaging/')
            time.sleep(3)  # Wait for messages to load
            
            # Get all conversations
            conversations = self.driver.find_elements(By.CSS_SELECTOR, "li.conversation-list-item")
            
            for conversation in conversations:
                try:
                    # Click conversation to load messages
                    conversation.click()
                    time.sleep(2)
                    
                    # Get recipient name
                    recipient_name = self.driver.find_element(
                        By.CSS_SELECTOR, ".msg-conversation-card__profile-info h3"
                    ).text
                    
                    # Get messages in conversation
                    messages = self.driver.find_elements(
                        By.CSS_SELECTOR, ".msg-s-message-list__event"
                    )
                    
                    for message in messages:
                        # Check if message is sent by us
                        if "msg-s-message-list__event--outbound" in message.get_attribute("class"):
                            message_text = message.find_element(
                                By.CSS_SELECTOR, ".msg-s-message-list__message"
                            ).text
                            
                            # Track the message
                            self.message_tracker.track_message(
                                profile_id=None,  # We'll need to map this
                                message_content=message_text,
                                profile_data={"name": recipient_name}
                            )
                            
                except Exception as e:
                    print(f"Error processing conversation: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error tracking messages: {e}")
            
    def check_message_responses(self):
        """Check for responses to tracked messages"""
        try:
            # Navigate to messages
            self.driver.get('https://www.linkedin.com/messaging/')
            time.sleep(3)
            
            # Get all conversations
            conversations = self.driver.find_elements(By.CSS_SELECTOR, "li.conversation-list-item")
            
            for conversation in conversations:
                try:
                    # Click conversation to load messages
                    conversation.click()
                    time.sleep(2)
                    
                    # Get recipient name
                    recipient_name = self.driver.find_element(
                        By.CSS_SELECTOR, ".msg-conversation-card__profile-info h3"
                    ).text
                    
                    # Get latest message
                    latest_message = self.driver.find_elements(
                        By.CSS_SELECTOR, ".msg-s-message-list__event"
                    )[-1]
                    
                    # Check if it's a response to our message
                    if "msg-s-message-list__event--inbound" in latest_message.get_attribute("class"):
                        response_text = latest_message.find_element(
                            By.CSS_SELECTOR, ".msg-s-message-list__message"
                        ).text
                        
                        # Update message status
                        self.message_tracker.update_message_status(
                            message_id=None,  # We'll need to map this
                            new_status=MessageStatus.REPLIED,
                            response_content=response_text
                        )
                        
                except Exception as e:
                    print(f"Error checking conversation: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error checking responses: {e}")
            
    def run_tracking(self):
        """Run the complete tracking process"""
        try:
            self.initialize_driver()
            if self.login_to_linkedin():
                self.track_sent_messages()
                self.check_message_responses()
        finally:
            if self.driver:
                self.driver.quit()
                
    def get_tracking_stats(self, days=30):
        """Get tracking statistics"""
        return self.message_tracker.get_response_rate(days=days) 