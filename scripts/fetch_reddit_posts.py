#!/usr/bin/env python3
"""
Reddit Data Pipeline - Fetch rising/new posts and store in PostgreSQL.

This script fetches posts from target subreddits and stores them in the database.
The dashboard reads from the database via the data generation script.

Usage:
    python scripts/fetch_reddit_posts.py

Tables:
    - trending_posts: Stores fetched posts for the Comment Assistant
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

import asyncpg
import asyncpraw
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
TARGET_SUBREDDITS = [
    "AskReddit",
    "NoStupidQuestions", 
    "explainlikeimfive",
    "TrueOffMyChest",
    "unpopularopinion",
    "LifeProTips",
    "Showerthoughts",
]

POSTS_PER_SUBREDDIT = 10
OUTPUT_PATH = Path("dashboard/public/rising-posts.json")


async def create_table_if_not_exists(conn: asyncpg.Connection) -> None:
    """Create the trending_posts table if it doesn't exist."""
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS reddit_bot.trending_posts (
            id SERIAL PRIMARY KEY,
            reddit_id VARCHAR(20) UNIQUE NOT NULL,
            title TEXT NOT NULL,
            subreddit VARCHAR(100) NOT NULL,
            score INTEGER DEFAULT 0,
            num_comments INTEGER DEFAULT 0,
            created_utc TIMESTAMP NOT NULL,
            permalink TEXT NOT NULL,
            selftext TEXT,
            url TEXT NOT NULL,
            growth_score DECIMAL(10, 2) DEFAULT 0,
            category VARCHAR(20) DEFAULT 'rising',
            fetched_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        )
    """)
    
    # Create indexes for faster queries
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_trending_posts_subreddit 
        ON reddit_bot.trending_posts(subreddit)
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_trending_posts_growth_score 
        ON reddit_bot.trending_posts(growth_score DESC)
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_trending_posts_fetched_at 
        ON reddit_bot.trending_posts(fetched_at DESC)
    """)


async def upsert_posts(conn: asyncpg.Connection, posts: list[dict]) -> int:
    """Insert or update posts in the database."""
    if not posts:
        return 0
    
    # Upsert query - update if exists, insert if not
    query = """
        INSERT INTO reddit_bot.trending_posts 
        (reddit_id, title, subreddit, score, num_comments, created_utc, 
         permalink, selftext, url, growth_score, category, fetched_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), TRUE)
        ON CONFLICT (reddit_id) DO UPDATE SET
            score = EXCLUDED.score,
            num_comments = EXCLUDED.num_comments,
            growth_score = EXCLUDED.growth_score,
            fetched_at = NOW(),
            is_active = TRUE
    """
    
    count = 0
    for post in posts:
        try:
            await conn.execute(
                query,
                post["id"],
                post["title"],
                post["subreddit"],
                post["score"],
                post["num_comments"],
                datetime.fromtimestamp(post["created_utc"]),
                post["permalink"],
                post.get("selftext", ""),
                post["url"],
                post.get("growth_score", 0),
                post.get("category", "rising"),
            )
            count += 1
        except Exception as e:
            print(f"  ⚠️ Failed to insert post {post['id']}: {e}")
    
    return count


async def deactivate_old_posts(conn: asyncpg.Connection, hours: int = 24) -> int:
    """Mark posts older than X hours as inactive."""
    result = await conn.execute("""
        UPDATE reddit_bot.trending_posts 
        SET is_active = FALSE 
        WHERE fetched_at < NOW() - INTERVAL '%s hours'
        AND is_active = TRUE
    """, hours)
    
    # Extract count from "UPDATE X" result
    return int(result.split()[-1]) if result else 0


async def get_active_posts(conn: asyncpg.Connection, limit: int = 50) -> list[dict]:
    """Get active trending posts sorted by growth score."""
    rows = await conn.fetch("""
        SELECT 
            reddit_id as id,
            title,
            subreddit,
            score,
            num_comments,
            EXTRACT(EPOCH FROM created_utc) as created_utc,
            permalink,
            selftext,
            url,
            growth_score,
            category
        FROM reddit_bot.trending_posts
        WHERE is_active = TRUE
        ORDER BY growth_score DESC
        LIMIT $1
    """, limit)
    
    return [dict(row) for row in rows]


