from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, Response
import os
from werkzeug.utils import secure_filename
import json
import time
from pathlib import Path
from datetime import datetime
import pandas as pd
from functools import wraps
import io
import csv
from flask_cors import CORS

# Import utility modules
from utils import allowed_file, extract_text_from_file, ensure_data_dir
from linkedin_scraper import linkedin_search, save_cookies, load_cookies, create_sample_profiles
from ai_processor import generate_icp_and_personas, find_mutual_connections, generate_outreach_message
from data_manager import save_trusted_network, load_trusted_network, import_trusted_network_from_csv, clear_trusted_network
from message_tracker import MessageTracker, MessageStatus

# Import US states
from us_states import US_STATES

# Configuration
class Config:
    SECRET_KEY = 'your-secret-key-here'
    UPLOAD_FOLDER = 'uploads'
    DATA_DIR = 'data'
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt', 'csv'}
    OPENAI_API_KEY = 'your-openai-api-key-here'

    # Pull LinkedIn credentials from environment variables or use fallback
    LINKEDIN_EMAIL = os.getenv('LINKEDIN_EMAIL', 'your-linkedin-email')
    LINKEDIN_PASSWORD = os.getenv('LINKEDIN_PASSWORD', 'your-linkedin-password')

    GPT_MODEL = 'gpt-4'
    TEMPERATURE = 0.7

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)  # Enable CORS for all routes

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['DATA_DIR'], exist_ok=True)

# Initialize message tracker
message_tracker = MessageTracker(os.path.join(os.path.dirname(__file__), 'data'))

def credentials_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('LINKEDIN_EMAIL') or not session.get('LINKEDIN_PASSWORD'):
            flash('Please enter your LinkedIn credentials first', 'warning')
            return redirect(url_for('credentials'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@credentials_required
def index():
    product_uploaded = os.path.exists(os.path.join(app.config['DATA_DIR'], 'product_description.txt'))
    return render_template('index.html', product_uploaded=product_uploaded)

@app.route('/upload_product', methods=['POST'])
@credentials_required
def upload_product():
    if 'product_description' not in request.files:
        flash('No file part', 'error')
        return redirect(url_for('index'))
    
    file = request.files['product_description']
    
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from the file
        product_text = extract_text_from_file(filepath)
        
        # Save product description text
        with open(os.path.join(app.config['DATA_DIR'], 'product_description.txt'), 'w') as f:
            f.write(product_text)
        
        # Generate ICP and Personas
        icp_data = generate_icp_and_personas(product_text)
        
        if icp_data:
            with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'w') as f:
                json.dump(icp_data, f)
            
            # Store in session for convenience
            session['icp'] = icp_data.get('icp', {})
            session['buyer_persona'] = icp_data.get('buyer_persona', {})
            session['user_persona'] = icp_data.get('user_persona', {})
        
        flash('Product description uploaded and analyzed successfully', 'success')
        return redirect(url_for('view_product'))
    
    flash('Invalid file type', 'error')
    return redirect(url_for('index'))

@app.route('/view_product')
@credentials_required
def view_product():
    try:
        # Read product description
        with open(os.path.join(app.config['DATA_DIR'], 'product_description.txt'), 'r') as f:
            product_text = f.read()
        
        # Try to load ICP data, create default if not found
        try:
            with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'r') as f:
                icp_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            print("ICP data not found or invalid, using default values")
            icp_data = {
                "icp": {
                    "industry": "Technology",
                    "company_size": "50-1000 employees",
                    "geography": "North America",
                    "other_criteria": ["B2B focused", "Growth stage"]
                },
                "buyer_persona": {
                    "title": "VP of Sales",
                    "role": "Decision maker",
                    "pain_points": ["Low conversion rates", "Inefficient sales process"],
                    "search_terms": "VP Sales OR Head of Sales OR Sales Director"
                },
                "user_persona": {
                    "title": "Sales Representative",
                    "role": "End user",
                    "pain_points": ["Cold outreach difficulties", "Low response rates"],
                    "search_terms": "Sales Representative OR Account Executive OR BDR"
                }
            }
            
            # Save the default data so it's available for future requests
            with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'w') as f:
                json.dump(icp_data, f)
        
        return render_template('view_product.html', 
                              product_text=product_text, 
                              icp_data=icp_data,
                              product_filename="Product Description")
    except Exception as e:
        print(f"Error in view_product: {e}")
        flash('Product description not found', 'error')
        return redirect(url_for('index'))

