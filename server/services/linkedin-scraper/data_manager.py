# data_manager.py
import os
import json
import pandas as pd
from flask import current_app
from datetime import datetime

def ensure_directories():
    """Ensure all required directories exist"""
    os.makedirs(current_app.config['DATA_DIR'], exist_ok=True)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)

def save_trusted_network(network_list):
    """Save the user's trusted network to a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'trusted_network.json')
    with open(filepath, 'w') as f:
        json.dump(network_list, f)

def load_trusted_network():
    """Load the user's trusted network from a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'trusted_network.json')
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return []

def clear_trusted_network():
    """Delete all contacts from the trusted network"""
    # Save an empty list to the trusted network file
    save_trusted_network([])
    return True

def save_icp_and_personas(icp_data):
    """Save ICP and Personas to a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'icp_and_personas.json')
    with open(filepath, 'w') as f:
        json.dump(icp_data, f)

def load_icp_and_personas():
    """Load ICP and Personas from a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'icp_and_personas.json')
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return {
            'icp': {
                'industry': 'Technology',
                'company_size': '50-1000 employees',
                'geography': 'North America',
                'other_criteria': ['B2B focused', 'Growth stage']
            },
            'buyer_persona': {
                'title': 'VP of Sales',
                'role': 'Decision maker',
                'pain_points': ['Low conversion rates', 'Inefficient sales process'],
                'search_terms': 'VP Sales OR Head of Sales OR Sales Director'
            },
            'user_persona': {
                'title': 'Sales Representative',
                'role': 'End user',
                'pain_points': ['Cold outreach difficulties', 'Low response rates'],
                'search_terms': 'Sales Representative OR Account Executive OR BDR'
            }
        }

def save_profile_data(profiles, filename='profiles.json'):
    """Save profiles to a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], filename)
    with open(filepath, 'w') as f:
        json.dump(profiles, f)

def load_profile_data(filename='profiles.json'):
    """Load profiles from a JSON file"""
    filepath = os.path.join(current_app.config['DATA_DIR'], filename)
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return []

def save_csill(csill_data):
    """Save the Connection-Sorted Intelligent Lead List"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'csill.json')
    with open(filepath, 'w') as f:
        json.dump(csill_data, f)

def load_csill():
    """Load the Connection-Sorted Intelligent Lead List"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'csill.json')
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return []

def save_message(profile_id, message, status='approve'):
    """Save an approved/edited message"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'messages.json')
    
    try:
        with open(filepath, 'r') as f:
            messages = json.load(f)
    except:
        messages = []
    
    # Create new message entry
    message_entry = {
        'profile_id': profile_id,
        'message': message,
        'status': status,
        'timestamp': datetime.now().isoformat()
    }
    
    messages.append(message_entry)
    
    # Write back to file
    with open(filepath, 'w') as f:
        json.dump(messages, f)
    
    return message_entry

def load_messages():
    """Load all saved messages"""
    filepath = os.path.join(current_app.config['DATA_DIR'], 'messages.json')
    try:
        with open(filepath, 'r') as f:
            messages = json.load(f)
        
        # Try to add profile info to messages
        csill = load_csill()
        for message in messages:
            profile_id = message.get('profile_id')
            if isinstance(profile_id, int) and profile_id < len(csill):
                message['profile'] = csill[profile_id]
            else:
                message['profile'] = {'name': 'Unknown', 'headline': '', 'location': ''}
        
        return messages
    except:
        return []

def import_trusted_network_from_csv(csv_path):
    """Import Trusted Network List from a CSV file"""
    try:
        # Try to infer delimiter - first try comma
        try:
            df = pd.read_csv(csv_path)
        except:
            # If standard CSV fails, try with different delimiters
            try:
                df = pd.read_csv(csv_path, sep=';')  # Try semicolon (common in European CSVs)
            except:
                try:
                    df = pd.read_csv(csv_path, sep='\t')  # Try tab
                except:
                    # Last resort - try to read with Python's built-in csv module
                    import csv
                    try:
                        with open(csv_path, 'r', newline='', encoding='utf-8-sig') as f:
                            dialect = csv.Sniffer().sniff(f.read(1024))
                            f.seek(0)
                            reader = csv.DictReader(f, dialect=dialect)
                            rows = list(reader)
                            if rows:
                                # Convert to pandas DataFrame
                                df = pd.DataFrame(rows)
                            else:
                                return [], "Empty CSV file"
                    except:
                        return [], "Unable to determine CSV format. Please ensure it's a valid CSV file."
        
        # Check for required columns - look for 'name' or 'Name' or variations
        name_column = None
        for col in df.columns:
            if col.lower() == 'name' or col.lower() == 'contact' or col.lower() == 'contact name' or col.lower() == 'full name':
                name_column = col
                break
        
        if not name_column:
            return [], "CSV must contain a column with names (e.g., 'name', 'contact', 'full name')"
        
        # Try to identify trust_score and notes columns
        trust_column = None
        for col in df.columns:
            if 'trust' in col.lower() or 'score' in col.lower() or 'rating' in col.lower():
                trust_column = col
                break
        
        notes_column = None
        for col in df.columns:
            if 'note' in col.lower() or 'comment' in col.lower() or 'description' in col.lower():
                notes_column = col
                break
        
        # Convert to list of dicts
        tnl = []
        for _, row in df.iterrows():
            # Skip rows with missing name
            if pd.isna(row[name_column]) or row[name_column].strip() == '':
                continue
                
            entry = {
                'name': row[name_column].strip(),
                'trust_score': 5,  # Default value
                'notes': ''
            }
            
            # Add trust score if available
            if trust_column and trust_column in row:
                try:
                    if not pd.isna(row[trust_column]):
                        score_value = row[trust_column]
                        if isinstance(score_value, str):
                            # Try to convert string to number
                            try:
                                score_value = float(score_value.replace(',', '.'))
                            except:
                                score_value = 5
                        score_value = int(score_value)
                        # Ensure score is between 1-10
                        entry['trust_score'] = max(1, min(10, score_value))
                except:
                    pass  # Keep default if conversion fails
            
            # Add notes if available
            if notes_column and notes_column in row:
                if not pd.isna(row[notes_column]):
                    entry['notes'] = str(row[notes_column]).strip()
            
            tnl.append(entry)
        
        if not tnl:
            return [], "No valid contacts found in the CSV file"
        
        # Save the imported TNL
        save_trusted_network(tnl)
        
        return tnl, None  # Return TNL and no error
    except Exception as e:
        return [], f"Error importing CSV: {str(e)}"