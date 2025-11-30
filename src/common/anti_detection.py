"""Free anti-detection utilities to avoid account flagging.

These strategies help avoid bot detection WITHOUT paid proxies:
1. Random delays with human-like patterns
2. User-Agent rotation (browser-like)
3. Rate limiting per subreddit
4. Natural timing (avoid exact intervals)
"""

import asyncio
import random
from datetime import datetime, timezone
from collections import defaultdict

from src.common.logging import get_logger

logger = get_logger(__name__)


# Browser-like User-Agents (rotate to avoid fingerprinting)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
]


class AntiDetection:
    """
    Anti-detection utilities for Reddit bot.

    Implements free strategies to avoid account flagging:
    - Natural delay patterns (not exact intervals)
    - Rate limiting per subreddit
    - Tracking activity to avoid suspicious patterns
    """

    def __init__(self):
        # Track last action per subreddit
        self._last_action: dict[str, datetime] = {}
        # Track daily comment count per subreddit
        self._daily_counts: dict[str, int] = defaultdict(int)
        self._last_reset: datetime = datetime.now(timezone.utc)

        # Configurable limits
        self.min_delay_between_comments = 120  # 2 minutes minimum
        self.max_comments_per_subreddit_daily = 5  # Don't spam one subreddit
        self.max_total_comments_daily = 20  # Total daily limit

    def get_random_user_agent(self) -> str:
        """Get a random browser-like User-Agent."""
        return random.choice(USER_AGENTS)

    async def natural_delay(
        self,
        min_seconds: float = 30,
        max_seconds: float = 120,
    ) -> None:
        """
        Wait with human-like random delay.

        Uses gaussian distribution for more natural timing
        (most delays near middle, occasional short/long).

        Args:
            min_seconds: Minimum delay
            max_seconds: Maximum delay
        """
        # Gaussian distribution centered at middle, with variation
        mean = (min_seconds + max_seconds) / 2
        std_dev = (max_seconds - min_seconds) / 4

        delay = random.gauss(mean, std_dev)
        # Clamp to range
        delay = max(min_seconds, min(max_seconds, delay))

        # Add small random microseconds for natural feel
        delay += random.uniform(0.1, 0.9)

        logger.debug("anti_detection.waiting", delay_seconds=round(delay, 2))
        await asyncio.sleep(delay)

    def can_comment_in_subreddit(self, subreddit: str) -> tuple[bool, str]:
        """
        Check if it's safe to comment in a subreddit.

        Args:
            subreddit: Subreddit name

        Returns:
            Tuple of (can_comment, reason)
        """
        self._reset_daily_counts_if_needed()

        # Check subreddit daily limit
        if self._daily_counts[subreddit] >= self.max_comments_per_subreddit_daily:
            return (
                False,
                f"Daily limit reached for r/{subreddit} ({self.max_comments_per_subreddit_daily}/day)",
            )

        # Check total daily limit
        total_today = sum(self._daily_counts.values())
        if total_today >= self.max_total_comments_daily:
            return False, f"Total daily limit reached ({self.max_total_comments_daily}/day)"

        # Check time since last comment in this subreddit
        if subreddit in self._last_action:
            elapsed = (datetime.now(timezone.utc) - self._last_action[subreddit]).total_seconds()
            if elapsed < self.min_delay_between_comments:
                wait_time = self.min_delay_between_comments - elapsed
                return False, f"Too soon for r/{subreddit}, wait {int(wait_time)}s"

        return True, "OK"

    def record_comment(self, subreddit: str) -> None:
        """
        Record that a comment was posted.

        Args:
            subreddit: Subreddit where comment was posted
        """
        self._reset_daily_counts_if_needed()
        self._last_action[subreddit] = datetime.now(timezone.utc)
        self._daily_counts[subreddit] += 1

        total = sum(self._daily_counts.values())
        logger.info(
            "anti_detection.comment_recorded",
            subreddit=subreddit,
            subreddit_today=self._daily_counts[subreddit],
            total_today=total,
        )

    def _reset_daily_counts_if_needed(self) -> None:
        """Reset daily counts if a new day has started."""
        now = datetime.now(timezone.utc)
        if now.date() > self._last_reset.date():
            self._daily_counts.clear()
            self._last_reset = now
            logger.info("anti_detection.daily_counts_reset")

    def get_stats(self) -> dict:
        """Get current anti-detection stats."""
        self._reset_daily_counts_if_needed()
        return {
            "total_today": sum(self._daily_counts.values()),
            "max_daily": self.max_total_comments_daily,
            "by_subreddit": dict(self._daily_counts),
            "max_per_subreddit": self.max_comments_per_subreddit_daily,
        }


# Global instance
_anti_detection: AntiDetection | None = None


def get_anti_detection() -> AntiDetection:
    """Get or create global AntiDetection instance."""
    global _anti_detection
    if _anti_detection is None:
        _anti_detection = AntiDetection()
    return _anti_detection
