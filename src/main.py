import typer
import os
import time
from src.reddit_client import RedditClient
from src.ai_generator import AIGenerator
from src.telegram_handler import TelegramBotHandler
from src.auto_runner import AutoRunner
from src.seeder import seed_successful_patterns
from src.database import init_db
from dotenv import load_dotenv

load_dotenv()

app = typer.Typer()

@app.command()
def seed():
    """
    Seeds the database with successful patterns from Reddit.
    """
    seed_successful_patterns()

@app.command()
def manual():
    """
    Starts the bot in Manual Mode (Human-in-the-Loop via Telegram).
    """
    print("🚀 Starting Reddit Karma Assistant (Manual Mode)")
    init_db()
    
    # Try to initialize with write access, fall back to read-only if creds missing
    try:
        reddit = RedditClient(read_only=False)
        print("✅ Authenticated with Posting Access")
    except Exception as e:
        print("⚠️  Auth failed (missing password?), falling back to Read-Only Mode.")
        print("   You will be able to generate comments but NOT post them.")
        reddit = RedditClient(read_only=True)

    ai = AIGenerator()
    bot = TelegramBotHandler()
    
    target_subreddits = os.getenv("TARGET_SUBREDDITS", "AskReddit").split(",")

    while True:
        try:
            print("🔎 Scanning for rising posts...")
            posts = reddit.get_rising_posts(target_subreddits, limit=5)
            
            if not posts:
                print("No new posts found. Sleeping...")
                time.sleep(300)
                continue

            for p in posts:
                print(f"Processing: {p['title']}")
                
                # Generate
                proposed_comment = ai.generate_comment(p['title'], p['content'], p['subreddit'])
                
                # Request Approval
                print("Sending to Telegram...")
                bot.request_approval_sync(
                    post_title=p['title'],
                    post_url=f"https://reddit.com{p.get('permalink', '')}",
                    proposed_comment=proposed_comment,
                    post_id=p['id']
                )
                
                # Wait for Reply
                response = bot.wait_for_approval_sync(p['id'])
                
                if response['action'] == 'approve':
                    print("✅ Approved! Posting...")
                    reddit.post_comment(p['id'], proposed_comment)
                elif response['action'] == 'edit':
                    print(f"✏️ Edited! Posting: {response['content']}")
                    reddit.post_comment(p['id'], response['content'])
                elif response['action'] == 'reject':
                    print("❌ Rejected. Skipping.")
                else:
                    print("⚠️ Timeout. Skipping.")
                
                time.sleep(5) # Short pause
            
            print("Cycle complete. Sleeping 5 minutes...")
            time.sleep(300)

        except KeyboardInterrupt:
            print("Bye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(60)

@app.command()
def auto():
    """
    Starts the bot in Fully Automatic Mode.
    """
    init_db()
    runner = AutoRunner()
    runner.start_loop()

if __name__ == "__main__":
    app()

