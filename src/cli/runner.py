"""Mode runners for manual and automatic operation."""

import asyncio
from datetime import datetime

from rich.console import Console

from src.config.settings import get_settings
from src.common.logging import get_logger
from src.common.anti_detection import get_anti_detection
from src.infrastructure.database.connection import get_session, init_db
from src.infrastructure.database.repositories import (
    SQLAlchemyPostRepository,
    SQLAlchemyCommentRepository,
    SQLAlchemyPatternRepository,
)
from src.infrastructure.reddit.reader import RedditReader
from src.infrastructure.reddit.writer import RedditWriter
from src.infrastructure.ai.fallback_client import FallbackAIClient
from src.infrastructure.telegram.bot_handler import TelegramBotHandler
from src.application.use_cases.scan_posts import ScanPostsUseCase
from src.application.use_cases.generate_comment import GenerateCommentUseCase
from src.application.use_cases.post_comment import PostCommentUseCase

console = Console()
logger = get_logger(__name__)


async def run_manual_mode():
    """Run bot in manual mode with Telegram approval."""
    settings = get_settings()

    console.print("[bold green]✓ Manual mode started[/bold green]")
    logger.info("mode.manual_started")

    # Initialize database
    await init_db()

    # Get proxy URL if configured
    proxy_url = settings.proxy_url.get_secret_value() if settings.proxy_url else None

    # Initialize services
    reddit_reader = RedditReader(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        user_agent=settings.reddit_user_agent,
        proxy_url=proxy_url,
    )
    await reddit_reader.connect()

    reddit_writer = RedditWriter(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        username=settings.reddit_username,
        password=settings.reddit_password.get_secret_value() if settings.reddit_password else None,
        user_agent=settings.reddit_user_agent,
        proxy_url=proxy_url,
    )
    try:
        await reddit_writer.connect()
        console.print("[green]✓ Reddit writer authenticated[/green]")
        if proxy_url:
            console.print("[green]✓ Proxy enabled[/green]")
    except Exception as e:
        console.print(f"[yellow]⚠️  Reddit writer not available: {e}[/yellow]")
        console.print("[yellow]You can generate comments but not post them.[/yellow]")

    # Initialize AI client with fallback (Gemini primary, Claude fallback)
    ai_client = FallbackAIClient(
        gemini_api_key=(
            settings.google_api_key.get_secret_value() if settings.google_api_key else None
        ),
        claude_api_key=(
            settings.anthropic_api_key.get_secret_value() if settings.anthropic_api_key else None
        ),
    )
    console.print(
        f"[green]✓ AI providers: {', '.join(ai_client.available_providers)} "
        f"(primary: {ai_client.primary_provider})[/green]"
    )

    telegram_bot = TelegramBotHandler(
        bot_token=settings.telegram_bot_token.get_secret_value()
        if settings.telegram_bot_token
        else "",
        chat_id=settings.telegram_chat_id or "",
    )
    await telegram_bot.connect()

    try:
        while True:
            console.print("\n[cyan]🔎 Scanning for rising posts...[/cyan]")

            async with get_session() as session:
                # Setup repositories and use cases
                post_repo = SQLAlchemyPostRepository(session)
                comment_repo = SQLAlchemyCommentRepository(session)
                pattern_repo = SQLAlchemyPatternRepository(session)

                scan_use_case = ScanPostsUseCase(reddit_reader, post_repo)
                generate_use_case = GenerateCommentUseCase(ai_client, pattern_repo)
                post_use_case = PostCommentUseCase(reddit_writer, comment_repo)

                # Scan for posts
                all_posts, new_posts = await scan_use_case.execute(
                    settings.subreddits_list, limit=5
                )

                if not new_posts:
                    console.print("[dim]No new posts found. Waiting...[/dim]")
                    await asyncio.sleep(300)  # 5 minutes
                    continue

                # Process each new post
                for post in new_posts:
                    console.print(f"\n[bold]Processing:[/bold] {post.title}")

                    # Generate comment
                    comment = await generate_use_case.execute(post)

                    # Save comment
                    await comment_repo.save(comment)

                    # Request approval via Telegram
                    await telegram_bot.send_approval_request(post, str(comment.content))

                    # Wait for approval
                    response = await telegram_bot.wait_for_approval(str(post.id))

                    if response.action == "approve":
                        console.print("[green]✓ Approved! Posting...[/green]")
                        await post_use_case.execute(comment)
                    elif response.action == "edit":
                        console.print("[yellow]✏️  Edited. Posting new version...[/yellow]")
                        comment.content = response.content
                        await post_use_case.execute(comment)
                    elif response.action == "reject":
                        console.print("[red]✗ Rejected. Skipping.[/red]")
                        comment.reject()
                        await comment_repo.save(comment)
                    else:
                        console.print("[dim]⏱ Timeout. Skipping.[/dim]")

                    await asyncio.sleep(5)  # Brief pause between posts

            console.print("\n[dim]Cycle complete. Sleeping 5 minutes...[/dim]")
            await asyncio.sleep(300)

    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down...[/yellow]")
    finally:
        await reddit_reader.close()
        await reddit_writer.close()
        await ai_client.close()