@app.route('/trusted_network', methods=['GET', 'POST'])
@credentials_required
def trusted_network():
    if request.method == 'POST':
        if 'tnl_file' in request.files:
            # File upload approach
            file = request.files['tnl_file']
            
            if file.filename == '':
                flash('No selected file', 'error')
                return redirect(url_for('trusted_network'))
            
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Process uploaded file (CSV expected)
                try:
                    # Use the dedicated function from data_manager for importing CSV
                    tnl_data, error = import_trusted_network_from_csv(filepath)
                    
                    if error:
                        flash(f'Error processing CSV: {error}', 'error')
                        return redirect(url_for('trusted_network'))
                    
                    if not tnl_data:
                        flash('No valid contacts found in the CSV file. Please check the format.', 'warning')
                        return redirect(url_for('trusted_network'))
                    
                    flash(f'Successfully imported {len(tnl_data)} contacts to your trusted network', 'success')
                    return redirect(url_for('trusted_network'))
                except Exception as e:
                    flash(f'Error processing CSV: {str(e)}', 'error')
                    return redirect(url_for('trusted_network'))
            else:
                flash('Invalid file type. Please upload a CSV file.', 'error')
                return redirect(url_for('trusted_network'))
        
        elif 'manual_tnl' in request.form:
            # Manual entry approach
            tnl_json = request.form.get('manual_tnl', '[]')
            try:
                trusted_network_list = json.loads(tnl_json)
                save_trusted_network(trusted_network_list)
                flash('Trusted network saved successfully', 'success')
                return redirect(url_for('trusted_network'))
            except:
                flash('Invalid JSON format', 'error')
                return redirect(url_for('trusted_network'))
    
    # GET request - load and display trusted network
    trusted_network_list = load_trusted_network()
    return render_template('trusted_network.html', trusted_network=trusted_network_list)

@app.route('/define_icp', methods=['GET', 'POST'])
@credentials_required
def define_icp():
    if request.method == 'POST':
        # Get form data
        icp = {
            'industry': request.form.get('industry'),
            'company_size': request.form.get('company_size'),
            'geography': request.form.get('geography'),
            'other_criteria': request.form.get('other_criteria', '').split(',')
        }
        
        buyer_persona = {
            'title': request.form.get('buyer_title'),
            'role': request.form.get('buyer_role'),
            'pain_points': request.form.get('buyer_pain_points', '').split(','),
            'search_terms': request.form.get('buyer_search_terms')
        }
        
        user_persona = {
            'title': request.form.get('user_title'),
            'role': request.form.get('user_role'),
            'pain_points': request.form.get('user_pain_points', '').split(','),
            'search_terms': request.form.get('user_search_terms')
        }
        
        # Save to file
        icp_data = {
            'icp': icp,
            'buyer_persona': buyer_persona,
            'user_persona': user_persona
        }
        
        with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'w') as f:
            json.dump(icp_data, f)
        
        # Store in session for convenience
        session['icp'] = icp
        session['buyer_persona'] = buyer_persona
        session['user_persona'] = user_persona
        
        flash('ICP and Personas saved successfully', 'success')
        return redirect(url_for('search_form'))
    
    # GET request - load current ICP and personas if they exist
    try:
        with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'r') as f:
            icp_data = json.load(f)
        
        icp = icp_data.get('icp', {})
        buyer_persona = icp_data.get('buyer_persona', {})
        user_persona = icp_data.get('user_persona', {})
    except:
        # Default values if no data exists
        icp = {'industry': 'Technology', 'company_size': '50-1000 employees', 'geography': 'North America', 'other_criteria': []}
        buyer_persona = {'title': 'VP Sales', 'role': 'Decision maker', 'pain_points': [], 'search_terms': ''}
        user_persona = {'title': 'Sales Rep', 'role': 'End user', 'pain_points': [], 'search_terms': ''}
    
    return render_template('define_icp.html', 
                           icp=icp, 
                           buyer_persona=buyer_persona, 
                           user_persona=user_persona)

