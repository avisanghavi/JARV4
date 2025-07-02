import os
import time
from datetime import datetime
from linkedin_api_tracker import LinkedInAPITracker
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize tracker
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    tracker = LinkedInAPITracker(data_dir)
    
    # Run tracking every hour
    while True:
        try:
            print(f"\n[{datetime.now()}] Starting LinkedIn message tracking...")
            tracker.run_tracking()
            
            # Get and print stats
            stats = tracker.get_tracking_stats()
            print("\nMessage Statistics:")
            print(f"Acceptance Rate: {stats['acceptance_rate']:.1f}%")
            print(f"Reply Rate: {stats['reply_rate']:.1f}%")
            print(f"Average Response Time: {stats['avg_response_time']:.1f} hours")
            
            # Wait for an hour before next run
            print("\nWaiting for 1 hour before next check...")
            time.sleep(3600)
            
        except Exception as e:
            print(f"Error in tracking process: {e}")
            print("Waiting 5 minutes before retrying...")
            time.sleep(300)

if __name__ == "__main__":
    main() 