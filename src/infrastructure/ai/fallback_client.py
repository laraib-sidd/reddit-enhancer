"""Fallback AI client that tries multiple providers in order."""

from src.domain.entities import Post, SuccessfulPattern
from src.common.logging import get_logger
from src.common.exceptions import AIGenerationError

logger = get_logger(__name__)


class FallbackAIClient:
    """
    AI client that tries multiple providers in order of precedence.

    Order: Gemini (primary) → Claude (fallback)

    If Gemini fails (rate limit, API error, etc.), automatically
    falls back to Claude without interrupting the workflow.
    """

    def __init__(
        self,
        gemini_api_key: str | None = None,
        claude_api_key: str | None = None,
    ):
        """
        Initialize the fallback AI client.

        Args:
            gemini_api_key: Google Gemini API key (primary)
            claude_api_key: Anthropic Claude API key (fallback)

        Raises:
            AIGenerationError: If no AI provider is configured
        """
        self.clients: list[tuple[str, object]] = []
        self._gemini_client = None
        self._claude_client = None

        # Initialize Gemini (primary) if available
        if gemini_api_key:
            try:
                from src.infrastructure.ai.gemini_client import GeminiClient

                self._gemini_client = GeminiClient(gemini_api_key)
                self.clients.append(("gemini", self._gemini_client))
                logger.info("ai.fallback.gemini_configured")
            except Exception as e:
                logger.warning("ai.fallback.gemini_init_failed", error=str(e))

        # Initialize Claude (fallback) if available
        if claude_api_key:
            try:
                from src.infrastructure.ai.claude_client import ClaudeClient

                self._claude_client = ClaudeClient(claude_api_key)
                self.clients.append(("claude", self._claude_client))
                logger.info("ai.fallback.claude_configured")
            except Exception as e:
                logger.warning("ai.fallback.claude_init_failed", error=str(e))

        if not self.clients:
            raise AIGenerationError(
                "No AI provider configured. Set GOOGLE_API_KEY (Gemini) "
                "or ANTHROPIC_API_KEY (Claude) in your .env file."
            )

        provider_names = [name for name, _ in self.clients]
        logger.info(
            "ai.fallback.initialized",
            providers=provider_names,
            primary=provider_names[0] if provider_names else None,
        )

    async def generate_comment(
        self,
        post: Post,
        patterns: list[SuccessfulPattern] | None = None,
    ) -> str:
        """
        Generate a comment using available AI providers.

        Tries providers in order: Gemini → Claude.
        Falls back to next provider if current one fails.

        Args:
            post: Post to comment on
            patterns: Optional successful patterns to learn from

        Returns:
            Generated comment text

        Raises:
            AIGenerationError: If all providers fail
        """
        last_error: Exception | None = None

        for provider_name, client in self.clients:
            try:
                logger.info(
                    "ai.fallback.trying_provider",
                    provider=provider_name,
                    post_id=post.id,
                )

                comment = await client.generate_comment(post, patterns)

                logger.info(
                    "ai.fallback.success",
                    provider=provider_name,
                    post_id=post.id,
                    comment_length=len(comment),
                )

                return comment

            except Exception as e:
                last_error = e
                logger.warning(
                    "ai.fallback.provider_failed",
                    provider=provider_name,
                    post_id=post.id,
                    error=str(e),
                )
                # Continue to next provider

        # All providers failed
        logger.error(
            "ai.fallback.all_providers_failed",
            post_id=post.id,
            providers=[name for name, _ in self.clients],
        )
        raise AIGenerationError(
            f"All AI providers failed. Last error: {last_error}"
        ) from last_error

    async def close(self) -> None:
        """Close all AI clients."""
        for provider_name, client in self.clients:
            try:
                await client.close()
                logger.info("ai.fallback.client_closed", provider=provider_name)
            except Exception as e:
                logger.warning(
                    "ai.fallback.close_error",
                    provider=provider_name,
                    error=str(e),
                )

    @property
    def primary_provider(self) -> str | None:
        """Get the name of the primary (first) provider."""
        return self.clients[0][0] if self.clients else None

    @property
    def available_providers(self) -> list[str]:
        """Get list of available provider names."""
        return [name for name, _ in self.clients]

