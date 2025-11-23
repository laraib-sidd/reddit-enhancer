"""Seeder for populating database with successful patterns."""

from rich.console import Console
from rich.progress import track

from src.config.settings import get_settings
from src.common.logging import get_logger
from src.infrastructure.reddit.reader import RedditReader
from src.infrastructure.database.connection import get_session, init_db
from src.infrastructure.database.repositories import SQLAlchemyPatternRepository

console = Console()
logger = get_logger(__name__)


async def seed_patterns():
    """
    Seed the database with successful comment patterns.

    Fetches top comments from target subreddits to learn from.
    """
    settings = get_settings()

    console.print("[bold blue]Seeding successful patterns...[/bold blue]\n")

    # Initialize database
    await init_db()

    # Initialize Reddit reader with individual settings
    reddit_reader = RedditReader(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        user_agent=settings.reddit_user_agent,
    )
    await reddit_reader.connect()

    try:
        total_added = 0

        for subreddit in track(
            settings.subreddits_list,
            description="Processing subreddits..."
        ):
            console.print(f"\n[cyan]Fetching from r/{subreddit}...[/cyan]")

            # Fetch top comments
            patterns = await reddit_reader.get_top_comments(subreddit, limit=20)

            async with get_session() as session:
                pattern_repo = SQLAlchemyPatternRepository(session)

                # Save patterns
                for pattern in patterns:
                    # Check if exists
                    exists = await pattern_repo.exists(pattern.pattern_text)

                    if not exists:
                        await pattern_repo.save(pattern)
                        total_added += 1

            console.print(f"[green]✓ Added patterns from r/{subreddit}[/green]")

        console.print(f"\n[bold green]✓ Seeding complete! Added {total_added} new patterns.[/bold green]")

    except Exception as e:
        console.print(f"\n[bold red]✗ Error: {e}[/bold red]")
        logger.error("seeder.error", error=str(e))
        raise
    finally:
        await reddit_reader.close()

