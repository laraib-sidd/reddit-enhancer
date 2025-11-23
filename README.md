# Reddit Enhancer

A production-grade Reddit comment bot powered by Claude AI with clean architecture.

## Features

- 🏗️ **Clean Architecture**: Separation of domain, application, and infrastructure layers
- 🤖 **AI-Powered**: Uses Claude AI to generate contextual, high-quality comments
- 📚 **Pattern Learning**: Learns from successful high-karma comments
- 🔄 **Two Modes**: Manual (human-in-the-loop) and automatic operation
- 🔒 **Production Ready**: Structured logging, retry logic, circuit breakers
- 🧪 **Comprehensive Tests**: Unit tests for all layers
- 📊 **PostgreSQL**: Async database support with Supabase

## Architecture

```
src/
├── domain/              # Core business logic (entities, value objects, services)
├── application/         # Use cases and orchestration
├── infrastructure/      # External services (Reddit, AI, Database, Telegram)
├── config/             # Settings and configuration
├── common/             # Shared utilities (logging, exceptions, retry)
└── cli/                # Command-line interface
```

### Design Principles

- **Dependency Inversion**: Core domain has no dependencies on infrastructure
- **Clean Architecture**: Clear separation of concerns across layers
- **Async First**: Fully asynchronous for better performance
- **Production Grade**: Comprehensive error handling, logging, and resilience patterns

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL database (Supabase recommended)
- Reddit API credentials
- Anthropic API key
- Optional: Telegram bot (for manual mode)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd reddit-enhancer
```

2. Install dependencies using UV:
```bash
uv sync
```

3. Copy environment variables:
```bash
cp env.example .env
```

4. Configure `.env` with your credentials:
   - Reddit API credentials (from https://www.reddit.com/prefs/apps)
   - Anthropic API key
   - Supabase connection string
   - Optional: Telegram credentials

5. Initialize the database:
```bash
uv run reddit-bot init
```

## Usage

### Test Mode (Recommended First)

Test the bot with mock Reddit data and real AI generation:

```bash
uv run reddit-bot test
```

This will:
- Use MockRedditClient (no real Reddit API calls)
- Generate comments using Claude AI
- Display results in terminal
- No comments are posted

### Seed Patterns

Before running the bot, seed it with successful comment patterns:

```bash
uv run reddit-bot seed
```

### Manual Mode

Run with human approval via Telegram:

```bash
uv run reddit-bot manual
```

Requires Telegram configuration in `.env`.

### Automatic Mode

Run fully automatically (posts without approval):

```bash
uv run reddit-bot auto
```

⚠️ **Use with caution** - this will automatically post comments to Reddit.

## Configuration

### Environment Variables

See `env.example` for all available configuration options.

Key settings:
- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`: Reddit API credentials
- `REDDIT_USERNAME`, `REDDIT_PASSWORD`: For posting (optional for testing)
- `ANTHROPIC_API_KEY`: Claude AI API key
- `DB_CONNECTION_STRING`: PostgreSQL connection URL (Supabase)
- `TARGET_SUBREDDITS`: Comma-separated list of subreddits to monitor
- `LOG_LEVEL`: INFO, DEBUG, WARNING, ERROR

### Bot Behavior

- `MODE_DELAY_MIN`: Minimum delay between actions (minutes)
- `MODE_DELAY_MAX`: Maximum delay between actions (minutes)
- `TARGET_SUBREDDITS`: Subreddits to monitor

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/unit/domain/test_entities.py
```

### Code Quality

```bash
# Format code
uv run black src tests

# Lint
uv run ruff check src tests
```

## Project Structure

### Domain Layer (`src/domain/`)
- **Entities**: Core business objects (Post, Comment, SuccessfulPattern)
- **Value Objects**: Immutable typed values (PostId, Score, CommentText)
- **Repositories**: Abstract interfaces for data access
- **Services**: Domain services for business logic

### Application Layer (`src/application/`)
- **Use Cases**: Business workflows (GenerateComment, ScanPosts, PostComment)
- **DTOs**: Data transfer objects
- **Interfaces**: Port definitions for external services

### Infrastructure Layer (`src/infrastructure/`)
- **Reddit**: Async Reddit client (reader/writer/mock)
- **AI**: Claude client with retry and circuit breaker
- **Database**: Async SQLAlchemy with repositories
- **Telegram**: Bot handler for manual approval
- **Monitoring**: Structured logging

### CLI (`src/cli/`)
- **Commands**: Typer CLI commands
- **Runner**: Mode runners (manual/auto)
- **Test Flow**: Test script for validation

## Logging

The bot uses structured logging with `structlog`:

```python
logger.info("event_name", key1="value1", key2="value2")
```

Logs are output to stdout in JSON format (production) or pretty console format (development).

## Error Handling

- **Retry Logic**: Automatic retry with exponential backoff for API calls
- **Circuit Breaker**: Prevents cascading failures
- **Custom Exceptions**: Clear exception hierarchy for different error types
- **Graceful Degradation**: Falls back to mock clients when services unavailable

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run tests and linters
4. Submit PR

## License

MIT

## Acknowledgments

- Built with [asyncpraw](https://github.com/praw-dev/asyncpraw) for Reddit API
- Powered by [Anthropic Claude](https://www.anthropic.com/) for AI generation
- Uses [SQLAlchemy](https://www.sqlalchemy.org/) for database operations
