"""Test flow for validating the bot without real Reddit API."""

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

from src.config.settings import get_settings
from src.common.logging import get_logger
from src.infrastructure.reddit.mock import MockRedditClient
from src.infrastructure.ai.claude_client import ClaudeClient
from src.application.use_cases.generate_comment import GenerateCommentUseCase
from src.infrastructure.database.connection import get_session
from src.infrastructure.database.repositories import SQLAlchemyPatternRepository

console = Console()
logger = get_logger(__name__)


async def run_test():
    """
    Run test flow with mock Reddit and real AI.

    This validates the entire pipeline without making real Reddit API calls.
    """
    console.print("[bold cyan]🧪 Test Flow - Mock Reddit + Real AI[/bold cyan]\n")

    settings = get_settings()

    # Initialize mock Reddit client
    reddit_client = MockRedditClient()

    # Initialize real AI client
    ai_client = ClaudeClient(settings.ai)

    try:
        # Fetch mock posts
        console.print("[cyan]1. Fetching mock Reddit posts...[/cyan]")
        posts = await reddit_client.get_rising_posts(
            settings.bot.target_subreddits, limit=3
        )

        console.print(f"[green]✓ Found {len(posts)} mock posts[/green]\n")

        # Process each post
        for i, post in enumerate(posts, 1):
            console.print(f"[bold]{'=' * 80}[/bold]")
            console.print(f"[bold cyan]Post {i}/{len(posts)}[/bold cyan]\n")

            # Display post details
            console.print(Panel(
                f"[bold]Title:[/bold] {post.title}\n"
                f"[bold]Subreddit:[/bold] r/{post.subreddit}\n"
                f"[bold]Content:[/bold] {post.content if post.content else '[No content]'}\n"
                f"[bold]URL:[/bold] {post.url}",
                title="📝 Reddit Post",
                border_style="blue"
            ))

            # Generate comment
            console.print("\n[cyan]2. Generating AI comment...[/cyan]")

            async with get_session() as session:
                pattern_repo = SQLAlchemyPatternRepository(session)
                generate_use_case = GenerateCommentUseCase(ai_client, pattern_repo)

                comment = await generate_use_case.execute(post, use_patterns=True)

            # Display generated comment
            console.print("\n[green]✓ Comment generated![/green]\n")

            console.print(Panel(
                Syntax(str(comment.content), "text", theme="monokai", word_wrap=True),
                title="💬 Generated Comment",
                border_style="green"
            ))

            console.print(f"\n[dim]Comment length: {len(str(comment.content))} characters[/dim]")
            console.print(f"[dim]Status: {comment.status.value}[/dim]\n")

    except Exception as e:
        console.print(f"\n[bold red]✗ Error: {e}[/bold red]")
        logger.error("test_flow.error", error=str(e))
        raise
    finally:
        await reddit_client.close()
        await ai_client.close()

    console.print(f"[bold]{'=' * 80}[/bold]")
    console.print("\n[bold green]✓ Test flow complete![/bold green]")
    console.print("\n[dim]This test used:[/dim]")
    console.print("[dim]  • Mock Reddit client (no API calls)[/dim]")
    console.print("[dim]  • Real Claude AI (actual API calls)[/dim]")
    console.print("[dim]  • No comments were posted to Reddit[/dim]")

