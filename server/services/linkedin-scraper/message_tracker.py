from datetime import datetime
import json
import os
from flask import current_app

class MessageStatus:
    PENDING = 'pending'
    SENT = 'sent'
    ACCEPTED = 'accepted'
    DECLINED = 'declined'
    REPLIED = 'replied'
    NO_RESPONSE = 'no_response'

class MessageTracker:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.messages_file = os.path.join(data_dir, 'message_tracking.json')
        self._ensure_tracking_file()
    
    def _ensure_tracking_file(self):
        """Ensure tracking file exists with proper structure"""
        if not os.path.exists(self.messages_file):
            with open(self.messages_file, 'w') as f:
                json.dump({
                    'messages': [],
                    'stats': {
                        'total_sent': 0,
                        'accepted': 0,
                        'declined': 0,
                        'replied': 0,
                        'no_response': 0,
                        'pending': 0
                    }
                }, f)

    def _load_tracking_data(self):
        """Load tracking data from file"""
        with open(self.messages_file, 'r') as f:
            return json.load(f)

    def _save_tracking_data(self, data):
        """Save tracking data to file"""
        with open(self.messages_file, 'w') as f:
            json.dump(data, f)

    def _update_stats(self, data, old_status=None, new_status=None):
        """Update statistics when message status changes"""
        stats = data['stats']
        
        # Decrement old status count if exists
        if old_status:
            stats[old_status] = max(0, stats.get(old_status, 0) - 1)
        
        # Increment new status count
        if new_status:
            stats[new_status] = stats.get(new_status, 0) + 1
            if new_status == MessageStatus.SENT and not old_status:
                stats['total_sent'] += 1

    def track_message(self, profile_id, message_content, profile_data):
        """Add a new message to tracking"""
        data = self._load_tracking_data()
        
        message_entry = {
            'id': f"msg_{len(data['messages'])}_{int(datetime.now().timestamp())}",
            'profile_id': profile_id,
            'profile_data': profile_data,
            'message': message_content,
            'status': MessageStatus.PENDING,
            'sent_date': None,
            'response_date': None,
            'reply_content': None,
            'notes': None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        data['messages'].append(message_entry)
        self._update_stats(data, new_status=MessageStatus.PENDING)
        self._save_tracking_data(data)
        
        return message_entry

    def update_message_status(self, message_id, new_status, response_content=None, notes=None):
        """Update status of a message and record any response"""
        data = self._load_tracking_data()
        
        for message in data['messages']:
            if message['id'] == message_id:
                old_status = message['status']
                message['status'] = new_status
                message['updated_at'] = datetime.now().isoformat()
                
                if new_status == MessageStatus.SENT and not message['sent_date']:
                    message['sent_date'] = datetime.now().isoformat()
                
                if new_status in [MessageStatus.REPLIED, MessageStatus.ACCEPTED, MessageStatus.DECLINED]:
                    message['response_date'] = datetime.now().isoformat()
                
                if response_content:
                    message['reply_content'] = response_content
                
                if notes:
                    message['notes'] = notes
                
                self._update_stats(data, old_status, new_status)
                self._save_tracking_data(data)
                return message
        
        return None

    def get_message_stats(self):
        """Get overall message statistics"""
        data = self._load_tracking_data()
        return data['stats']

    def get_messages(self, status=None, days=None):
        """Get messages with optional filtering"""
        data = self._load_tracking_data()
        messages = data['messages']
        
        if status:
            messages = [m for m in messages if m['status'] == status]
        
        if days:
            cutoff = datetime.now() - timedelta(days=days)
            messages = [m for m in messages if datetime.fromisoformat(m['created_at']) > cutoff]
        
        return messages

    def get_message(self, message_id):
        """Get a specific message by ID"""
        data = self._load_tracking_data()
        for message in data['messages']:
            if message['id'] == message_id:
                return message
        return None

    def add_note(self, message_id, note):
        """Add a note to a message"""
        data = self._load_tracking_data()
        
        for message in data['messages']:
            if message['id'] == message_id:
                if message.get('notes'):
                    message['notes'] += f"\n{datetime.now().isoformat()}: {note}"
                else:
                    message['notes'] = f"{datetime.now().isoformat()}: {note}"
                
                message['updated_at'] = datetime.now().isoformat()
                self._save_tracking_data(data)
                return message
        
        return None

    def get_response_rate(self, days=30):
        """Calculate response rate statistics for a given time period"""
        messages = self.get_messages(days=days)
        
        if not messages:
            return {
                'acceptance_rate': 0,
                'reply_rate': 0,
                'avg_response_time': 0
            }
        
        sent_count = len([m for m in messages if m['status'] != MessageStatus.PENDING])
        accepted_count = len([m for m in messages if m['status'] == MessageStatus.ACCEPTED])
        replied_count = len([m for m in messages if m['status'] == MessageStatus.REPLIED])
        
        response_times = []
        for message in messages:
            if message['sent_date'] and message['response_date']:
                sent = datetime.fromisoformat(message['sent_date'])
                responded = datetime.fromisoformat(message['response_date'])
                response_times.append((responded - sent).total_seconds() / 3600)  # hours
        
        return {
            'acceptance_rate': (accepted_count / sent_count * 100) if sent_count > 0 else 0,
            'reply_rate': (replied_count / sent_count * 100) if sent_count > 0 else 0,
            'avg_response_time': sum(response_times) / len(response_times) if response_times else 0
        } 