async def fetch_subreddit_posts(reddit: asyncpraw.Reddit, subreddit_name: str, limit: int = 10) -> list[dict]:
    """Fetch rising and new posts from a subreddit."""
    posts = []
    
    try:
        subreddit = await reddit.subreddit(subreddit_name)
        
        # Fetch rising posts (best for early commenting)
        async for post in subreddit.rising(limit=limit):
            age_minutes = (datetime.now().timestamp() - post.created_utc) / 60
            growth_score = round((post.score / max(age_minutes, 1)) * 100, 1)
            
            posts.append({
                "id": post.id,
                "title": post.title,
                "subreddit": subreddit_name,
                "score": post.score,
                "num_comments": post.num_comments,
                "created_utc": post.created_utc,
                "permalink": post.permalink,
                "selftext": (post.selftext or "")[:500],  # Truncate long posts
                "url": f"https://www.reddit.com{post.permalink}",
                "growth_score": growth_score,
                "category": "rising",
            })
        
        # Also fetch some new posts (fresher opportunities)
        async for post in subreddit.new(limit=limit // 2):
            age_minutes = (datetime.now().timestamp() - post.created_utc) / 60
            
            # Only include posts that are getting some traction
            if post.score >= 5 and age_minutes < 60:
                growth_score = round((post.score / max(age_minutes, 1)) * 100, 1)
                
                posts.append({
                    "id": post.id,
                    "title": post.title,
                    "subreddit": subreddit_name,
                    "score": post.score,
                    "num_comments": post.num_comments,
                    "created_utc": post.created_utc,
                    "permalink": post.permalink,
                    "selftext": (post.selftext or "")[:500],
                    "url": f"https://www.reddit.com{post.permalink}",
                    "growth_score": growth_score,
                    "category": "new",
                })
                
    except Exception as e:
        print(f"  ⚠️ Error fetching from r/{subreddit_name}: {e}")
    
    return posts


async def export_to_json(posts: list[dict], output_path: Path) -> None:
    """Export posts to JSON for static hosting fallback."""
    output = {
        "generated_at": datetime.now().isoformat(),
        "total_posts": len(posts),
        "subreddits": TARGET_SUBREDDITS,
        "posts": posts,
    }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)


async def main():
    """Main function to fetch posts and store in database."""
    print("🚀 Starting Reddit data pipeline...")
    print(f"   Targeting {len(TARGET_SUBREDDITS)} subreddits")
    
    # Get database connection string
    db_url = os.getenv("DB_CONNECTION_STRING")
    if not db_url:
        print("❌ DB_CONNECTION_STRING not set. Exiting.")
        return
    
    # Connect to database
    print("\n📦 Connecting to database...")
    conn = await asyncpg.connect(db_url)
    
    try:
        # Create table if needed
        await create_table_if_not_exists(conn)
        print("   ✅ Table ready")
        
        # Initialize Reddit client
        reddit = asyncpraw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent="RedditEnhancer/1.0 (Data Pipeline)",
        )
        
        # Fetch posts from all subreddits
        all_posts = []
        print("\n📥 Fetching posts from Reddit...")
        
        for subreddit in TARGET_SUBREDDITS:
            print(f"   → r/{subreddit}...", end=" ")
            posts = await fetch_subreddit_posts(reddit, subreddit, POSTS_PER_SUBREDDIT)
            all_posts.extend(posts)
            print(f"found {len(posts)} posts")
        
        await reddit.close()
        
        # Sort by growth score
        all_posts.sort(key=lambda p: p.get("growth_score", 0), reverse=True)
        
        # Deduplicate
        seen_ids = set()
        unique_posts = []
        for post in all_posts:
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                unique_posts.append(post)
        
        top_posts = unique_posts[:50]
        
        # Store in database
        print(f"\n💾 Storing {len(top_posts)} posts in database...")
        inserted = await upsert_posts(conn, top_posts)
        print(f"   ✅ Upserted {inserted} posts")
        
        # Deactivate old posts
        deactivated = await deactivate_old_posts(conn, hours=24)
        print(f"   🗑️ Deactivated {deactivated} old posts")
        
        # Get active posts from DB for JSON export
        active_posts = await get_active_posts(conn, limit=50)
        
        # Also export to JSON (for static fallback)
        print(f"\n📄 Exporting to {OUTPUT_PATH}...")
        await export_to_json(active_posts, OUTPUT_PATH)
        print(f"   ✅ Exported {len(active_posts)} posts")
        
        print(f"\n✨ Pipeline complete!")
        print(f"   Top growth scores: {[p['growth_score'] for p in active_posts[:5]]}")
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
