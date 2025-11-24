"""Seeder for populating database with successful patterns."""

import os
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn

from src.config.settings import get_settings
from src.common.logging import get_logger, configure_logging
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
    # Suppress all logs during seeding for clean output
    configure_logging(log_level="ERROR", json_logs=False)
    
    settings = get_settings()

    console.print("\n[bold blue]🌱 Seeding Successful Patterns[/bold blue]\n")

    # Initialize database silently
    await init_db()

    # Initialize Reddit reader
    reddit_reader = RedditReader(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        user_agent=settings.reddit_user_agent,
    )
    await reddit_reader.connect()

    try:
        total_added = 0
        total_skipped = 0
        subreddits = settings.subreddits_list

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            console=console,
        ) as progress:
            
            main_task = progress.add_task(
                "[cyan]Processing subreddits...", 
                total=len(subreddits)
            )

            for subreddit in subreddits:
                progress.update(main_task, description=f"[cyan]Fetching r/{subreddit}...")

                # Fetch top comments
                patterns = await reddit_reader.get_top_comments(subreddit, limit=20)

                async with get_session() as session:
                    pattern_repo = SQLAlchemyPatternRepository(session)

                    # Save patterns
                    for pattern in patterns:
                        exists = await pattern_repo.exists(pattern.pattern_text)

                        if not exists:
                            await pattern_repo.save(pattern)
                            total_added += 1
                        else:
                            total_skipped += 1

                progress.advance(main_task)
                console.print(f"  [green]✓[/green] r/{subreddit}: {len(patterns)} patterns fetched")

        # Summary
        console.print("\n" + "─" * 60)
        console.print(f"[bold green]✓ Seeding Complete![/bold green]")
        console.print(f"  • Added: [green]{total_added}[/green] new patterns")
        console.print(f"  • Skipped: [yellow]{total_skipped}[/yellow] duplicates")
        console.print(f"  • Total: [cyan]{total_added + total_skipped}[/cyan] patterns processed")
        console.print("─" * 60 + "\n")

    except Exception as e:
        console.print(f"\n[bold red]✗ Error: {e}[/bold red]")
        logger.error("seeder.error", error=str(e))
        raise
    finally:
        await reddit_reader.close()