@app.route('/search_form')
@credentials_required
def search_form():
    """Display the search form with location filtering."""
    # Load ICP and Personas for search suggestions
    try:
        with open(os.path.join(app.config['DATA_DIR'], 'icp_and_personas.json'), 'r') as f:
            icp_data = json.load(f)
            buyer_search_terms = icp_data.get('buyer_persona', {}).get('search_terms', '')
            user_search_terms = icp_data.get('user_persona', {}).get('search_terms', '')
    except:
        buyer_search_terms = ""
        user_search_terms = ""
    
    return render_template('search_form.html',
                         buyer_search_terms=buyer_search_terms,
                         user_search_terms=user_search_terms,
                         search_query=session.get('search_query', ''),
                         max_results=session.get('max_results', 20),
                         selected_state=session.get('selected_state', ''),
                         company_size=session.get('company_size', ''),
                         us_states=US_STATES)

@app.route('/search', methods=['POST'])
@credentials_required
def search():
    """Handle the search form submission."""
    search_query = request.form.get('search_query', '')
    max_results = int(request.form.get('max_results', 20))
    selected_state = request.form.get('selected_state', '')
    company_size = request.form.get('company_size', '')
    
    # Store in session
    session['search_query'] = search_query
    session['max_results'] = max_results
    session['selected_state'] = selected_state
    session['company_size'] = company_size
    
    # Perform LinkedIn search with location and company size filters
    profiles = linkedin_search(
        search_query=search_query,
        max_results=max_results,
        selected_state=selected_state,
        company_size=company_size
    )
    
    if profiles:
        flash(f'Found {len(profiles)} profiles matching your search', 'success')
        return redirect(url_for('results'))
    else:
        flash('No profiles found, please try a different search query', 'error')
        return redirect(url_for('search_form'))

@app.route('/results')
@credentials_required
def results():
    try:
        # Load profiles from file
        with open(os.path.join(app.config['DATA_DIR'], 'profiles.json'), 'r') as f:
            profiles = json.load(f)
        
        # Load trusted network
        trusted_network_list = load_trusted_network()
        
        # Find and sort by mutual connections
        sorted_profiles = find_mutual_connections(profiles, trusted_network_list)
        
        # Save the sorted profiles
        with open(os.path.join(app.config['DATA_DIR'], 'csill.json'), 'w') as f:
            json.dump(sorted_profiles, f)
        
        return render_template('results.html', profiles=sorted_profiles)
    except Exception as e:
        flash(f'Error loading results: {e}', 'error')
        return redirect(url_for('search_form'))

@app.route('/message_form/<int:profile_id>')
@credentials_required
def message_form(profile_id):
    try:
        # Load sorted profiles
        with open(os.path.join(app.config['DATA_DIR'], 'csill.json'), 'r') as f:
            profiles = json.load(f)
        
        if profile_id >= len(profiles):
            flash('Profile not found', 'error')
            return redirect(url_for('results'))
        
        profile = profiles[profile_id]
        
        # Load product description for context
        with open(os.path.join(app.config['DATA_DIR'], 'product_description.txt'), 'r') as f:
            product_description = f.read()
        
        return render_template('message_form.html', 
                               profile=profile,
                               profile_id=profile_id,
                               product_description=product_description)
    except Exception as e:
        flash(f'Error loading message form: {e}', 'error')
        return redirect(url_for('results'))

