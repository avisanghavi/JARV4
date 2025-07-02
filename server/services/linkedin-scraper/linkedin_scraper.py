# linkedin_scraper.py - Improved version that navigates multiple pages of results

import time
import json
import os
import re
import urllib.parse
import random
from playwright.sync_api import sync_playwright
from flask import current_app

def save_cookies(context, filename="cookies.json"):
    """Save browser cookies for future sessions."""
    cookies = context.cookies()
    filepath = os.path.join(current_app.config['DATA_DIR'], filename)
    with open(filepath, "w") as f:
        json.dump(cookies, f)
    print("Cookies saved to", filepath)

def load_cookies(context, filename="cookies.json"):
    """Load cookies from previous session if available."""
    filepath = os.path.join(current_app.config['DATA_DIR'], filename)
    try:
        with open(filepath, "r") as f:
            cookies = json.load(f)
            context.add_cookies(cookies)
        print("Cookies loaded from", filepath)
        return True
    except Exception as e:
        print(f"Error loading cookies: {e}")
        return False

def perform_login(page, email, password):
    """Explicitly login to LinkedIn Sales Navigator."""
    try:
        # Go directly to Sales Navigator login
        page.goto("https://www.linkedin.com/sales/login", timeout=30000)
        
        # Wait for page to be fully loaded
        page.wait_for_load_state('networkidle', timeout=30000)
        
        # Wait for and get the authentication iframe
        page.wait_for_selector('iframe.authentication-iframe.vertical-align-middle', timeout=15000)
        frame = page.frame_locator('iframe.authentication-iframe.vertical-align-middle')
        
        if not frame:
            raise Exception("Could not find authentication iframe")
        
        # Wait for username field with combined selector
        username_field = frame.locator('input#username[name="session_key"]')
        username_field.wait_for(state='visible', timeout=15000)
        
        # Wait for password field
        password_field = frame.locator('input#password[name="session_password"]')
        password_field.wait_for(state='visible', timeout=15000)
        
        # Fill in credentials with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Clear fields first
                username_field.clear()
                password_field.clear()
                
                # Fill username
                username_field.fill(email)
                page.wait_for_timeout(1000)
                
                # Verify username was entered
                entered_username = username_field.input_value()
                if not entered_username:
                    print(f"Username not entered properly, retrying... (attempt {attempt + 1})")
                    continue
                
                # Fill password
                password_field.fill(password)
                page.wait_for_timeout(1000)
                
                # Verify password was entered
                entered_password = password_field.input_value()
                if not entered_password:
                    print(f"Password not entered properly, retrying... (attempt {attempt + 1})")
                    continue
                
                break
            except Exception as e:
                print(f"Error filling credentials (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    raise
                page.wait_for_timeout(1000)
        
        # Find and click submit button
        submit_button = frame.locator('button[type="submit"]')
        submit_button.wait_for(state='visible', timeout=15000)
        
        # Click submit and wait for navigation
        try:
            with page.expect_navigation(timeout=30000):
                submit_button.click()
                print("Clicked submit button")
        except Exception as e:
            print(f"Navigation error after submit: {e}")
        
        # Wait for page to stabilize after login
        page.wait_for_load_state('networkidle', timeout=30000)
        
        # Take screenshot for debugging
        screenshots_dir = os.path.join(current_app.config['DATA_DIR'], 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)
        page.screenshot(path=os.path.join(screenshots_dir, 'post_login.png'))
        
        # Check if still on login/checkpoint page
        current_url = page.url.lower()
        if any(x in current_url for x in ['checkpoint', 'login', 'signup']):
            print("Still on login/checkpoint page - possible credentials/CAPTCHA issue.")
            try:
                error_selectors = [
                    '.error-message',
                    '#error-for-username',
                    '#error-for-password',
                    '[data-test-id="login-error"]'
                ]
                for selector in error_selectors:
                    error = frame.locator(selector)
                    if error.is_visible(timeout=1000):
                        err_msg = error.inner_text()
                        print(f"Login error: {err_msg}")
                        break
            except Exception as e:
                print(f"Error checking for error messages: {e}")
            return False
        
        print("Login successful")
        return True
    
    except Exception as e:
        print(f"Login error: {e}")
        # Take error screenshot
        try:
            screenshots_dir = os.path.join(current_app.config['DATA_DIR'], 'screenshots')
            os.makedirs(screenshots_dir, exist_ok=True)
            page.screenshot(path=os.path.join(screenshots_dir, 'login_error.png'))
        except:
            pass
        return False

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
        # In a real implementation, these would be URLs to actual LinkedIn profile photos
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

def scroll_and_load_more(page, max_scrolls=3, wait_sec=2):
    """
    Scroll down multiple times to trigger auto-loading of additional results.
    Adjust max_scrolls and wait_sec as needed.
    """
    for i in range(max_scrolls):
        # Evaluate JS to scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(wait_sec)
        print(f"Scroll #{i+1} done, waited {wait_sec} sec")

def extract_sales_nav_profiles(page, max_results=50):
    """Extract profiles after scrolling to load more leads."""
    # Attempt to load more leads
    scroll_and_load_more(page, max_scrolls=5, wait_sec=2)
    
    # Save page content for debugging
    page_text = page.inner_text('body')
    html_content = page.content()
    
    data_dir = current_app.config['DATA_DIR']
    with open(os.path.join(data_dir, "sales_nav_debug.txt"), "w", encoding="utf-8") as f:
        f.write(page_text)
    
    profiles = []
    
    # Try multiple card selectors
    card_selectors = [
        'div[data-x-search-result="LEAD"]',
        'ol.search-results__result-list > li',
        'li.search-results__result-item',
        'div.search-results__result-container',
        'div.ember-view.artdeco-list__item'  # More generic selector
    ]
    
    cards = []
    used_selector = None
    
    for selector in card_selectors:
        temp_cards = page.query_selector_all(selector)
        if len(temp_cards) > 0:
            cards = temp_cards
            used_selector = selector
            break
    
    # Take a screenshot of the results
    screenshots_dir = os.path.join(current_app.config['DATA_DIR'], 'screenshots')
    page.screenshot(path=os.path.join(screenshots_dir, "sales_nav_results.png"))
    
    print(f"Found {len(cards)} potential lead cards after scrolling using selector: {used_selector}")
    
    # If no cards found, try a direct string search in the HTML
    if not cards:
        # Extract profile data using regex
        # Most commonly used HTML patterns in Sales Navigator
        name_pattern = r'<a [^>]*data-anonymize="person-name"[^>]*>([^<]+)<\/a>'
        headline_pattern = r'<span [^>]*data-anonymize="title"[^>]*>([^<]+)<\/span>'
        location_pattern = r'<span [^>]*data-anonymize="location"[^>]*>([^<]+)<\/span>'
        # New: Try to extract image URLs using regex
        image_pattern = r'<img [^>]*src="([^"]+)"[^>]*data-anonymize="person-photo"[^>]*>'
        
        names = re.findall(name_pattern, html_content)
        headlines = re.findall(headline_pattern, html_content)
        locations = re.findall(location_pattern, html_content)
        images = re.findall(image_pattern, html_content)
        
        print(f"Regex found {len(names)} names, {len(headlines)} headlines, {len(locations)} locations, and {len(images)} images")
        
        # Create profiles from matched data
        count = min(len(names), max_results)
        for i in range(count):
            # Generate random profile image if none found
            profile_image = ""
            if i < len(images) and images[i]:
                profile_image = images[i]
            else:
                # Use placeholder image as fallback
                gender = "women" if i % 2 else "men"
                profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
            
            profile = {
                "name": names[i] if i < len(names) else f"Profile #{i+1}",
                "headline": headlines[i] if i < len(headlines) else "Sales Professional",
                "location": locations[i] if i < len(locations) else "United States",
                "connection_level": "2nd",  # Default to 2nd connection
                "profile_url": "https://www.linkedin.com/sales/",
                "profile_image": profile_image,  # Add profile image
                "mutual_connections": [],
                "tnl_connection": False
            }
            
            profiles.append(profile)
            print(f"Created profile from regex: {profile['name']}")
    else:
        # Process cards found using selectors
        for i, card in enumerate(cards[:max_results]):
            try:
                # Try different selectors for name
                name_elem = None
                name_selectors = [
                    'a[data-anonymize="person-name"]',
                    '.artdeco-entity-lockup__title a',
                    '.artdeco-entity-lockup__title span',
                    'a[data-control-name="view_lead_panel_via_search_lead_name"]',
                    'span[data-anonymize="person-name"]'
                ]
                
                for selector in name_selectors:
                    name_elem = card.query_selector(selector)
                    if name_elem:
                        break
                
                name = name_elem.inner_text().strip() if name_elem else f"Profile #{i+1}"
                
                # Try different selectors for headline/title
                title_elem = None
                title_selectors = [
                    'span[data-anonymize="title"]',
                    '.artdeco-entity-lockup__subtitle',
                    '.artdeco-entity-lockup__content .artdeco-entity-lockup__subtitle',
                    '.search-result__info-container .result-lockup__highlight-keyword'
                ]
                
                for selector in title_selectors:
                    title_elem = card.query_selector(selector)
                    if title_elem:
                        break
                
                headline = title_elem.inner_text().strip() if title_elem else "Sales Professional"
                
                # Try different selectors for location
                location_elem = None
                location_selectors = [
                    'span[data-anonymize="location"]',
                    '.artdeco-entity-lockup__caption',
                    '.artdeco-entity-lockup__content .artdeco-entity-lockup__caption',
                    '.search-result__info-container .result-lockup__position-location'
                ]
                
                for selector in location_selectors:
                    location_elem = card.query_selector(selector)
                    if location_elem:
                        break
                
                location = location_elem.inner_text().strip() if location_elem else "United States"
                
                # Extract connection level
                connection_level = "2nd"  # Default to 2nd connection
                
                connection_elem = None
                connection_selectors = [
                    '.artdeco-entity-lockup__degree',
                    '.artdeco-entity-lockup__badge',
                    '.search-result__social-proof-status',
                    '.search-result__connection-level',
                    '.result-lockup__badge-text'
                ]
                
                for selector in connection_selectors:
                    connection_elem = card.query_selector(selector)
                    if connection_elem:
                        break
                
                if connection_elem:
                    connection_text = connection_elem.inner_text()
                    if "1st" in connection_text:
                        connection_level = "1st"
                    elif "2nd" in connection_text:
                        connection_level = "2nd"
                    elif "3rd" in connection_text or "3rd+" in connection_text:
                        connection_level = "3rd+"
                
                # Extract profile URL
                profile_url = "https://www.linkedin.com/sales/"  # Default fallback URL
                try:
                    # Try multiple approaches to get the URL
                    
                    # Approach 1: Direct href extraction
                    for url_selector in [
                        'a[data-anonymize="person-name"]',
                        'a[data-lead-search-result^="profile-link"]',
                        '.artdeco-entity-lockup__title a',
                        'a[data-control-name="view_lead_panel_via_search_lead_name"]'
                    ]:
                        url_elem = card.query_selector(url_selector)
                        if url_elem:
                            href = url_elem.get_attribute('href')
                            if href and ('linkedin.com' in href):
                                profile_url = href
                                print(f"Found URL using selector {url_selector}: {profile_url}")
                                break
                    
                    # Approach 2: If no URL found, try to extract a lead ID and construct a URL
                    if profile_url == "https://www.linkedin.com/sales/":
                        # Look for data attributes that might contain IDs
                        lead_id = None
                        lead_elem = card.query_selector('[data-lead-id]')
                        if lead_elem:
                            lead_id = lead_elem.get_attribute('data-lead-id')
                        
                        if not lead_id:
                            # Try another approach - look in the href for an ID pattern
                            for link in card.query_selector_all('a'):
                                href = link.get_attribute('href')
                                if href and 'lead/' in href:
                                    # Extract ID from URL like /sales/lead/ACwAAAXHNY8BnLN80jtYvUtcELLYYY3YYbHpqrk,NAME_SEARCH
                                    id_match = re.search(r'lead/([^,]+)', href)
                                    if id_match:
                                        lead_id = id_match.group(1)
                                        break
                        
                        # Construct URL if we found an ID
                        if lead_id:
                            profile_url = f"https://www.linkedin.com/sales/lead/{lead_id}"
                            print(f"Constructed URL from lead ID: {profile_url}")
                    
                    # Approach 3: Look for any LinkedIn URL in the card
                    if profile_url == "https://www.linkedin.com/sales/":
                        for link in card.query_selector_all('a'):
                            href = link.get_attribute('href')
                            if href and ('linkedin.com/in/' in href or 'linkedin.com/sales/lead/' in href):
                                profile_url = href
                                print(f"Found LinkedIn profile URL: {profile_url}")
                                break
                    
                    # Sanitize URL - ensure it's properly formatted
                    if '?' in profile_url and not profile_url.startswith('http'):
                        profile_url = f"https://www.linkedin.com{profile_url}"
                    
                    print(f"Final URL for {name}: {profile_url}")

                except Exception as e:
                    print(f"Error extracting URL: {e}")
                
                # Extract profile image URL - NEW CODE
                profile_image = ""
                try:
                    # Try different image selectors
                    img_selectors = [
                        'img.artdeco-entity-lockup__image',
                        '.artdeco-entity-lockup__image img',
                        'img.presence-entity__image',
                        '.search-result__image-wrapper img',
                        '.result-lockup__icon-link img',
                        '.profile-photo-edit__preview',
                        'img[data-anonymize="person-photo"]',
                        '.artdeco-entity-lockup__image img[src]'
                    ]
                    
                    for selector in img_selectors:
                        img_elem = card.query_selector(selector)
                        if img_elem:
                            src = img_elem.get_attribute('src')
                            if src and src.strip() and not src.endswith('ghost_person.png'):
                                profile_image = src
                                print(f"Found profile image: {profile_image}")
                                break
                    
                    # If no image found, use a placeholder
                    if not profile_image:
                        gender = "women" if i % 2 else "men"
                        profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
                        print(f"Using placeholder image: {profile_image}")
                
                except Exception as e:
                    print(f"Error extracting profile image: {e}")
                    # Use a placeholder image if we encounter an error
                    gender = "women" if i % 2 else "men"
                    profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
                
                # Create profile object
                profile = {
                    "name": name,
                    "headline": headline,
                    "location": location,
                    "connection_level": connection_level,
                    "profile_url": profile_url,
                    "profile_image": profile_image,  # Add profile image URL
                    "mutual_connections": [],
                    "tnl_connection": False
                }
                
                profiles.append(profile)
                print(f"Extracted profile: {name} ({connection_level})")
                
            except Exception as e:
                print(f"Error extracting profile {i+1}: {e}")
    
    return profiles

def navigate_to_next_page(page):
    """Navigate to the next page of search results. Returns True if successful."""
    try:
        # Try different next page button selectors
        next_button_selectors = [
            'button.artdeco-pagination__button--next',
            'li.artdeco-pagination__button--next button',
            'button[aria-label="Next"]',
            '.search-results__pagination-next-button',
            '.artdeco-pagination__button--next',
            '.search-results-container .artdeco-pagination__button--next'
        ]
        
        for selector in next_button_selectors:
            next_button = page.query_selector(selector)
            if next_button:
                # Check if button is disabled
                is_disabled = next_button.get_attribute('disabled')
                if is_disabled:
                    print("Next page button is disabled, reached last page")
                    return False
                
                # Click the button
                next_button.click()
                time.sleep(3)  # Wait for page to load
                print("Navigated to next page")
                return True
        
        # If no button found, try to find the URL for the next page
        pagination_links = page.query_selector_all('li.artdeco-pagination__indicator a')
        current_page = None
        for link in pagination_links:
            if link.query_selector('.artdeco-pagination__indicator--number.active, .selected'):
                current_page = int(link.inner_text().strip())
                break
        
        if current_page:
            next_page = current_page + 1
            print(f"Current page: {current_page}, trying to navigate to page {next_page}")
            
            # Look for the next page link
            for link in pagination_links:
                if link.inner_text().strip() == str(next_page):
                    link.click()
                    time.sleep(3)
                    print(f"Navigated to page {next_page} via pagination link")
                    return True
        
        # Last resort - try using the URL and page parameter
        if 'page=' in page.url:
            # Extract current page number
            current_url = page.url
            page_match = re.search(r'page=(\d+)', current_url)
            if page_match:
                current_page = int(page_match.group(1))
                next_page = current_page + 1
                next_url = current_url.replace(f'page={current_page}', f'page={next_page}')
                page.goto(next_url)
                time.sleep(3)
                print(f"Navigated to page {next_page} via URL modification")
                return True
            
        # If the URL doesn't have a page parameter, add it
        elif '?' in page.url:
            next_url = page.url + '&page=2'
            page.goto(next_url)
            time.sleep(3)
            print("Navigated to page 2 via URL addition")
            return True
        else:
            next_url = page.url + '?page=2'
            page.goto(next_url)
            time.sleep(3)
            print("Navigated to page 2 via URL addition")
            return True
        
        print("Could not find next page button or link")
        return False
        
    except Exception as e:
        print(f"Error navigating to next page: {e}")
        return False

def merge_profiles_by_best_connection(profiles):
    """
    If the same name appears multiple times, keep whichever has
    the "highest" connection level: 1st outranks 2nd outranks 3rd+.
    """
    level_map = {"1st": 1, "2nd": 2, "3rd": 3, "3rd+": 3}
    merged = {}
    for p in profiles:
        nm = p["name"]
        if nm not in merged:
            merged[nm] = p
        else:
            old_level = merged[nm]["connection_level"]
            new_level = p["connection_level"]
            old_num = level_map.get(old_level, 3)
            new_num = level_map.get(new_level, 3)
            # 1 < 2 < 3 => keep the "lowest" numeric
            if new_num < old_num:
                merged[nm] = p
    return list(merged.values())

def close_saved_searches_popup(page):
    """Close the 'Saved searches' popup if it appears."""
    try:
        # Look for the popup using various selectors
        popup_selectors = [
            'button[aria-label="Dismiss"]',
            'button.artdeco-modal__dismiss',
            '.artdeco-modal__dismiss',
            'button.saved-searches-modal__dismiss-button',
            # The X button in the top right
            'button.artdeco-modal__close',
            '.saved-searches-modal__header button'
        ]
        
        for selector in popup_selectors:
            try:
                close_button = page.locator(selector).first
                if close_button and close_button.is_visible(timeout=1000):
                    close_button.click()
                    print("Closed 'Saved searches' popup")
                    page.wait_for_timeout(1000)  # Wait for popup to close
                    return True
            except Exception:
                continue
        
        return False
    except Exception as e:
        print(f"Error handling saved searches popup: {e}")
        return False

def calculate_title_similarity(title1, title2):
    """Calculate similarity between two job titles."""
    # Normalize titles
    t1 = title1.lower().replace('-', ' ').replace('_', ' ')
    t2 = title2.lower().replace('-', ' ').replace('_', ' ')
    
    # Common seniority levels and their variations
    seniority_levels = {
        'chief': ['c-level', 'cxo', 'chief'],
        'vp': ['vice president', 'vp', 'vice-president', 'vice pres'],
        'head': ['head', 'head of', 'leader'],
        'director': ['director', 'dir'],
        'president': ['president', 'pres'],
        'lead': ['lead', 'leader', 'leading'],
        'senior': ['senior', 'sr', 'sr.', 'senior'],
        'principal': ['principal', 'prin'],
        'manager': ['manager', 'mgr', 'management'],
        'executive': ['executive', 'exec']
    }
    
    # Extract core role and seniority
    def extract_components(title):
        words = title.split()
        seniority = ''
        role = []
        
        for word in words:
            found_seniority = False
            for level, variations in seniority_levels.items():
                if any(var in word for var in variations):
                    seniority = level
                    found_seniority = True
                    break
            if not found_seniority:
                role.append(word)
        
        return seniority, ' '.join(role)
    
    # Get components
    seniority1, role1 = extract_components(t1)
    seniority2, role2 = extract_components(t2)
    
    # Calculate role similarity
    role_words1 = set(role1.split())
    role_words2 = set(role2.split())
    role_similarity = len(role_words1.intersection(role_words2)) / max(len(role_words1), len(role_words2))
    
    # Calculate seniority similarity
    seniority_similarity = 1.0 if seniority1 == seniority2 else 0.5  # Give partial credit for different seniority levels
    
    # Weight role similarity more heavily than seniority
    final_similarity = (role_similarity * 0.7) + (seniority_similarity * 0.3)
    
    return final_similarity

def filter_profiles_by_title(profiles, search_query, min_similarity=0.2):
    """Filter profiles based on job title similarity."""
    filtered_profiles = []
    search_terms = search_query.split(' OR ')
    
    for profile in profiles:
        title = profile.get('headline', '') or profile.get('title', '')
        max_similarity = 0
        
        # Check similarity against each search term
        for term in search_terms:
            similarity = calculate_title_similarity(term, title)
            max_similarity = max(max_similarity, similarity)
        
        if max_similarity >= min_similarity:
            filtered_profiles.append(profile)
    
    # If we got very few results, try with a lower threshold
    if len(filtered_profiles) < 10:
        return filter_profiles_by_title(profiles, search_query, min_similarity=0.1)
    
    return filtered_profiles

def linkedin_search(search_query, max_results=50, selected_state=None, company_size=None):
    """
    Search LinkedIn for profiles with pagination:
    1) Start with Sales Navigator
    2) Apply geography and company size filters if selected
    3) Navigate through multiple pages (up to 10)
    4) Fall back to regular LinkedIn if needed
    5) Return sample data only as a last resort
    """
    data_dir = current_app.config['DATA_DIR']
    screenshots_dir = os.path.join(data_dir, 'screenshots')
    os.makedirs(screenshots_dir, exist_ok=True)
    
    all_profiles = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            slow_mo=100,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        
        cookie_loaded = load_cookies(context)
        print(f"Cookie loaded: {cookie_loaded}")
        
        try:
            # Go to Sales Nav
            page.goto("https://www.linkedin.com/sales/home", timeout=30000)
            page.screenshot(path=os.path.join(screenshots_dir, "initial_page.png"))
            
            # Check login
            if 'login' in page.url.lower():
                print("Login page detected, attempting to login")
                email = current_app.config['LINKEDIN_EMAIL']
                password = current_app.config['LINKEDIN_PASSWORD']
                
                if perform_login(page, email, password):
                    save_cookies(context)
                    page.goto("https://www.linkedin.com/sales/home", timeout=30000)
                    time.sleep(2)
                else:
                    browser.close()
                    # Fallback sample
                    sample = create_sample_profiles(search_query)
                    return sample
            
            # APPROACH 1: Try Sales Navigator
            # Navigate to People Search
            page.goto("https://www.linkedin.com/sales/search/people", timeout=30000)
            time.sleep(3)
            
            # Find search input
            search_input = None
            for sel in [
                'input[aria-label="Search by keywords"]',
                'input.search-global-typeahead__input',
                'input.global-typeahead__input',
                'input[placeholder*="Search"]'
            ]:
                node = page.query_selector(sel)
                if node:
                    search_input = node
                    break
            
            sales_nav_successful = False
            
            if search_input:
                search_input.click()
                search_input.fill("")
                time.sleep(0.5)
                search_input.fill(search_query)
                search_input.press('Enter')
                
                # Wait for results to load
                try:
                    page.wait_for_selector('div[data-x-search-result="LEAD"]', timeout=30000)
                    time.sleep(3)  # Give page a moment to fully load
                    
                    # Apply filters if selected
                    if selected_state or company_size:
                        # Apply geography filter if selected
                        if selected_state:
                            print(f"Applying geography filter for {selected_state}")
                            
                            # Click geography filter button to expand it
                            geography_button = None
                            for selector in [
                                'button:has-text("Geography")',
                                'button[data-control-name="geographic_facet_toggle"]',
                                'button.artdeco-pill.artdeco-pill--slate.artdeco-pill--choice.artdeco-pill--2.search-filter-trigger'
                            ]:
                                try:
                                    geography_button = page.locator(selector).first
                                    if geography_button and geography_button.is_visible(timeout=1000):
                                        break
                                except Exception:
                                    continue
                            
                            if not geography_button:
                                print("Geography filter button not found, trying by text content")
                                try:
                                    geography_button = page.locator('button', has_text="Geography").first
                                except Exception:
                                    print("Could not find geography filter button")
                                    geography_button = None
                            
                            if geography_button:
                                try:
                                    geography_button.click()
                                    print("Clicked geography filter button")
                                    page.wait_for_timeout(2000)  # Wait for dropdown to appear
                                    
                                    # Take a screenshot after clicking the geography button
                                    page.screenshot(path=os.path.join(screenshots_dir, "geography_dropdown_open.png"))
                                    
                                    # Find and focus the locations input
                                    locations_input = None
                                    for selector in [
                                        'input[placeholder="Add locations"]',
                                        '[role="combobox"][placeholder="Add locations"]',
                                        'input.search-filter-typeahead__input',
                                        '.search-filter-typeahead input'
                                    ]:
                                        try:
                                            locations_input = page.locator(selector).first
                                            if locations_input and locations_input.is_visible(timeout=1000):
                                                break
                                        except Exception:
                                            continue
                                    
                                    if not locations_input:
                                        print("Locations input not found, trying to find any input in the dropdown")
                                        try:
                                            locations_input = page.locator('div.artdeco-typeahead input').first
                                        except Exception:
                                            print("Could not find location input field")
                                            locations_input = None
                                    
                                    if locations_input:
                                        try:
                                            # Click and clear the input field first
                                            locations_input.click()
                                            locations_input.press("Control+a")  # Select all text
                                            locations_input.press("Backspace")  # Delete selected text
                                            page.wait_for_timeout(500)
                                            
                                            print(f"Typing location: {selected_state}")
                                            # Type location with deliberate typing
                                            for char in selected_state:
                                                locations_input.type(char, delay=100)  # 100ms delay between keystrokes
                                            
                                            # Wait for suggestions to appear
                                            page.wait_for_timeout(2000)
                                            
                                            # Take a screenshot to verify typing 
                                            page.screenshot(path=os.path.join(screenshots_dir, "geography_typing_complete.png"))
                                            
                                            # Now try to find and click the appropriate suggestion
                                            dropdown_item = page.locator(f'li[role="option"]:has-text("{selected_state}")').first
                                            if dropdown_item and dropdown_item.is_visible(timeout=1000):
                                                dropdown_item.click()
                                                print(f"Clicked dropdown item for {selected_state}")
                                            else:
                                                # Try alternative selectors for dropdown items
                                                for selector in [
                                                    f'div.search-filter-typeahead__suggestion-list li:has-text("{selected_state}")',
                                                    f'ul[role="listbox"] li:has-text("{selected_state}")',
                                                    f'div.search-filter-typeahead__container li:has-text("{selected_state}")'
                                                ]:
                                                    try:
                                                        dropdown_item = page.locator(selector).first
                                                        if dropdown_item and dropdown_item.is_visible(timeout=1000):
                                                            dropdown_item.click()
                                                            print(f"Clicked dropdown item for {selected_state} with alternative selector")
                                                            break
                                                    except Exception:
                                                        continue
                                            
                                            page.wait_for_timeout(1000)
                                            
                                            # Look for and click "Include" button after selecting the location
                                            include_button = None
                                            for button_text in ["Include", "Apply", "Done"]:
                                                try:
                                                    include_button = page.locator(f'button:has-text("{button_text}")').first
                                                    if include_button and include_button.is_visible(timeout=1000):
                                                        include_button.click()
                                                        print(f"Clicked {button_text} button")
                                                        break
                                                except Exception:
                                                    continue
                                            
                                            # Wait for results to update
                                            page.wait_for_timeout(3000)
                                            
                                            # Check for and close the saved searches popup
                                            close_saved_searches_popup(page)
                                            
                                            # Take screenshot after applying filter
                                            page.screenshot(path=os.path.join(screenshots_dir, "geography_filter_applied.png"))
                                        except Exception as e:
                                            print(f"Error applying geography filter: {e}")
                                            # Try to press Enter to apply the filter as a last resort
                                            try:
                                                locations_input.press("Enter")
                                                print("Pressed Enter to apply geography filter")
                                                page.wait_for_timeout(2000)
                                                # Check for and close the saved searches popup
                                                close_saved_searches_popup(page)
                                            except Exception:
                                                print("Failed to press Enter")
                                except Exception as e:
                                    print(f"Error with geography button interaction: {e}")
                            else:
                                print("Geography button not found or not visible")
                        
                        # Apply company size filter if selected
                        if company_size:
                            print(f"Applying company size filter: {company_size}")
                            try:
                                # Click company size filter button
                                company_size_button = None
                                for selector in [
                                    'button:has-text("Company headcount")',
                                    'button[data-control-name="company_size_facet_toggle"]',
                                    'button.artdeco-pill:has-text("Company headcount")'
                                ]:
                                    try:
                                        company_size_button = page.locator(selector).first
                                        if company_size_button and company_size_button.is_visible(timeout=1000):
                                            break
                                    except Exception:
                                        continue
                                
                                if company_size_button:
                                    company_size_button.click()
                                    print("Clicked company size filter button")
                                    page.wait_for_timeout(2000)
                                    
                                    # Take screenshot of company size dropdown
                                    page.screenshot(path=os.path.join(screenshots_dir, "company_size_dropdown.png"))
                                    
                                    # Map the company size value to the corresponding selector
                                    size_selectors = {
                                        'self-employed': 'text=Self-employed',
                                        '1-10': 'text=1-10',
                                        '11-50': 'text=11-50',
                                        '51-200': 'text=51-200',
                                        '201-500': 'text=201-500',
                                        '501-1000': 'text=501-1000'
                                    }
                                    
                                    # Find and click the appropriate company size option
                                    size_selector = size_selectors.get(company_size)
                                    if size_selector:
                                        size_option = page.locator(size_selector).first
                                        if size_option and size_option.is_visible(timeout=1000):
                                            size_option.click()
                                            print(f"Selected company size: {company_size}")
                                            page.wait_for_timeout(1000)
                                            
                                            # Look for and click Apply/Done button
                                            for button_text in ["Apply", "Done"]:
                                                try:
                                                    apply_button = page.locator(f'button:has-text("{button_text}")').first
                                                    if apply_button and apply_button.is_visible(timeout=1000):
                                                        apply_button.click()
                                                        print(f"Clicked {button_text} button")
                                                        break
                                                except Exception:
                                                    continue
                                            
                                            # Wait for results to update
                                            page.wait_for_timeout(3000)
                                            
                                            # Check for and close the saved searches popup
                                            close_saved_searches_popup(page)
                                            
                                            # Take screenshot after applying filter
                                            page.screenshot(path=os.path.join(screenshots_dir, "company_size_filter_applied.png"))
                                        else:
                                            print(f"Company size option not found: {company_size}")
                                    else:
                                        print(f"Invalid company size value: {company_size}")
                                else:
                                    print("Company size filter button not found")
                            except Exception as e:
                                print(f"Error applying company size filter: {e}")
                                page.screenshot(path=os.path.join(screenshots_dir, "company_size_filter_error.png"))
                    
                    page.screenshot(path=os.path.join(screenshots_dir, "sales_nav_found.png"))
                    sales_nav_successful = True
                except Exception as e:
                    print(f"Sales Navigator search or filter failed: {e}")
                    page.screenshot(path=os.path.join(screenshots_dir, "sales_nav_error.png"))
            
            # Process multiple pages of Sales Navigator results
            if sales_nav_successful:
                max_pages = 10  # Try up to 10 pages
                
                for page_num in range(1, max_pages + 1):
                    print(f"Processing Sales Navigator page {page_num}")
                    page.screenshot(path=os.path.join(screenshots_dir, f"sales_nav_page_{page_num}.png"))
                    
                    # Extract profiles from current page
                    profiles_from_page = extract_sales_nav_profiles(page, max_results=max_results)
                    
                    # If we found profiles, add them to our list
                    if profiles_from_page:
                        print(f"Found {len(profiles_from_page)} profiles on page {page_num}")
                        all_profiles.extend(profiles_from_page)
                        
                        # Check if we have enough profiles
                        if len(all_profiles) >= max_results:
                            print(f"Found {len(all_profiles)} profiles, which is enough (target: {max_results})")
                            break
                    
                    # Try to navigate to the next page
                    if page_num < max_pages:
                        success = navigate_to_next_page(page)
                        if not success:
                            print(f"Could not navigate to page {page_num + 1}, stopping pagination")
                            break
                        time.sleep(3)  # Wait for the next page to load
            
            # APPROACH 2: If Sales Navigator fails or returns no results, try regular LinkedIn
            if not all_profiles:
                print("Sales Navigator approach failed. Trying regular LinkedIn...")
                encoded = urllib.parse.quote(search_query)
                
                # Try multiple pages of regular LinkedIn results
                max_pages = 10
                
                for page_num in range(1, max_pages + 1):
                    regular_url = f"https://www.linkedin.com/search/results/people/?keywords={encoded}&page={page_num}"
                    
                    try:
                        page.goto(regular_url, timeout=30000)
                        time.sleep(5)  # Wait for page to load
                        
                        # Take a screenshot
                        page.screenshot(path=os.path.join(screenshots_dir, f"regular_linkedin_page_{page_num}.png"))
                        
                        # Try to scroll and load more
                        scroll_and_load_more(page, max_scrolls=3, wait_sec=2)
                        
                        # Extract profiles
                        print(f"Extracting profiles from regular LinkedIn page {page_num}...")
                        
                        # Try to find profile cards
                        profile_cards = page.query_selector_all('li.reusable-search__result-container, div.entity-result__item')
                        
                        if not profile_cards:
                            print(f"No profile cards found on page {page_num}, trying next page")
                            continue
                        
                        # Process found cards
                        for i, card in enumerate(profile_cards):
                            try:
                                # Extract name
                                name_elem = card.query_selector('.entity-result__title-text a span[aria-hidden="true"]')
                                name = name_elem.inner_text().strip() if name_elem else f"LinkedIn User {len(all_profiles) + 1}"
                                
                                # Extract headline
                                headline_elem = card.query_selector('.entity-result__primary-subtitle')
                                headline = headline_elem.inner_text().strip() if headline_elem else "Sales Professional"
                                
                                # Extract location
                                location_elem = card.query_selector('.entity-result__secondary-subtitle')
                                location = location_elem.inner_text().strip() if location_elem else "United States"
                                
                                # Extract connection level
                                connection_level = "2nd"  # Default
                                connection_elem = card.query_selector('.entity-result__badge-text span')
                                if connection_elem:
                                    connection_text = connection_elem.inner_text().strip()
                                    if "1st" in connection_text:
                                        connection_level = "1st"
                                    elif "2nd" in connection_text:
                                        connection_level = "2nd"
                                    elif "3rd" in connection_text:
                                        connection_level = "3rd+"
                                
                                # Extract profile URL
                                profile_url = "https://www.linkedin.com/"
                                url_elem = card.query_selector('.entity-result__title-text a')
                                if url_elem:
                                    url = url_elem.get_attribute('href')
                                    if url:
                                        profile_url = url
                                
                                # NEW: Extract profile image
                                profile_image = ""
                                try:
                                    img_selectors = [
                                        '.entity-result__universal-image img',
                                        '.presence-entity img',
                                        '.ivm-image-view-model img', 
                                        '.entity-result__image img',
                                        '.evi-image img'
                                    ]
                                    
                                    for selector in img_selectors:
                                        img_elem = card.query_selector(selector)
                                        if img_elem:
                                            src = img_elem.get_attribute('src')
                                            if src and not src.endswith('ghost_person.png'):
                                                profile_image = src
                                                print(f"Found regular LinkedIn profile image: {profile_image}")
                                                break
                                    
                                    # If no image found, use a placeholder
                                    if not profile_image:
                                        gender = "women" if i % 2 else "men" 
                                        profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
                                except Exception as e:
                                    print(f"Error extracting regular LinkedIn profile image: {e}")
                                    gender = "women" if i % 2 else "men"
                                    profile_image = f"https://randomuser.me/api/portraits/{gender}/{(i % 10) + 20}.jpg"
                                        
                                # Create profile object
                                profile = {
                                    "name": name,
                                    "headline": headline,
                                    "location": location,
                                    "connection_level": connection_level,
                                    "profile_url": profile_url,
                                    "profile_image": profile_image,
                                    "mutual_connections": [],
                                    "tnl_connection": False
                                }
                                
                                all_profiles.append(profile)
                                print(f"Added profile from regular LinkedIn: {name} ({connection_level})")
                                
                                # Check if we have enough profiles
                                if len(all_profiles) >= max_results:
                                    print(f"Found {len(all_profiles)} profiles, which is enough (target: {max_results})")
                                    break
                                
                            except Exception as e:
                                print(f"Error processing card {i+1} on page {page_num}: {e}")
                        
                        # If we have enough profiles, stop paging
                        if len(all_profiles) >= max_results:
                            break
                    
                    except Exception as e:
                        print(f"Error processing regular LinkedIn page {page_num}: {e}")
            
            # After collecting all profiles, filter by title similarity
            all_profiles = filter_profiles_by_title(all_profiles, search_query)
            
            # Limit to max_results
            all_profiles = all_profiles[:max_results]
            
            if not all_profiles:
                print("No profiles found with matching titles, falling back to sample data")
                return create_sample_profiles(search_query)
            
            print(f"Final result: {len(all_profiles)} relevant profiles after title filtering")
            return all_profiles
        
        except Exception as e:
            print(f"Comprehensive search error: {e}")
        finally:
            browser.close()
    
    # Merge duplicates by best connection
    final_profiles = merge_profiles_by_best_connection(all_profiles)
    
    # If no results, use sample data
    if not final_profiles:
        print("No profiles found, returning sample data")
        final_profiles = create_sample_profiles(search_query)
    
    # Save to profiles.json
    outpath = os.path.join(data_dir, "profiles.json")
    with open(outpath, "w") as f:
        json.dump(final_profiles, f)
    
    print(f"Final result: {len(final_profiles)} unique profiles")
    return final_profiles