async def run_auto_mode():
    """Run bot in fully automatic mode with anti-detection."""
    settings = get_settings()

    console.print("[bold yellow]⚠️  Automatic mode started[/bold yellow]")
    logger.info("mode.auto_started")

    # Initialize anti-detection (FREE - no proxy needed)
    anti_detection = get_anti_detection()
    console.print("[green]✓ Anti-detection enabled (rate limiting, natural delays)[/green]")

    # Initialize database
    await init_db()

    # Get proxy URL if configured (optional)
    proxy_url = settings.proxy_url.get_secret_value() if settings.proxy_url else None

    # Initialize services
    reddit_reader = RedditReader(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        user_agent=settings.reddit_user_agent,
        proxy_url=proxy_url,
    )
    await reddit_reader.connect()

    reddit_writer = RedditWriter(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret.get_secret_value(),
        username=settings.reddit_username,
        password=settings.reddit_password.get_secret_value() if settings.reddit_password else None,
        user_agent=settings.reddit_user_agent,
        proxy_url=proxy_url,
    )
    await reddit_writer.connect()

    if proxy_url:
        console.print("[green]✓ Proxy enabled (optional extra protection)[/green]")
    else:
        console.print("[dim]ℹ No proxy configured (using free anti-detection only)[/dim]")

    # Initialize AI client with fallback (Gemini primary, Claude fallback)
    ai_client = FallbackAIClient(
        gemini_api_key=(
            settings.google_api_key.get_secret_value() if settings.google_api_key else None
        ),
        claude_api_key=(
            settings.anthropic_api_key.get_secret_value() if settings.anthropic_api_key else None
        ),
    )
    console.print(
        f"[green]✓ AI providers: {', '.join(ai_client.available_providers)} "
        f"(primary: {ai_client.primary_provider})[/green]"
    )

    try:
        while True:
            console.print(f"\n[cyan]🔎 [{datetime.now()}] Starting auto cycle...[/cyan]")

            # Show daily stats
            stats = anti_detection.get_stats()
            console.print(
                f"[dim]📊 Today: {stats['total_today']}/{stats['max_daily']} comments[/dim]"
            )

            async with get_session() as session:
                # Setup repositories and use cases
                post_repo = SQLAlchemyPostRepository(session)
                comment_repo = SQLAlchemyCommentRepository(session)
                pattern_repo = SQLAlchemyPatternRepository(session)

                scan_use_case = ScanPostsUseCase(reddit_reader, post_repo)
                generate_use_case = GenerateCommentUseCase(ai_client, pattern_repo)
                post_use_case = PostCommentUseCase(reddit_writer, comment_repo)

                # Scan for posts
                all_posts, new_posts = await scan_use_case.execute(
                    settings.subreddits_list, limit=3
                )

                if not new_posts:
                    console.print("[dim]No new posts found.[/dim]")
                else:
                    # Process each new post
                    for post in new_posts:
                        # Check if we can comment (anti-detection limits)
                        can_comment, reason = anti_detection.can_comment_in_subreddit(
                            post.subreddit
                        )
                        if not can_comment:
                            console.print(f"[yellow]⏳ Skipping: {reason}[/yellow]")
                            continue

                        console.print(f"\n[bold]Generating comment for:[/bold] {post.title}")

                        # Generate comment
                        comment = await generate_use_case.execute(post)
                        await comment_repo.save(comment)

                        # Natural delay before posting (gaussian distribution)
                        console.print("[dim]⏳ Natural delay before posting...[/dim]")
                        await anti_detection.natural_delay(
                            min_seconds=settings.mode_delay_min,
                            max_seconds=settings.mode_delay_max,
                        )

                        # Post comment
                        await post_use_case.execute(comment)

                        if comment.reddit_comment_id:
                            # Record the comment for rate limiting
                            anti_detection.record_comment(post.subreddit)
                            console.print(
                                f"[green]✓ Posted comment {comment.reddit_comment_id}[/green]"
                            )
                        else:
                            console.print("[red]✗ Failed to post comment[/red]")

                        # Natural delay between posts
                        await anti_detection.natural_delay(min_seconds=30, max_seconds=90)

            # Natural delay before next scan
            console.print("\n[dim]💤 Natural delay before next scan...[/dim]")
            await anti_detection.natural_delay(min_seconds=600, max_seconds=1200)

    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down...[/yellow]")
    finally:
        await reddit_reader.close()
        await reddit_writer.close()
        await ai_client.close()
