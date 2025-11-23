"""CLI commands for the Reddit enhancer bot."""

import asyncio
import typer
from rich.console import Console
from rich.table import Table

from src.config.settings import get_settings
from src.common.logging import configure_logging, get_logger
from src.infrastructure.database.connection import init_db

app = typer.Typer()
console = Console()
logger = get_logger(__name__)


@app.command()
def init():
    """Initialize the database."""
    console.print("[bold blue]Initializing database...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    asyncio.run(_init_db())

    console.print("[bold green]✓ Database initialized successfully![/bold green]")


async def _init_db():
    """Async database initialization."""
    await init_db()


@app.command()
def test():
    """
    Test the bot with mock Reddit data and real AI generation.

    This will:
    - Use MockRedditClient (no Reddit API calls)
    - Generate real comments using Claude
    - Display results in terminal (no posting)
    """
    from src.cli.test_flow import run_test

    console.print("[bold blue]Starting test flow...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    asyncio.run(run_test())


@app.command()
def manual():
    """
    Run bot in manual mode (human-in-the-loop via Telegram).

    Requires Telegram configuration.
    """
    console.print("[bold blue]Starting manual mode...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    if not settings.telegram.is_configured:
        console.print(
            "[bold red]Error: Telegram not configured. "
            "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env[/bold red]"
        )
        raise typer.Exit(code=1)

    from src.cli.runner import run_manual_mode

    asyncio.run(run_manual_mode())


@app.command()
def auto():
    """
    Run bot in fully automatic mode.

    No human approval - posts comments automatically with delays.
    """
    console.print("[bold yellow]⚠️  Starting automatic mode...[/bold yellow]")
    console.print(
        "[yellow]This will automatically post comments to Reddit. "
        "Make sure you understand the implications![/yellow]"
    )

    if not typer.confirm("Continue?"):
        raise typer.Abort()

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    from src.cli.runner import run_auto_mode

    asyncio.run(run_auto_mode())


@app.command()
def seed():
    """
    Seed the database with successful comment patterns from Reddit.

    This fetches top comments from your target subreddits to learn from.
    """
    console.print("[bold blue]Seeding successful patterns...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    from src.cli.seeder import seed_patterns

    asyncio.run(seed_patterns())

    console.print("[bold green]✓ Seeding complete![/bold green]")


@app.command()
def stats():
    """Display bot statistics."""
    console.print("[bold blue]Fetching statistics...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    asyncio.run(_show_stats())


async def _show_stats():
    """Display bot statistics."""
    from src.infrastructure.database.connection import get_session
    from src.infrastructure.database.repositories import (
        SQLAlchemyPostRepository,
        SQLAlchemyCommentRepository,
        SQLAlchemyPatternRepository,
    )

    async with get_session() as session:
        post_repo = SQLAlchemyPostRepository(session)
        comment_repo = SQLAlchemyCommentRepository(session)
        pattern_repo = SQLAlchemyPatternRepository(session)

        # Get stats
        # Note: We'd need to add count methods to repositories
        # For now, just display a simple table

        table = Table(title="Bot Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Status", "Running")
        table.add_row("Mode", "Ready")

        console.print(table)


if __name__ == "__main__":
    app()

