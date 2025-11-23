import praw
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime

load_dotenv()

class MockRedditClient:
    """
    A fake client that simulates Reddit for testing purposes when API keys fail.
    """
    def __init__(self, read_only=False):
        print("⚠️ USING MOCK REDDIT CLIENT (No API Calls)")
        
    def get_rising_posts(self, subreddits: List[str], limit: int = 5) -> List[Dict]:
        # Return some fake posts to test the loop
        return [
            {
                "id": f"test_post_{int(datetime.now().timestamp())}",
                "title": "What is the best way to learn Python in 2025?",
                "subreddit": "AskReddit",
                "content": "I want to start coding but don't know where to begin.",
                "url": "https://reddit.com/r/AskReddit/test",
                "created_utc": datetime.now().timestamp(),
                "permalink": "/r/AskReddit/test"
            }
        ]

    def get_top_comments(self, subreddit: str, limit: int = 10) -> List[Dict]:
        return [
            {"pattern_text": "Just build things!", "subreddit": subreddit, "score": 100},
            {"pattern_text": "Read the documentation.", "subreddit": subreddit, "score": 50}
        ]

    def post_comment(self, post_id: str, text: str) -> Optional[str]:
        print(f"📝 MOCK POST to {post_id}: {text}")
        return "mock_comment_id_123"

class RedditReader:
    """
    Handles read-only operations like scanning posts.
    Does not require username/password.
    """
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent=os.getenv("REDDIT_USER_AGENT"),
        )
        self.reddit.read_only = True

    def get_rising_posts(self, subreddits: List[str], limit: int = 5) -> List[Dict]:
        posts = []
        subreddit_str = "+".join(subreddits)
        try:
            for submission in self.reddit.subreddit(subreddit_str).rising(limit=limit):
                posts.append({
                    "id": submission.id,
                    "title": submission.title,
                    "subreddit": submission.subreddit.display_name,
                    "content": submission.selftext,
                    "url": submission.url,
                    "created_utc": submission.created_utc,
                    "permalink": submission.permalink
                })
        except Exception as e:
            # propagate error so we can catch and switch to mock
            raise e 
        return posts

    def get_top_comments(self, subreddit: str, limit: int = 10) -> List[Dict]:
        comments = []
        try:
            for submission in self.reddit.subreddit(subreddit).top(time_filter="month", limit=limit):
                submission.comments.replace_more(limit=0)
                for comment in submission.comments[:3]: 
                    comments.append({
                        "pattern_text": comment.body,
                        "subreddit": subreddit,
                        "score": comment.score
                    })
        except Exception as e:
            print(f"Error fetching top comments: {e}")
        return comments

class RedditWriter:
    """
    Handles write operations like posting comments.
    Requires full authentication.
    """
    def __init__(self):
        try:
            self.reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
                user_agent=os.getenv("REDDIT_USER_AGENT"),
                username=os.getenv("REDDIT_USERNAME"),
                password=os.getenv("REDDIT_PASSWORD"),
            )
            # Verify auth
            self.reddit.user.me()
            self.is_authenticated = True
        except Exception as e:
            print(f"⚠️ RedditWriter failed to authenticate: {e}")
            self.is_authenticated = False

    def post_comment(self, post_id: str, text: str) -> Optional[str]:
        if not self.is_authenticated:
            print(f"MOCK POST (No Auth): {text[:50]}...")
            return "mock_id_123"
            
        try:
            submission = self.reddit.submission(id=post_id)
            comment = submission.reply(text)
            return comment.id
        except Exception as e:
            print(f"Error posting comment: {e}")
            return None

class RedditClient:
    """
    Facade that combines Reader and Writer.
    """
    def __init__(self, read_only: bool = False):
        self.reader = RedditReader()
        self.writer = RedditWriter() if not read_only else None
        self.read_only = read_only

    def get_rising_posts(self, subreddits: List[str], limit: int = 5) -> List[Dict]:
        return self.reader.get_rising_posts(subreddits, limit)

    def get_top_comments(self, subreddit: str, limit: int = 10) -> List[Dict]:
        return self.reader.get_top_comments(subreddit, limit)

    def post_comment(self, post_id: str, text: str) -> Optional[str]:
        if self.read_only or not self.writer:
            print(f"MOCK POST (Read-Only): {text[:50]}...")
            return "mock_id_123"
        
        return self.writer.post_comment(post_id, text)
