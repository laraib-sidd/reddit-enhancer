"""CLI commands for the Reddit enhancer bot."""

import asyncio
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.config.settings import get_settings
from src.common.logging import configure_logging, get_logger
from src.infrastructure.database.connection import init_db

app = typer.Typer(
    name="reddit-bot",
    help="Reddit Karma Assistant - AI-powered comment generation bot",
    add_completion=False,
)
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

    if not settings.telegram_is_configured:
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
    """Display comprehensive bot statistics."""
    from src.infrastructure.database.connection import get_session
    from src.infrastructure.database.models import PostModel, CommentModel, SuccessfulPatternModel
    from src.domain.entities import CommentStatus
    from sqlalchemy import select, func

    async with get_session() as session:
        # Get post counts
        total_posts = (
            await session.execute(select(func.count()).select_from(PostModel))
        ).scalar() or 0

        processed_posts = (
            await session.execute(
                select(func.count())
                .select_from(PostModel)
                .where(PostModel.processed_at.isnot(None))
            )
        ).scalar() or 0

        # Get comment counts by status
        comment_stats = {}
        for status in CommentStatus:
            count = (
                await session.execute(
                    select(func.count())
                    .select_from(CommentModel)
                    .where(CommentModel.status == status.value)
                )
            ).scalar() or 0
            comment_stats[status.value] = count

        total_comments = sum(comment_stats.values())

        # Get golden examples count
        golden_count = (
            await session.execute(
                select(func.count())
                .select_from(CommentModel)
                .where(CommentModel.is_golden_example.is_(True))
            )
        ).scalar() or 0

        # Get karma stats for posted comments
        karma_result = (
            await session.execute(
                select(
                    func.sum(CommentModel.karma_score),
                    func.avg(CommentModel.karma_score),
                    func.max(CommentModel.karma_score),
                ).where(CommentModel.status == CommentStatus.POSTED.value)
            )
        ).first()
        total_karma = karma_result[0] or 0
        avg_karma = karma_result[1] or 0
        max_karma = karma_result[2] or 0

        # Get pattern counts
        total_patterns = (
            await session.execute(select(func.count()).select_from(SuccessfulPatternModel))
        ).scalar() or 0

        # Get subreddit pattern distribution
        subreddit_counts = (
            await session.execute(
                select(SuccessfulPatternModel.subreddit, func.count())
                .group_by(SuccessfulPatternModel.subreddit)
                .order_by(func.count().desc())
                .limit(5)
            )
        ).all()

    # Display statistics
    console.print()

    # Posts table
    posts_table = Table(title="📝 Posts Statistics", show_header=True, header_style="bold cyan")
    posts_table.add_column("Metric", style="dim")
    posts_table.add_column("Value", style="green", justify="right")
    posts_table.add_row("Total Posts", str(total_posts))
    posts_table.add_row("Processed", str(processed_posts))
    posts_table.add_row("Pending", str(total_posts - processed_posts))
    console.print(posts_table)
    console.print()

    # Comments table
    comments_table = Table(
        title="💬 Comments Statistics", show_header=True, header_style="bold cyan"
    )
    comments_table.add_column("Status", style="dim")
    comments_table.add_column("Count", style="green", justify="right")
    for status, count in comment_stats.items():
        emoji = {
            "pending": "⏳",
            "approved": "✅",
            "rejected": "❌",
            "posted": "📤",
            "failed": "💥",
            "skipped": "⏭️",
        }.get(status, "")
        comments_table.add_row(f"{emoji} {status.title()}", str(count))
    comments_table.add_row("─" * 15, "─" * 8)
    comments_table.add_row("Total", str(total_comments))
    comments_table.add_row("🌟 Golden Examples", str(golden_count))
    console.print(comments_table)
    console.print()

    # Karma table
    karma_table = Table(title="⭐ Karma Statistics", show_header=True, header_style="bold cyan")
    karma_table.add_column("Metric", style="dim")
    karma_table.add_column("Value", style="green", justify="right")
    karma_table.add_row("Total Karma", f"{total_karma:,}")
    karma_table.add_row("Average Karma", f"{avg_karma:.1f}")
    karma_table.add_row("Best Comment", f"{max_karma:,}")
    console.print(karma_table)
    console.print()

    # Patterns table
    patterns_table = Table(
        title="📚 Patterns Statistics", show_header=True, header_style="bold cyan"
    )
    patterns_table.add_column("Subreddit", style="dim")
    patterns_table.add_column("Patterns", style="green", justify="right")
    for subreddit, count in subreddit_counts:
        patterns_table.add_row(f"r/{subreddit}" if subreddit else "(No subreddit)", str(count))
    patterns_table.add_row("─" * 20, "─" * 8)
    patterns_table.add_row("Total Patterns", str(total_patterns))
    console.print(patterns_table)


