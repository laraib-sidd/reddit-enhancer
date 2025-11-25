"""Async Claude AI client for comment generation."""

from anthropic import AsyncAnthropic

from src.domain.entities import Post, SuccessfulPattern
from src.infrastructure.ai.prompt_builder import PromptBuilder
from src.common.logging import get_logger
from src.common.exceptions import AIGenerationError
from src.common.retry import retry_on_api_error
from src.common.circuit_breaker import with_circuit_breaker
from src.config.constants import DEFAULT_AI_MODEL, MAX_COMMENT_TOKENS, AI_TEMPERATURE

logger = get_logger(__name__)


class ClaudeClient:
    """
    Async Claude AI client for generating comments.

    Includes retry logic and circuit breaker for resilience.
    """

    def __init__(
        self,
        api_key: str,
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ):
        self.api_key = api_key
        self.model = model or DEFAULT_AI_MODEL
        self.max_tokens = max_tokens or MAX_COMMENT_TOKENS
        self.temperature = temperature or AI_TEMPERATURE
        self.client = AsyncAnthropic(api_key=api_key)
        self.prompt_builder = PromptBuilder()

    @retry_on_api_error(max_attempts=3)
    @with_circuit_breaker(failure_threshold=5, recovery_timeout=60)
    async def generate_comment(
        self,
        post: Post,
        patterns: list[SuccessfulPattern] | None = None,
    ) -> str:
        """
        Generate a comment for a Reddit post.

        Args:
            post: Post to comment on
            patterns: Optional successful patterns to learn from

        Returns:
            Generated comment text

        Raises:
            AIGenerationError: If generation fails
        """
        try:
            logger.info(
                "ai.generating_comment",
                post_id=post.id,
                subreddit=post.subreddit,
                patterns_count=len(patterns) if patterns else 0,
            )

            # Build prompt
            user_prompt = self.prompt_builder.build_comment_generation_prompt(post, patterns)
            system_prompt = self.prompt_builder.build_system_prompt()

            # Call Claude API
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )

            # Extract text from response
            if not message.content:
                raise AIGenerationError("Empty response from Claude API")

            comment_text = message.content[0].text.strip()

            logger.info(
                "ai.comment_generated",
                post_id=post.id,
                comment_length=len(comment_text),
            )

            return comment_text

        except AIGenerationError:
            raise
        except Exception as e:
            logger.error(
                "ai.generation_failed",
                post_id=post.id,
                error=str(e),
            )
            raise AIGenerationError(f"Failed to generate comment: {e}") from e

    async def close(self) -> None:
        """Close the client."""
        await self.client.close()
        logger.info("ai.client_closed")
