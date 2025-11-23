from src.reddit_client import RedditClient
from src.database import SessionLocal, SuccessfulPattern, init_db
import os
from dotenv import load_dotenv

load_dotenv()

def seed_successful_patterns():
    """
    Fetches top comments from target subreddits and stores them in the database.
    """
    print("Initializing database...")
    init_db()
    
    client = RedditClient(read_only=True)
    db = SessionLocal()
    
    target_subreddits = os.getenv("TARGET_SUBREDDITS", "AskReddit,NoStupidQuestions").split(",")
    
    print(f"Seeding patterns from: {target_subreddits}")
    
    total_added = 0
    
    for sub in target_subreddits:
        sub = sub.strip()
        print(f"Fetching from r/{sub}...")
        comments = client.get_top_comments(subreddit=sub, limit=20) # Adjust limit as needed
        
        for c in comments:
            # Check if exists to avoid duplicates (simple check)
            exists = db.query(SuccessfulPattern).filter(
                SuccessfulPattern.pattern_text == c['pattern_text']
            ).first()
            
            if not exists:
                pattern = SuccessfulPattern(
                    pattern_text=c['pattern_text'],
                    subreddit=c['subreddit'],
                    score=c['score']
                )
                db.add(pattern)
                total_added += 1
        
        db.commit()
        print(f"Committed patterns for r/{sub}")

    print(f"Seeding complete. Added {total_added} new patterns.")
    db.close()

if __name__ == "__main__":
    seed_successful_patterns()

