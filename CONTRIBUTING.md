# Contributing to Reddit Enhancer Bot

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager
- PostgreSQL database (or Supabase account)
- Reddit API credentials
- Anthropic API key

### Setup

```bash
# Clone the repository
git clone https://github.com/laraib-sidd/reddit-enhancer.git
cd reddit-enhancer

# Install dependencies with dev tools
make dev

# Copy environment template
cp env.example .env
# Edit .env with your credentials

# Run database migrations
make db-upgrade

# Verify setup
make health
```

## 📁 Project Structure

```
reddit-enhancer/
├── src/
│   ├── domain/          # Pure business logic (entities, value objects)
│   ├── application/     # Use cases and interfaces
│   ├── infrastructure/  # External services (DB, Reddit, AI)
│   ├── cli/            # Command-line interface
│   ├── common/         # Cross-cutting concerns (logging, retry)
│   └── config/         # Configuration management
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── alembic/            # Database migrations
└── internal_docs/      # Architecture documentation
```

## 🔧 Development Workflow

### 1. Create a Branch

```bash
# Always branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
# or: fix/bug-description, chore/task-name, docs/documentation-update
```

### 2. Make Changes

Follow the architecture principles in `.cursorrules`:

- **Domain Layer**: No external dependencies, pure business logic
- **Application Layer**: Use cases orchestrate business logic
- **Infrastructure Layer**: External service implementations
- **All I/O must be async** (`async def`, `await`)

### 3. Run Quality Checks

```bash
# Format and lint
make format
make lint

# Run tests
make test

# Run tests with coverage
make test-cov
```

### 4. Commit Changes

Use conventional commits:

```bash
git commit -m "feat(ai): improve comment generation prompt"
git commit -m "fix(db): handle connection timeout errors"
git commit -m "docs: update README with new commands"
git commit -m "test: add integration tests for Reddit API"
git commit -m "chore: update dependencies"
```

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `test`: Adding tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks
- `style`: Formatting changes

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
# Create PR on GitHub
```

## 📝 Code Standards

### Type Hints

All functions must have type hints:

```python
async def generate_comment(
    self, post: Post, patterns: list[SuccessfulPattern]
) -> str:
    """Generate a comment for the given post."""
    ...
```

### Docstrings

Use Google-style docstrings:

```python
async def fetch_posts(self, subreddit: str, limit: int = 10) -> list[Post]:
    """
    Fetch rising posts from a subreddit.

    Args:
        subreddit: Name of the subreddit (without r/)
        limit: Maximum number of posts to fetch

    Returns:
        List of Post entities

    Raises:
        RedditAPIError: If the API request fails
        RateLimitError: If rate limited

    Example:
        >>> posts = await reader.fetch_posts("AskReddit", limit=5)
        >>> print(posts[0].title)
    """
```

### Error Handling

Use custom exceptions:

```python
from src.common.exceptions import RedditAPIError, RateLimitError

try:
    result = await api_call()
except RateLimitError as e:
    logger.warning("rate_limited", retry_after=e.retry_after)
    raise
except RedditAPIError as e:
    logger.error("api_error", error=str(e))
    raise
```

### Logging

Use structured logging:

```python
from src.common.logging import get_logger

logger = get_logger(__name__)

logger.info("comment.generated", post_id=post.id, length=len(comment))
logger.warning("rate_limit.approaching", remaining=5)
logger.error("api.failed", error=str(e), endpoint=url)
```

## 🧪 Testing

### Unit Tests

```python
# tests/unit/domain/test_example.py
import pytest
from src.domain.entities import Comment

class TestComment:
    def test_approve_changes_status(self):
        comment = Comment(id=1, content="Test", status=CommentStatus.PENDING)
        comment.approve()
        assert comment.status == CommentStatus.APPROVED
```

### Async Tests

```python
import pytest

@pytest.mark.asyncio
async def test_fetch_posts(mock_reddit_client):
    posts = await mock_reddit_client.get_rising_posts("AskReddit")
    assert len(posts) > 0
```

### Running Tests

```bash
make test              # Run all tests
make test-cov          # With coverage report
uv run pytest tests/unit/  # Unit tests only
uv run pytest -k "test_comment"  # Specific tests
```

## 🗄️ Database Changes

### Creating Migrations

```bash
# After modifying models.py
make db-migrate MSG="add user_agent column to posts"
```

### Applying Migrations

```bash
make db-upgrade    # Apply all pending
make db-downgrade  # Rollback last one
```

## 📚 Documentation

- Update `README.md` for user-facing changes
- Update `internal_docs/` for architecture changes
- Add docstrings to all public functions
- Update `.cursorrules` if adding new patterns

## ❓ Questions?

- Check `internal_docs/ARCHITECTURE_REVIEW.md` for design decisions
- Check `internal_docs/QUICK_START.md` for setup help
- Open an issue for questions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

