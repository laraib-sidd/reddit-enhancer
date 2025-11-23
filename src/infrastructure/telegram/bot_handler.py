"""Async Telegram bot handler for manual approval workflow."""

import asyncio
from datetime import datetime

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.error import TelegramError

from src.domain.entities import Post
from src.common.logging import get_logger
from src.common.exceptions import TelegramError as AppTelegramError
from src.common.retry import retry_on_api_error
from src.config.settings import TelegramSettings
from src.config.constants import TELEGRAM_APPROVAL_TIMEOUT

logger = get_logger(__name__)


class ApprovalResponse:
    """Response from user approval request."""

    def __init__(self, action: str, content: str | None = None):
        self.action = action  # 'approve', 'reject', 'edit', 'timeout'
        self.content = content  # New comment text if edited


class TelegramBotHandler:
    """
    Async Telegram bot handler for human-in-the-loop approval.

    Sends posts and proposed comments to Telegram for approval.
    """

    def __init__(self, settings: TelegramSettings):
        self.settings = settings
        self.bot: Bot | None = None

        if not settings.is_configured:
            logger.warning("telegram.not_configured", message="Telegram settings missing")

    async def connect(self) -> None:
        """Initialize the Telegram bot."""
        if not self.settings.is_configured:
            raise AppTelegramError("Telegram not configured")

        try:
            logger.info("telegram.connecting")
            self.bot = Bot(token=self.settings.token.get_secret_value())

            # Verify bot
            me = await self.bot.get_me()
            logger.info("telegram.connected", bot_username=me.username)

        except Exception as e:
            logger.error("telegram.connection_failed", error=str(e))
            raise AppTelegramError(f"Failed to connect to Telegram: {e}") from e

    @retry_on_api_error(max_attempts=3)
    async def send_approval_request(
        self,
        post: Post,
        proposed_comment: str,
    ) -> bool:
        """
        Send approval request to Telegram.

        Args:
            post: Post to comment on
            proposed_comment: Proposed comment text

        Returns:
            True if sent successfully

        Raises:
            AppTelegramError: If sending fails
        """
        if not self.bot:
            raise AppTelegramError("Telegram bot not connected")

        try:
            logger.info("telegram.sending_approval", post_id=post.id)

            # Format message
            message_text = (
                f"📢 *New Reddit Post*\n"
                f"**Subreddit:** r/{post.subreddit}\n"
                f"**Title:** {post.title}\n"
                f"🔗 [View Post](https://reddit.com{post.permalink})\n\n"
                f"🤖 **Proposed Comment:**\n"
                f"```\n{proposed_comment}\n```\n\n"
                f"Reply with:\n"
                f"• 'yes' or use ✅ button to approve\n"
                f"• 'skip' or use ❌ button to reject\n"
                f"• Type new text to edit and post"
            )

            # Create inline keyboard
            keyboard = [
                [
                    InlineKeyboardButton("✅ Approve", callback_data=f"approve:{post.id}"),
                    InlineKeyboardButton("❌ Skip", callback_data=f"skip:{post.id}"),
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            # Send message
            await self.bot.send_message(
                chat_id=self.settings.chat_id,
                text=message_text,
                parse_mode="Markdown",
                reply_markup=reply_markup,
            )

            logger.info("telegram.approval_sent", post_id=post.id)
            return True

        except TelegramError as e:
            logger.error("telegram.send_failed", post_id=post.id, error=str(e))
            raise AppTelegramError(f"Failed to send approval request: {e}") from e

    async def wait_for_approval(
        self,
        post_id: str,
        timeout: int = TELEGRAM_APPROVAL_TIMEOUT,
    ) -> ApprovalResponse:
        """
        Wait for user response to approval request.

        Args:
            post_id: Post ID to wait for
            timeout: Timeout in seconds

        Returns:
            ApprovalResponse with action and optional content

        Raises:
            AppTelegramError: If waiting fails
        """
        if not self.bot:
            raise AppTelegramError("Telegram bot not connected")

        try:
            logger.info("telegram.waiting_for_approval", post_id=post_id, timeout=timeout)

            start_time = datetime.now()
            offset = None

            while (datetime.now() - start_time).seconds < timeout:
                # Get updates
                updates = await self.bot.get_updates(offset=offset, timeout=10)

                for update in updates:
                    offset = update.update_id + 1

                    # Check for callback query (button press)
                    if update.callback_query:
                        data = update.callback_query.data
                        if ":" in data:
                            action, pid = data.split(":", 1)
                            if pid == post_id:
                                await update.callback_query.answer()
                                await self.bot.send_message(
                                    chat_id=self.settings.chat_id,
                                    text=f"✓ Action received: {action}",
                                )

                                response_action = "approve" if action == "approve" else "reject"
                                logger.info("telegram.approval_received", post_id=post_id, action=response_action)
                                return ApprovalResponse(response_action)

                    # Check for text message (reply/edit)
                    if update.message and str(update.message.chat.id) == str(self.settings.chat_id):
                        text = update.message.text.strip()

                        if text.lower() == "yes":
                            logger.info("telegram.approval_received", post_id=post_id, action="approve")
                            return ApprovalResponse("approve")
                        elif text.lower() in ["skip", "no"]:
                            logger.info("telegram.approval_received", post_id=post_id, action="reject")
                            return ApprovalResponse("reject")
                        else:
                            # Treat as edited comment
                            logger.info("telegram.approval_received", post_id=post_id, action="edit")
                            return ApprovalResponse("edit", content=text)

                await asyncio.sleep(1)

            # Timeout
            logger.warning("telegram.approval_timeout", post_id=post_id)
            return ApprovalResponse("timeout")

        except Exception as e:
            logger.error("telegram.wait_failed", post_id=post_id, error=str(e))
            raise AppTelegramError(f"Failed to wait for approval: {e}") from e

    async def close(self) -> None:
        """Close the Telegram bot."""
        if self.bot:
            logger.info("telegram.closing")
            # Note: python-telegram-bot doesn't require explicit close for Bot
            self.bot = None

