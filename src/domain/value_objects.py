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
    """Value object for karma score."""

    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Score cannot be negative")

    def __int__(self) -> int:
        return self.value

    def __add__(self, other: "Score") -> "Score":
        return Score(self.value + other.value)

    def __lt__(self, other: "Score") -> bool:
        return self.value < other.value

    def __gt__(self, other: "Score") -> bool:
        return self.value > other.value