@app.route('/generate_message', methods=['POST'])
@credentials_required
def generate_message_route():
    profile_id = int(request.form.get('profile_id', 0))
    
    try:
        # Load profile
        with open(os.path.join(app.config['DATA_DIR'], 'csill.json'), 'r') as f:
            profiles = json.load(f)
        
        if profile_id >= len(profiles):
            flash('Profile not found', 'error')
            return redirect(url_for('results'))
        
        profile = profiles[profile_id]
        
        # Try to load product description if it exists, but don't require it
        try:
            with open(os.path.join(app.config['DATA_DIR'], 'product_description.txt'), 'r') as f:
                product_description = f.read()
        except:
            product_description = None
        
        # Determine best connection path for message
        connection_path = None
        if profile.get('mutual_connections'):
            # Get highest scored TNL connection if available
            tnl_connections = [c for c in profile['mutual_connections'] if c.get('in_tnl', False)]
            if tnl_connections:
                connection_path = max(tnl_connections, key=lambda c: c.get('tnl_score', 0))
            else:
                connection_path = profile['mutual_connections'][0]
        
        # Generate message
        message_data = generate_outreach_message(profile, product_description, connection_path)
        
        # Store generated message in the session
        session['generated_message'] = message_data
        
        return render_template('message_review.html',
                               profile=profile,
                               profile_id=profile_id,
                               message=message_data['message'],
                               message_type=message_data['type'],
                               recipient=message_data['recipient'])
    except Exception as e:
        flash(f'Error generating message: {e}', 'error')
        return redirect(url_for('message_form', profile_id=profile_id))

@app.route('/approve_message', methods=['POST'])
@credentials_required
def approve_message():
    profile_id = int(request.form.get('profile_id', 0))
    edited_message = request.form.get('edited_message', '')
    action = request.form.get('action', '')
    
    # Store the approved/edited message
    with open(os.path.join(app.config['DATA_DIR'], 'approved_messages.json'), 'a+') as f:
        f.seek(0)
        try:
            messages = json.load(f)
        except:
            messages = []
        
        message_entry = {
            'profile_id': profile_id,
            'message': edited_message,
            'status': action,
            'timestamp': datetime.now().isoformat()
        }
        
        messages.append(message_entry)
        
        # Seek to beginning and write updated messages
        f.seek(0)
        f.truncate()
        json.dump(messages, f)
    
    if action == 'approve':
        flash('Message approved and ready to send', 'success')
        return redirect(url_for('dashboard'))
    elif action == 'edit':
        flash('Message edited and saved', 'success')
        return redirect(url_for('message_form', profile_id=profile_id))
    else:  # action == 'reject'
        flash('Message rejected', 'warning')
        return redirect(url_for('message_form', profile_id=profile_id))

@app.route('/dashboard')
@credentials_required
def dashboard():
    # Load approved messages
    try:
        with open(os.path.join(app.config['DATA_DIR'], 'approved_messages.json'), 'r') as f:
            messages = json.load(f)
    except:
        messages = []
    
    # Load csill for profile info
    try:
        with open(os.path.join(app.config['DATA_DIR'], 'csill.json'), 'r') as f:
            profiles = json.load(f)
        
        # Add profile info to messages
        for message in messages:
            p_id = message.get('profile_id')
            if p_id < len(profiles):
                message['profile'] = profiles[p_id]
            else:
                message['profile'] = {'name': 'Unknown', 'headline': '', 'location': ''}
    except:
        for message in messages:
            message['profile'] = {'name': 'Unknown', 'headline': '', 'location': ''}
    
    return render_template('dashboard.html', messages=messages)

@app.route('/credentials', methods=['GET'])
def credentials():
    """Display the credentials management form."""
    return render_template('credentials.html')

@app.route('/save_credentials', methods=['POST'])
def save_credentials():
    """Save LinkedIn credentials to session."""
    linkedin_email = request.form.get('linkedin_email')
    linkedin_password = request.form.get('linkedin_password')
    
    if not linkedin_email or not linkedin_password:
        flash('Both email and password are required', 'danger')
        return redirect(url_for('credentials'))
    
    # Store in session
    session['LINKEDIN_EMAIL'] = linkedin_email
    session['LINKEDIN_PASSWORD'] = linkedin_password
    
    flash('Credentials saved successfully', 'success')
    return redirect(url_for('index'))