@app.command()
def health():
    """Check system health status."""
    console.print("[bold blue]Running health checks...[/bold blue]")

    settings = get_settings()
    configure_logging(settings.log_level, settings.json_logs)

    asyncio.run(_check_health())


async def _check_health():
    """Run comprehensive health checks."""
    from src.infrastructure.database.connection import get_engine
    from sqlalchemy import text
    from time import perf_counter

    checks = {}
    overall_healthy = True

    # Database health check
    try:
        engine = get_engine()
        start = perf_counter()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = (perf_counter() - start) * 1000

        # Get pool stats
        pool = engine.pool
        pool_info = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }

        checks["database"] = {
            "status": "✅ Healthy",
            "latency_ms": f"{latency_ms:.2f}",
            "pool": pool_info,
        }
    except Exception as e:
        checks["database"] = {
            "status": "❌ Unhealthy",
            "error": str(e),
        }
        overall_healthy = False

    # Configuration check
    try:
        settings = get_settings()
        config_issues = []
        ai_providers = []

        if settings.reddit_client_id == "dummy_client_id":
            config_issues.append("Reddit client ID not configured")

        # Check AI providers (at least one required)
        if settings.gemini_is_configured:
            ai_providers.append("Gemini (primary)")
        if settings.claude_is_configured:
            ai_providers.append("Claude" + (" (fallback)" if settings.gemini_is_configured else " (primary)"))

        if not ai_providers:
            config_issues.append("No AI provider configured (set GOOGLE_API_KEY or ANTHROPIC_API_KEY)")
        if not settings.telegram_is_configured:
            config_issues.append("Telegram not configured (optional)")

        checks["configuration"] = {
            "status": "✅ Valid" if not config_issues else "⚠️ Warnings",
            "issues": config_issues if config_issues else ["All required settings configured"],
            "environment": settings.environment,
            "subreddits": settings.subreddits_list,
            "ai_providers": ai_providers,
        }
    except Exception as e:
        checks["configuration"] = {
            "status": "❌ Invalid",
            "error": str(e),
        }
        overall_healthy = False

    # Display results
    console.print()

    status_color = "green" if overall_healthy else "red"
    status_text = "HEALTHY" if overall_healthy else "UNHEALTHY"
    console.print(
        Panel(
            f"[bold {status_color}]System Status: {status_text}[/bold {status_color}]",
            title="Health Check Results",
            border_style=status_color,
        )
    )
    console.print()

    # Database details
    db_check = checks.get("database", {})
    db_table = Table(title="🗄️ Database", show_header=True, header_style="bold cyan")
    db_table.add_column("Check", style="dim")
    db_table.add_column("Result", style="green")
    db_table.add_row("Status", db_check.get("status", "Unknown"))
    if "latency_ms" in db_check:
        db_table.add_row("Latency", f"{db_check['latency_ms']}ms")
    if "pool" in db_check:
        pool = db_check["pool"]
        db_table.add_row("Pool Size", str(pool.get("size", "N/A")))
        db_table.add_row("Connections In Use", str(pool.get("checked_out", "N/A")))
    if "error" in db_check:
        db_table.add_row("Error", f"[red]{db_check['error']}[/red]")
    console.print(db_table)
    console.print()

    # Configuration details
    config_check = checks.get("configuration", {})
    config_table = Table(title="⚙️ Configuration", show_header=True, header_style="bold cyan")
    config_table.add_column("Check", style="dim")
    config_table.add_column("Result", style="green")
    config_table.add_row("Status", config_check.get("status", "Unknown"))
    config_table.add_row("Environment", config_check.get("environment", "Unknown"))
    config_table.add_row("Subreddits", ", ".join(config_check.get("subreddits", [])))

    # Show AI providers
    ai_providers = config_check.get("ai_providers", [])
    if ai_providers:
        config_table.add_row("AI Providers", ", ".join(ai_providers))
    else:
        config_table.add_row("AI Providers", "[red]None configured[/red]")

    for issue in config_check.get("issues", []):
        if "not configured" in issue.lower():
            config_table.add_row("⚠️", f"[yellow]{issue}[/yellow]")
        else:
            config_table.add_row("✓", issue)
    console.print(config_table)

    return overall_healthy


if __name__ == "__main__":
    app()
