"""Async Google Gemini AI client for comment generation."""

import google.generativeai as genai

from src.domain.entities import Post, SuccessfulPattern
from src.infrastructure.ai.prompt_builder import PromptBuilder
from src.common.logging import get_logger
from src.common.exceptions import AIGenerationError
from src.common.retry import retry_on_api_error
from src.common.circuit_breaker import with_circuit_breaker
from src.config.constants import (
    DEFAULT_GEMINI_MODEL,
    GEMINI_MAX_TOKENS,
    GEMINI_TEMPERATURE,
)

logger = get_logger(__name__)


class GeminiClient:
    """
    Google Gemini AI client for generating comments.

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
        self.model_name = model or DEFAULT_GEMINI_MODEL
        self.max_tokens = max_tokens or GEMINI_MAX_TOKENS
        self.temperature = temperature or GEMINI_TEMPERATURE
        self.prompt_builder = PromptBuilder()

        # Configure Gemini API
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=genai.GenerationConfig(
                max_output_tokens=self.max_tokens,
                temperature=self.temperature,
            ),
            system_instruction=self.prompt_builder.build_system_prompt(),
        )

    @retry_on_api_error(max_attempts=3)
    @with_circuit_breaker(failure_threshold=5, recovery_timeout=60)
    async def generate_comment(
        self,
        post: Post,
        patterns: list[SuccessfulPattern] | None = None,
    ) -> str:
        """
        Generate a comment for a Reddit post using Gemini.

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
                "ai.gemini.generating_comment",
                post_id=post.id,
                subreddit=post.subreddit,
                patterns_count=len(patterns) if patterns else 0,
                model=self.model_name,
            )

            # Build prompt
            user_prompt = self.prompt_builder.build_comment_generation_prompt(post, patterns)

            # Call Gemini API (async)
            response = await self.model.generate_content_async(user_prompt)

            # Extract text from response
            if not response.text:
                raise AIGenerationError("Empty response from Gemini API")

            comment_text = response.text.strip()

            logger.info(
                "ai.gemini.comment_generated",
                post_id=post.id,
                comment_length=len(comment_text),
            )

            return comment_text

        except AIGenerationError:
            raise
        except Exception as e:
            logger.error(
                "ai.gemini.generation_failed",
                post_id=post.id,
                error=str(e),
            )
            raise AIGenerationError(f"Gemini failed to generate comment: {e}") from e

    async def close(self) -> None:
        """Close the client (no-op for Gemini, but maintains interface)."""
        logger.info("ai.gemini.client_closed")