@app.route('/download_sample_tnl')
def download_sample_tnl():
    """Generate a sample TNL CSV file for users to download"""
    # Create a CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header and sample data
    writer.writerow(['name', 'trust_score', 'notes'])
    writer.writerow(['Jane Smith', '10', 'Former colleague at Acme Corp'])
    writer.writerow(['John Doe', '8', 'College friend'])
    writer.writerow(['Michael Johnson', '7', 'Industry contact'])
    writer.writerow(['Sarah Williams', '9', 'LinkedIn connection'])
    
    # Prepare the response
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=sample_trusted_network.csv"}
    )

@app.route('/clear_trusted_network', methods=['POST'])
@credentials_required
def clear_tnl():
    """Clear all contacts from the trusted network"""
    try:
        clear_trusted_network()
        flash('Your trusted network has been cleared successfully', 'success')
    except Exception as e:
        flash(f'Error clearing trusted network: {str(e)}', 'error')
    
    return redirect(url_for('trusted_network'))

def create_sample_profiles(search_query):
    """Create sample data if scraping fails."""
    # Create more realistic sample data (12+ profiles)
    profiles = []
    
    # Companies
    companies = ["Salesforce", "Microsoft", "Oracle", "HubSpot", "Adobe", 
                 "IBM", "SAP", "Zoom", "Slack", "Dell", "Google", "Amazon"]
    
    # Locations
    locations = ["San Francisco, CA", "New York, NY", "Boston, MA", "Chicago, IL",
                 "London, England, United Kingdom", "Austin, TX", "Toronto, ON, Canada",
                 "Seattle, WA", "Denver, CO", "Atlanta, GA", "Los Angeles, CA", "Dallas, TX"]
    
    # Names
    first_names = ["John", "Michael", "Sarah", "David", "Jennifer", "Robert", "Lisa",
                  "William", "Emma", "James", "Jessica", "Chris", "Amanda", "Daniel"]
    
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis",
                 "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"]
    
    # Job titles from search query
    job_titles = ["Sales Representative", "Account Executive", "BDR", 
                  "Business Development Representative", "Senior Account Executive",
                  "Enterprise Account Executive", "Sales Manager", "Account Manager"]
    
    # Generate 12 profiles
    for i in range(12):
        first_name = first_names[i % len(first_names)]
        last_name = last_names[i % len(last_names)]
        
        job_title = job_titles[i % len(job_titles)]
        company = companies[i % len(companies)]
        location = locations[i % len(locations)]
        
        # Connection level mix (1st, 2nd, with more 2nd)
        connection_level = "2nd" if i % 3 != 0 else "1st"
        
        # Add sample profile image URLs (using placeholder service)
        gender = "women" if i % 2 else "men"
        profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
        
        profile = {
            "name": f"{first_name} {last_name}",
            "headline": f"{job_title} at {company}",
            "location": location,
            "connection_level": connection_level,
            "profile_url": f"https://www.linkedin.com/in/{first_name.lower()}-{last_name.lower()}/",
            "profile_image": profile_image,  # Add profile image URL
            "mutual_connections": [],
            "tnl_connection": (i % 4 == 0)  # Every 4th is TNL
        }
        
        profiles.append(profile)
    
    return profiles

