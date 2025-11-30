#!/usr/bin/env python3
"""Generate static JSON data for the dashboard.

This script fetches data from the database and writes it to JSON files
that the React dashboard can read. Run this during GitHub Actions build.

Outputs:
    - dashboard/public/data.json - Dashboard stats
    - dashboard/public/rising-posts.json - Trending posts for Comment Assistant

Usage:
    uv run python scripts/generate_dashboard_data.py
"""

import asyncio
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import asyncpg
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database.connection import get_session, init_db
from src.infrastructure.database.models import PostModel, CommentModel
from src.common.logging import get_logger

logger = get_logger(__name__)

OUTPUT_PATH = Path("dashboard/public/data.json")
RISING_POSTS_PATH = Path("dashboard/public/rising-posts.json")

TARGET_SUBREDDITS = [
    "AskReddit",
    "NoStupidQuestions",
    "explainlikeimfive",
    "TrueOffMyChest",
    "unpopularopinion",
    "LifeProTips",
    "Showerthoughts",
]


async def fetch_dashboard_data(session: AsyncSession) -> dict:
    """Fetch all dashboard data from database."""

    # Total posts
    result = await session.execute(
        select(func.count(PostModel.id)).where(PostModel.processed.is_(True))
    )
    total_posts = result.scalar() or 0

    # Comments by status
    result = await session.execute(select(CommentModel))
    comments = result.scalars().all()

    total_comments = len(comments)
    posted_comments = len([c for c in comments if c.status == "posted"])
    pending_comments = len([c for c in comments if c.status == "pending"])
    rejected_comments = len([c for c in comments if c.status == "rejected"])

    # Karma stats
    posted_with_karma = [c for c in comments if c.status == "posted" and c.karma_score is not None]
    total_karma = sum(c.karma_score or 0 for c in posted_with_karma)
    avg_karma = round(total_karma / len(posted_with_karma), 1) if posted_with_karma else 0

    # Top subreddits
    result = await session.execute(
        select(PostModel.subreddit, func.count(PostModel.id).label("count"))
        .where(PostModel.processed.is_(True))
        .group_by(PostModel.subreddit)
        .order_by(func.count(PostModel.id).desc())
        .limit(5)
    )
    top_subreddits = [{"subreddit": row[0], "count": row[1]} for row in result.all()]

    # AI provider usage
    provider_counts: dict[str, int] = {}
    for c in comments:
        if c.ai_provider:
            provider_counts[c.ai_provider] = provider_counts.get(c.ai_provider, 0) + 1
    ai_provider_usage = [
        {"provider": p, "count": c} for p, c in sorted(provider_counts.items(), key=lambda x: -x[1])
    ]

    # Recent activity (last 7 days)
    recent_activity = []
    for i in range(6, -1, -1):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")

        day_comments = len(
            [c for c in comments if c.created_at and c.created_at.strftime("%Y-%m-%d") == date_str]
        )

        recent_activity.append(
            {"date": date_str, "posts": 0, "comments": day_comments}  # Would need to track this
        )

    # Recent comments
    recent_comments = [
        {
            "id": str(c.id),
            "content": c.content[:200] if c.content else "",
            "status": c.status,
            "karma_score": c.karma_score,
            "ai_provider": c.ai_provider,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in sorted(comments, key=lambda x: x.created_at or datetime.min, reverse=True)[:5]
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "totalPosts": total_posts,
            "totalComments": total_comments,
            "postedComments": posted_comments,
            "pendingComments": pending_comments,
            "rejectedComments": rejected_comments,
            "totalKarma": total_karma,
            "avgKarma": avg_karma,
            "topSubreddits": top_subreddits,
            "recentActivity": recent_activity,
            "aiProviderUsage": ai_provider_usage,
        },
        "recentComments": recent_comments,
    }


async def fetch_trending_posts() -> list[dict]:
    """Fetch trending posts from database using raw asyncpg."""
    db_url = os.getenv("DB_CONNECTION_STRING")
    if not db_url:
        print("   ⚠️ DB_CONNECTION_STRING not set, skipping trending posts")
        return []

    try:
        conn = await asyncpg.connect(db_url)

        # Check if table exists
        exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'reddit_bot' 
                AND table_name = 'trending_posts'
            )
        """
        )

        if not exists:
            print("   ⚠️ trending_posts table doesn't exist yet")
            await conn.close()
            return []

        rows = await conn.fetch(
            """
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
            LIMIT 50
        """
        )

        await conn.close()

        return [
            {
                "id": row["id"],
                "title": row["title"],
                "subreddit": row["subreddit"],
                "score": row["score"],
                "num_comments": row["num_comments"],
                "created_utc": float(row["created_utc"]) if row["created_utc"] else 0,
                "permalink": row["permalink"],
                "selftext": row["selftext"] or "",
                "url": row["url"],
                "growth_score": float(row["growth_score"]) if row["growth_score"] else 0,
                "category": row["category"] or "rising",
            }
            for row in rows
        ]

    except Exception as e:
        print(f"   ⚠️ Error fetching trending posts: {e}")
        return []


async def main():
    """Generate dashboard data JSON files."""
    print("📊 Generating dashboard data...")

    await init_db()

    # Ensure output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Generate main dashboard data
    async with get_session() as session:
        data = await fetch_dashboard_data(session)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Dashboard data written to {OUTPUT_PATH}")
    print(f"   - {data['stats']['totalPosts']} posts")
    print(f"   - {data['stats']['totalComments']} comments")
    print(f"   - {data['stats']['totalKarma']} karma")

    # Generate trending posts data
    print("\n🔥 Generating trending posts data...")
    trending_posts = await fetch_trending_posts()

    if trending_posts:
        rising_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_posts": len(trending_posts),
            "subreddits": TARGET_SUBREDDITS,
            "posts": trending_posts,
        }

        with open(RISING_POSTS_PATH, "w") as f:
            json.dump(rising_data, f, indent=2)

        print(f"✅ Trending posts written to {RISING_POSTS_PATH}")
        print(f"   - {len(trending_posts)} posts")
    else:
        print("   ⚠️ No trending posts found, keeping existing file")


if __name__ == "__main__":
    asyncio.run(main())
