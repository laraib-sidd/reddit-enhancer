"""Domain value objects."""

from dataclasses import dataclass
from typing import NewType

# Simple type aliases for clarity
PostId = NewType("PostId", str)
CommentId = NewType("CommentId", str)
SubredditName = NewType("SubredditName", str)


@dataclass(frozen=True)
class CommentText:
    """Value object for comment text with validation."""

    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Comment text cannot be empty")
        if len(self.value) > 10000:
            raise ValueError("Comment text exceeds maximum length")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class PostTitle:
    """Value object for post title."""

    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Post title cannot be empty")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class Score:
    """
    Value object for karma score.

    Note: Reddit karma CAN be negative (downvoted content), so we allow
    negative values. This is intentional and matches Reddit's behavior.
    """

    value: int

    def __int__(self) -> int:
        return self.value

    def __add__(self, other: "Score") -> "Score":
        return Score(self.value + other.value)

    def __sub__(self, other: "Score") -> "Score":
        return Score(self.value - other.value)

    def __lt__(self, other: "Score") -> bool:
        return self.value < other.value

    def __gt__(self, other: "Score") -> bool:
        return self.value > other.value

    def __le__(self, other: "Score") -> bool:
        return self.value <= other.value

    def __ge__(self, other: "Score") -> bool:
        return self.value >= other.value

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Score):
            return self.value == other.value
        return NotImplemented

    def __hash__(self) -> int:
        return hash(self.value)

    @property
    def is_positive(self) -> bool:
        """Check if score is positive (upvoted)."""
        return self.value > 0

    @property
    def is_negative(self) -> bool:
        """Check if score is negative (downvoted)."""
        return self.value < 0