@app.route('/api/linkedin/search', methods=['POST', 'OPTIONS'])
def linkedin_search_api():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()
        search_query = data.get('search_query', '')
        location = data.get('location', '')
        company_size = data.get('company_size', '')
        max_results = data.get('max_results', 20)
        buyer_persona = data.get('buyer_persona', '')
        user_persona = data.get('user_persona', '')
        industry = data.get('industry', '')

        # Use the real LinkedIn search function
        profiles = linkedin_search(
            search_query=search_query,
            max_results=max_results,
            selected_state=location,
            company_size=company_size
        )

        # Filter profiles by location if specified
        if location and location != 'All Locations':
            profiles = [p for p in profiles if location.lower() in p.get('location', '').lower()]

        # Ensure all required fields are present
        for profile in profiles:
            profile.update({
                'id': profile.get('profile_url', ''),
                'name': profile.get('name', 'Unknown'),
                'headline': profile.get('headline', ''),
                'title': profile.get('title', ''),
                'company': profile.get('company', ''),
                'location': profile.get('location', ''),
                'profile_url': profile.get('profile_url', ''),
                'profile_image': profile.get('profile_image', ''),
                'connection_level': profile.get('connection_level', '2nd'),
                'mutual_connections': profile.get('mutual_connections', []),
                'tnl_connection': profile.get('tnl_connection', False),
                'industry': profile.get('industry', industry),
                'company_size': profile.get('company_size', company_size)
            })

        # Limit results to max_results
        profiles = profiles[:max_results]

        print(f"Sending {len(profiles)} profiles in response")
        return jsonify({
            'status': 'success',
            'profiles': profiles
        })

    except Exception as e:
        print(f"Error in LinkedIn search: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/linkedin/generate_message', methods=['POST'])
def generate_message_api():
    """API endpoint to generate personalized outreach messages."""
    try:
        data = request.get_json()
        profile = data.get('profile')
        product_description = data.get('product_description', '')
        
        if not profile:
            return jsonify({
                'status': 'error',
                'message': 'Profile data is required'
            }), 400
            
        # Generate personalized message
        message_data = generate_outreach_message(profile, product_description)
        
        return jsonify({
            'status': 'success',
            'message': message_data['message'],
            'type': message_data['type'],
            'recipient': message_data['recipient']
        })
        
    except Exception as e:
        print(f"Error generating message: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/messages/track', methods=['POST'])
def track_new_message():
    data = request.get_json()
    profile_id = data.get('profile_id')
    message_content = data.get('message')
    profile_data = data.get('profile_data')
    
    if not all([profile_id, message_content, profile_data]):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    
    message = message_tracker.track_message(profile_id, message_content, profile_data)
    return jsonify({'status': 'success', 'message': message})

@app.route('/api/messages/status/<message_id>', methods=['PUT'])
def update_message_status():
    data = request.get_json()
    new_status = data.get('status')
    response_content = data.get('response')
    notes = data.get('notes')
    
    if not new_status or new_status not in vars(MessageStatus).values():
        return jsonify({'status': 'error', 'message': 'Invalid status'}), 400
    
    message = message_tracker.update_message_status(message_id, new_status, response_content, notes)
    if not message:
        return jsonify({'status': 'error', 'message': 'Message not found'}), 404
    
    return jsonify({'status': 'success', 'message': message})

@app.route('/api/messages/stats', methods=['GET'])
def get_message_stats():
    days = request.args.get('days', type=int, default=30)
    stats = message_tracker.get_message_stats()
    response_rates = message_tracker.get_response_rate(days=days)
    
    return jsonify({
        'status': 'success',
        'stats': stats,
        'response_rates': response_rates
    })

@app.route('/api/messages', methods=['GET'])
def get_messages():
    status = request.args.get('status')
    days = request.args.get('days', type=int)
    
    messages = message_tracker.get_messages(status=status, days=days)
    return jsonify({
        'status': 'success',
        'messages': messages
    })

@app.route('/api/messages/<message_id>', methods=['GET'])
def get_message(message_id):
    message = message_tracker.get_message(message_id)
    if not message:
        return jsonify({'status': 'error', 'message': 'Message not found'}), 404
    
    return jsonify({
        'status': 'success',
        'message': message
    })

@app.route('/api/messages/<message_id>/notes', methods=['POST'])
def add_message_note(message_id):
    data = request.get_json()
    note = data.get('note')
    
    if not note:
        return jsonify({'status': 'error', 'message': 'Note content required'}), 400
    
    message = message_tracker.add_note(message_id, note)
    if not message:
        return jsonify({'status': 'error', 'message': 'Message not found'}), 404
    
    return jsonify({
        'status': 'success',
        'message': message
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
