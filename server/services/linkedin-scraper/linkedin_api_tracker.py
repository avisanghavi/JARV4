import os
import time
from datetime import datetime
import requests
from dotenv import load_dotenv
from message_tracker import MessageTracker, MessageStatus

class LinkedInAPITracker:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.message_tracker = MessageTracker(data_dir)
        load_dotenv()
        
        # LinkedIn API credentials
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        self.access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        self.api_base_url = 'https://api.linkedin.com/v2'
        
    def get_messages(self):
        """Get messages using LinkedIn Messaging API"""
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            # Get conversations
            response = requests.get(
                f'{self.api_base_url}/messaging/conversations',
                headers=headers
            )
            
            if response.status_code == 200:
                conversations = response.json().get('elements', [])
                
                for conversation in conversations:
                    # Get messages in conversation
                    messages_response = requests.get(
                        f"{self.api_base_url}/messaging/conversations/{conversation['id']}/events",
                        headers=headers
                    )
                    
                    if messages_response.status_code == 200:
                        messages = messages_response.json().get('elements', [])
                        self.process_messages(messages, conversation)
                        
        except Exception as e:
            print(f"Error getting messages: {e}")
            
    def process_messages(self, messages, conversation):
        """Process messages and update tracking"""
        for message in messages:
            try:
                # Check if message is from us
                if message.get('from', {}).get('com.linkedin.voyager.messaging.MessagingMember', {}).get('id') == self.get_my_id():
                    # Track sent message
                    self.message_tracker.track_message(
                        profile_id=message.get('id'),
                        message_content=message.get('eventContent', {}).get('com.linkedin.voyager.messaging.event.MessageEvent', {}).get('body'),
                        profile_data={
                            'name': conversation.get('participants', [{}])[0].get('name'),
                            'id': conversation.get('participants', [{}])[0].get('id')
                        }
                    )
                else:
                    # Check for responses
                    self.message_tracker.update_message_status(
                        message_id=message.get('id'),
                        new_status=MessageStatus.REPLIED,
                        response_content=message.get('eventContent', {}).get('com.linkedin.voyager.messaging.event.MessageEvent', {}).get('body')
                    )
                    
            except Exception as e:
                print(f"Error processing message: {e}")
                continue
                
    def get_my_id(self):
        """Get current user's LinkedIn ID"""
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            response = requests.get(
                f'{self.api_base_url}/me',
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json().get('id')
                
        except Exception as e:
            print(f"Error getting user ID: {e}")
            return None
            
    def get_tracking_stats(self, days=30):
        """Get tracking statistics"""
        return self.message_tracker.get_response_rate(days=days)
        
    def run_tracking(self):
        """Run the complete tracking process"""
        try:
            self.get_messages()
        except Exception as e:
            print(f"Error in tracking process: {e}") 