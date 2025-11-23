import time
import random
import os
from src.reddit_client import RedditClient, MockRedditClient
from src.ai_generator import AIGenerator
from src.database import SessionLocal, Post, Comment
from datetime import datetime

class AutoRunner:
    def __init__(self):
        try:
            self.reddit = RedditClient(read_only=False) # Needs write access
            print("✅ AutoRunner: Authenticated with Write Access")
        except Exception:
            print("⚠️ AutoRunner: Auth failed, falling back to Read-Only Mode.")
            self.reddit = RedditClient(read_only=True)

        self.ai = AIGenerator()
        self.target_subreddits = os.getenv("TARGET_SUBREDDITS", "AskReddit").split(",")
        
        # Configurable delays (in seconds)
        self.min_delay = int(os.getenv("MODE_DELAY_MIN", 5)) * 60
        self.max_delay = int(os.getenv("MODE_DELAY_MAX", 30)) * 60

    def run_cycle(self):
        """
        One cycle of the automation loop.
        """
        print(f"[{datetime.now()}] Starting auto cycle...")
        
        # 1. Fetch Rising Posts
        try:
            posts = self.reddit.get_rising_posts(self.target_subreddits, limit=3)
        except Exception as e:
            print(f"⚠️ API Error ({e}), switching to Mock Client for this run.")
            self.reddit = MockRedditClient()
            posts = self.reddit.get_rising_posts(self.target_subreddits, limit=3)
        
        db = SessionLocal()
        
        try:
            for p_data in posts:
                # Check if already processed
                exists = db.query(Post).filter(Post.id == p_data['id']).first()
                if exists:
                    print(f"Skipping {p_data['id']} (already processed)")
                    continue
                
                # 2. Save Post to DB
                new_post = Post(
                    id=p_data['id'],
                    title=p_data['title'],
                    subreddit=p_data['subreddit'],
                    content=p_data['content'],
                    url=p_data['url']
                )
                db.add(new_post)
                db.commit()
                
                # 3. Generate Comment
                print(f"Generating comment for: {p_data['title']}")
                comment_text = self.ai.generate_comment(
                    p_data['title'], 
                    p_data['content'], 
                    p_data['subreddit']
                )
                
                # 4. Random Delay
                delay = random.randint(self.min_delay, self.max_delay)
                print(f"Waiting {delay/60:.1f} minutes before posting...")
                time.sleep(delay)
                
                # 5. Post Comment
                comment_id = self.reddit.post_comment(p_data['id'], comment_text)
                
                # 6. Log to DB
                comment_entry = Comment(
                    post_id=p_data['id'],
                    content=comment_text,
                    status='posted' if comment_id else 'failed',
                    reddit_comment_id=comment_id,
                    posted_at=datetime.utcnow() if comment_id else None
                )
                db.add(comment_entry)
                db.commit()
                
                if comment_id:
                    print(f"✅ Posted comment {comment_id}")
                else:
                    print("❌ Failed to post comment")

                # Sleep a bit between posts to avoid rapid firing if we found multiple new ones
                time.sleep(60) 

        finally:
            db.close()

    def start_loop(self):
        print("🚀 Starting AutoRunner in continuous loop...")
        while True:
            try:
                self.run_cycle()
                # Wait before next scan cycle
                print("Sleeping 15 minutes before next scan...")
                time.sleep(900) 
            except KeyboardInterrupt:
                print("Stopping AutoRunner...")
                break
            except Exception as e:
                print(f"Error in auto loop: {e}")
                time.sleep(300)

