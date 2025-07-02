# ai_processor.py
import json
import os
import httpx
from openai import OpenAI
from random import randint, sample, choice
from flask import current_app


def configure_openai():
    """Initialize OpenAI client"""
    # Try multiple ways to get the API key
    api_key = None
    
    # 1. Try getting from app config
    try:
        api_key = current_app.config.get('OPENAI_API_KEY')
    except:
        pass
    
    # 2. If not found, try getting from environment directly
    if not api_key or api_key == 'your-openai-api-key-here':
        api_key = os.environ.get('OPENAI_API_KEY')
    
    # 3. If still not found, check for a .env file in the current directory
    if not api_key:
        try:
            from dotenv import load_dotenv
            # Try loading from .env file in current directory
            load_dotenv()
            api_key = os.environ.get('OPENAI_API_KEY')
        except:
            pass
    
    # Print debug info
    if not api_key or api_key == 'your-openai-api-key-here':
        print("WARNING: No valid OpenAI API key found! Using fallback methods.")
        
    # Create a custom HTTP client without proxies
    http_client = httpx.Client()
    
    # Create the OpenAI client with the custom HTTP client
    return OpenAI(
        api_key=api_key,
        http_client=http_client
    )

def generate_icp_and_personas(product_description):
    """Generate Ideal Customer Profile and Buyer/User Personas using AI"""
    # Use the configure_openai function to create the client
    client = configure_openai()
    
    prompt = f"""
    Based on this product description, generate an Ideal Customer Profile (ICP) and Buyer/User Personas:
    
    PRODUCT DESCRIPTION:
    {product_description}
    
    Please format your response as a JSON with the following structure:
    {{
        "icp": {{
            "industry": "Industry name",
            "company_size": "Company size range",
            "geography": "Geographic focus",
            "other_criteria": ["Criterion 1", "Criterion 2"]
        }},
        "buyer_persona": {{
            "title": "Typical title",
            "role": "Role in organization",
            "pain_points": ["Pain point 1", "Pain point 2"],
            "search_terms": "Search terms to find this persona on LinkedIn"
        }},
        "user_persona": {{
            "title": "Typical title",
            "role": "Role in organization",
            "pain_points": ["Pain point 1", "Pain point 2"],
            "search_terms": "Search terms to find this persona on LinkedIn"
        }}
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model=current_app.config['GPT_MODEL'],
            messages=[{"role": "user", "content": prompt}],
            temperature=current_app.config['TEMPERATURE']
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Extract JSON from the response
        try:
            import re
            json_match = re.search(r'{.*}', result_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            return json.loads(result_text)
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            return {
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
    except Exception as e:
        print(f"Error generating ICP: {e}")
        return None

def find_mutual_connections(profile_list, trusted_network):
    """Find mutual connections between profiles and trusted network"""
    # This would require advanced LinkedIn scraping or use of the LinkedIn API
    # For simplification, we'll simulate finding mutual connections
    
    # Create a dictionary mapping connection levels to numbers (for sorting later)
    connection_level_map = {
        "1st": 1,
        "2nd": 2,
        "3rd+": 3
    }
    
    # Process each profile
    for profile in profile_list:
        # Get the connection level from the profile
        raw_connection = profile.get("connection_level", "3rd+")
        
        # Normalize the connection level text
        connection_level = "1st" if "1st" in raw_connection else "2nd" if "2nd" in raw_connection else "3rd+"
        profile["connection_level"] = connection_level
        
        # Set numeric connection level for sorting
        profile["connection_level_numeric"] = connection_level_map.get(connection_level, 3)
        
        # For 1st connections, no mutual connections needed
        if connection_level == "1st":
            profile["mutual_connections"] = []
            profile["tnl_connection"] = False
            continue
            
        # For 2nd connections, find or simulate mutual connections
        if connection_level == "2nd" and trusted_network:
            # In a real implementation, this would involve scraping LinkedIn
            # Only show trusted network connections (no random connections)
            if trusted_network:
                mutual_contacts = []
                
                # Determine how many TNL connections to show (1-3)
                num_tnl = randint(1, min(3, len(trusted_network)))
                
                # Select random TNL contacts without duplication
                selected_indices = set()
                for _ in range(num_tnl):
                    if len(selected_indices) >= len(trusted_network):
                        break
                    
                    # Find a new random index not already selected
                    while True:
                        idx = randint(0, len(trusted_network) - 1)
                        if idx not in selected_indices:
                            selected_indices.add(idx)
                            break
                    
                    mutual = trusted_network[idx]
                    mutual_contacts.append({
                        "name": mutual["name"],
                        "in_tnl": True,
                        "tnl_score": mutual.get("trust_score", 5)
                    })
                
                profile["mutual_connections"] = mutual_contacts
                profile["tnl_connection"] = len(mutual_contacts) > 0
            else:
                profile["mutual_connections"] = []
                profile["tnl_connection"] = False
        else:
            profile["mutual_connections"] = []
            profile["tnl_connection"] = False
    
    # Sort by: 1) TNL connection, 2) Connection level, 3) Number of mutual connections
    return sorted(
        profile_list,
        key=lambda p: (
            not p.get("tnl_connection", False),
            p.get("connection_level_numeric", 3),
            -len(p.get("mutual_connections", []))
        )
    )

def generate_outreach_message(profile, product_description=None, connection_path=None):
    """Generate a hyper-personalized outreach message based on the profile"""
    # Extract name
    full_name = profile.get('name', '')
    first_name = full_name.split(' ')[0] if full_name else "there"
    
    # Extract meaningful information from headline
    headline = profile.get('headline', '')
    
    # Remove connection degree text if present
    headline = headline.replace("1st degree connection", "").replace("2nd degree connection", "").replace("3rd+ degree connection", "").strip()
    
    # Try to extract company and role
    if " at " in headline:
        role_company = headline.split(" at ")
        role = role_company[0].strip()
        company = role_company[1].strip()
    else:
        role = headline
        company = profile.get('company', '').strip() or ""  # Try to get company from profile if not in headline
    
    # Build the connection path text
    connection_text = ""
    if connection_path:
        if connection_path.get("in_tnl", False):
            connection_text = f"I noticed we're both connected with {connection_path['name']}, who I work closely with."
        else:
            connection_text = f"I noticed we're both connected with {connection_path['name']}."
    
    # Determine message type
    if profile.get("connection_level") == "1st":
        message_type = "direct_existing"
    elif profile.get("tnl_connection", False) and profile.get("mutual_connections"):
        message_type = "intro_request"
    else:
        message_type = "cold_outreach"
    
    # Try to use OpenAI for message generation
    try:
        # Use the configure_openai function to create the client
        client = configure_openai()
        
        # Create base prompt with profile research instructions
        base_prompt = f"""
        Create a hyper-personalized LinkedIn message for {full_name}, who works as {role} {f"at {company}" if company else ""}.
        
        PROFILE CONTEXT:
        - Role: {role}
        - Company: {company if company else "Not specified"}
        - Industry: {profile.get('industry', 'Not specified')}
        - Seniority: SVP Level
        - Focus Area: Marketing, Category & Communications
        - Connection Level: {profile.get('connection_level', 'Not specified')}
        
        PERSONALIZATION FOCUS:
        1. Their specific role in marketing and communications leadership
        2. Their responsibility for category and brand strategy
        3. Their experience with multi-channel marketing
        4. Their position as an SVP-level decision maker
        5. Their specific company's marketing initiatives
        
        PERSONALIZATION REQUIREMENTS:
        1. Reference a specific aspect of their marketing leadership role
        2. Mention their specific achievements or initiatives at {company}
        3. Connect our video AI tool to their specific marketing category/communications needs
        4. Show understanding of their unique marketing challenges at their company
        5. Acknowledge their strategic decision-making position
        6. Keep it concise and impactful
        7. Include ONE specific benefit that addresses their unique needs
        8. End with a clear but non-pushy call to action
        
        MESSAGE STRUCTURE:
        1. Opening: Reference specific aspect of their work
        2. Bridge: Connect to their unique challenges
        3. Value: ONE targeted benefit for their role
        4. Close: Simple next step
        
        TONE REQUIREMENTS:
        - Executive-level communication
        - Strategic rather than tactical
        - Show understanding of their specific market
        - Focus on their unique needs, not generic industry challenges
        - Be concise and respectful of their time
        """
        
        # Add message type specific instructions
        if message_type == "direct_existing":
            prompt = base_prompt + """
            ADDITIONAL REQUIREMENTS:
            1. Reference their specific marketing initiatives
            2. Acknowledge their leadership in category management
            3. Focus on strategic marketing innovation
            4. Keep it under 2000 characters
            5. Emphasize their potential impact on product direction
            """
        elif message_type == "intro_request":
            connection_name = profile["mutual_connections"][0]["name"] if profile["mutual_connections"] else "our mutual connection"
            prompt = base_prompt + f"""
            ADDITIONAL REQUIREMENTS:
            1. Write to {connection_name} highlighting {full_name}'s specific achievements
            2. Reference their unique position to influence marketing innovation
            3. Focus on mutual value in marketing technology
            4. Keep it under 2000 characters
            5. Highlight specific benefits of their expertise
            """
        else:
            prompt = base_prompt + """
            ADDITIONAL REQUIREMENTS:
            1. Reference their specific marketing leadership achievements
            2. Focus on their unique challenges
            3. Keep it under 280 characters
            4. Create interest based on their specific needs
            """
        
        response = client.chat.completions.create(
            model=current_app.config.get('GPT_MODEL', 'gpt-4'),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800
        )
        
        message = response.choices[0].message.content.strip()
        
        # Clean up formatting
        if message.startswith('"') and message.endswith('"'):
            message = message[1:-1]
            
        # Ensure message fits LinkedIn character limit for connection requests
        if message_type == "cold_outreach" and len(message) > 300:
            message = message[:297] + "..."
            
    except Exception as e:
        print(f"Error generating message: {e}")
        # Fallback message generation without API
        message = create_fallback_message(first_name, role, company, profile, message_type, connection_path)
    
    return {
        "message": message,
        "type": message_type,
        "recipient": full_name if message_type != "intro_request" else profile["mutual_connections"][0]["name"] if profile.get("mutual_connections") else "Mutual Connection"
    }

def create_fallback_message(first_name, role, company, profile, message_type, connection_path=None):
    """Generate fallback message templates when API is unavailable"""
    if message_type == "direct_existing":
        # Direct message template
        templates = [
            f"Hi {first_name}, your leadership in category management and marketing communications at {company if company else 'your organization'} is impressive. Our AI video platform could enhance your multi-channel marketing strategy. Would you be interested in shaping how it serves enterprise marketing needs?",
            f"Hi {first_name}, your strategic approach to marketing and communications at {company if company else 'your organization'} caught my attention. We're developing an AI video tool specifically for enterprise marketing teams. As an SVP, would you like to influence its category management features?",
            f"Hi {first_name}, your experience leading marketing and category strategy at {company if company else 'your organization'} stands out. Our AI video platform aims to transform enterprise marketing workflows. Would you be interested in early access to shape its strategic capabilities?"
        ]
        return templates[hash(first_name) % len(templates)]
        
    elif message_type == "intro_request":
        # Intro request template
        connection_name = profile["mutual_connections"][0]["name"].split()[0] if profile.get("mutual_connections") else "Hi"
        templates = [
            f"Hi {connection_name}, {profile.get('name', 'your connection')}'s expertise in enterprise marketing and category management at {company if company else 'their organization'} would be invaluable for our AI video platform. Would you consider an introduction? Their strategic insights would help shape our enterprise features.",
            f"Hi {connection_name}, given {profile.get('name', 'your connection')}'s role leading marketing communications at {company if company else 'their organization'}, their perspective would be crucial for our AI video platform. Could you connect us? We'd value their enterprise marketing insights.",
            f"Hi {connection_name}, {profile.get('name', 'your connection')}'s achievements in category strategy and marketing at {company if company else 'their organization'} align perfectly with our AI video platform's focus. Would you be open to connecting us? Their enterprise experience would be invaluable."
        ]
        return templates[hash(connection_name) % len(templates)]
        
    else:
        # Cold outreach template
        connection_text = ""
        if connection_path:
            mutual_name = connection_path.get("name", "our mutual connection")
            connection_text = f"I noticed we're both connected with {mutual_name}. "
            
        templates = [
            f"Hi {first_name}, {connection_text}Your strategic leadership in marketing and category management at {company if company else 'your organization'} is impressive. Would you like to shape our AI video platform's enterprise features?",
            f"Hi {first_name}, {connection_text}Your expertise in enterprise marketing communications caught my attention. Would you be interested in influencing our AI video platform's strategic capabilities?",
            f"Hi {first_name}, {connection_text}Given your achievements in category strategy and marketing leadership, I'd value your input on our AI video platform's enterprise features."
        ]
        message = templates[hash(first_name) % len(templates)]
        
        # Ensure we stay within LinkedIn's 300 character limit
        if len(message) > 300:
            message = message[:297] + "..."
            
        return message