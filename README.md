# Reddit Karma Assistant 🤖

An intelligent Reddit bot that generates natural, context-aware comments using Claude AI and learns from successful Reddit patterns.

## ✨ Features

- 🧠 **AI-Powered Comments**: Uses Claude 3.5 Sonnet for natural, engaging responses
- 📚 **RAG Learning**: Learns from successful Reddit comments (6K+ upvotes)
- 🏗️ **Clean Architecture**: Domain-driven design with proper separation of concerns
- ⚡ **Full Async**: Production-ready async implementation
- 🔒 **Type-Safe Config**: Pydantic-validated settings with secrets management
- 📊 **Clean Logging**: Compact, readable logs with structured data
- 🔄 **Retry & Circuit Breakers**: Resilient API handling
- 🗃️ **PostgreSQL**: Uses Supabase with dedicated schema and indexes
- 📱 **Telegram Integration**: Manual approval workflow via Telegram bot
- 🧪 **Comprehensive Tests**: Unit tests for all core components

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) package manager
- Supabase account
- Anthropic API key
- Reddit app credentials

### 2. Setup

```bash
# Clone and navigate to the repository
cd reddit-enhancer

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Install dependencies
uv sync
```

### 3. Initialize Database

```bash
uv run reddit-bot init
```

Creates the `reddit_bot` schema with tables and performance indexes.

### 4. Seed Patterns (Recommended)

```bash
uv run reddit-bot seed
```

Fetches successful Reddit comments for the AI to learn from.

### 5. Test the Bot

```bash
uv run reddit-bot test
```

Tests comment generation with mock posts and real AI.

## 📋 Commands

| Command | Description |
|---------|-------------|
| `uv run reddit-bot init` | Initialize database schema and tables |
| `uv run reddit-bot seed` | Seed successful Reddit patterns |
| `uv run reddit-bot test` | Test with mock data (safe, no posting) |
| `uv run reddit-bot manual` | Manual mode with Telegram approval |
| `uv run reddit-bot auto` | Fully automated mode ⚠️ |

## 🏗️ Architecture

```
src/
├── domain/              # Core business logic
│   ├── entities.py      # Post, Comment, SuccessfulPattern
│   ├── value_objects.py # Type-safe value objects
│   ├── repositories.py  # Repository interfaces
│   └── services.py      # Domain services
│
├── application/         # Use cases & DTOs
│   ├── dtos.py          # Data transfer objects
│   ├── interfaces.py    # Application interfaces
│   └── use_cases/       # Business operations
│       ├── generate_comment.py
│       ├── scan_posts.py
│       └── post_comment.py
│
├── infrastructure/      # External integrations
│   ├── reddit/          # Reddit API (read/write separated)
│   ├── ai/              # Claude AI integration
│   ├── database/        # PostgreSQL repositories
│   └── telegram/        # Telegram bot
│
├── config/              # Configuration management
│   ├── settings.py      # Pydantic settings
│   └── constants.py     # App constants
│
├── common/              # Shared utilities
│   ├── exceptions.py    # Custom exceptions
│   ├── logging.py       # Clean structured logging
│   ├── retry.py         # Retry decorators
│   └── circuit_breaker.py
│
└── cli/                 # Command-line interface
    ├── runner.py        # Main CLI app
    ├── commands.py      # Command implementations
    ├── seeder.py        # Pattern seeding
    └── test_flow.py     # Test workflow
```

## 📊 Logging

The bot uses **clean, colorful, compact logging** that's easy to read:

```
🟢 [INFO] bot.starting | version='0.2.0' environment='development'
🟢 [INFO] database.connected | schema='reddit_bot' tables=3
🟢 [INFO] reddit.posts_fetched | count=5
🟢 [INFO] ai.comment_generated | length=287 tokens_used=450
🟡 [WARNING] reddit.rate_limit | retry_after=60
🔴 [ERROR] api.failed | error='Connection timeout'
```

**Features:**
- ✅ Color-coded log levels (Green/Yellow/Red)
- ✅ No extra spaces or timestamps
- ✅ Bold event names for easy scanning
- ✅ Dimmed keys with bright values
- ✅ Passwords automatically masked

**Production mode** outputs structured JSON:
```json
{"event": "bot.starting", "version": "0.2.0", "level": "info", "timestamp": "2025-11-24T05:33:00Z"}
```

## 🗄️ Database Schema

**Schema**: `reddit_bot`

**Tables**:
- `posts` - Reddit posts being tracked
- `comments` - Generated comments and their status
- `successful_patterns` - High-karma comments for learning

**Indexes**: 11 performance indexes for optimal query performance

## 🔧 Configuration

### Environment Variables

```ini
# AI
ANTHROPIC_API_KEY=sk-ant-your-key

# Database (Supabase - use Session Pooler)
DB_CONNECTION_STRING=postgresql://...

# Reddit
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=your_username  # For posting
REDDIT_PASSWORD=your_password  # For posting
REDDIT_USER_AGENT="python:reddit-enhancer:v0.2.0 (by /u/yourname)"

# Telegram (Optional - for manual approval)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=123456789

# Bot Configuration
TARGET_SUBREDDITS=AskReddit,NoStupidQuestions,explainlikeimfive
MODE_DELAY_MIN=5    # Minutes
MODE_DELAY_MAX=30   # Minutes

# Logging
LOG_LEVEL=INFO
JSON_LOGS=false
ENVIRONMENT=development
```

### AI Model Configuration

Edit `src/config/constants.py`:

```python
DEFAULT_AI_MODEL = "claude-3-5-sonnet-20241022"
DEFAULT_AI_MAX_TOKENS = 300
DEFAULT_AI_TEMPERATURE = 0.7
```

## 🧪 Testing

```bash
# Run all tests
uv run pytest

# With coverage
uv run pytest --cov=src --cov-report=html

# Test logging
uv run python test_logging.py

# Test bot flow
uv run reddit-bot test
```

## 🔐 Security

- ✅ Secrets in `.env` (never committed)
- ✅ Passwords masked in logs
- ✅ Type-safe config with Pydantic
- ✅ Read-only Reddit mode for scraping
- ✅ Separate read/write Reddit clients

## 🎯 Use Cases

### Read-Only Mode (No Credentials Needed)
Use `seed` and `test` commands with just app credentials:
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

### Write Mode (Full Credentials Required)
Use `manual` and `auto` modes (posts to Reddit):
- All read-only credentials
- Plus: `REDDIT_USERNAME` and `REDDIT_PASSWORD`

## 🚨 Important Notes

### Supabase Configuration
⚠️ **Use Session Pooler, not Transaction Pooler!**

In Supabase Dashboard:
1. Go to Database → Connection Pooling
2. Select "Session" pooler
3. Use that connection string in `.env`

This prevents `DuplicatePreparedStatementError` with SQLAlchemy.

### Reddit API
- Read operations only need app credentials
- Write operations need username/password
- Respect Reddit's rate limits
- Follow subreddit rules

## 🎨 Customization

### Modify AI Prompts
Edit `src/infrastructure/ai/prompt_builder.py` to change comment style.

### Add Subreddits
Update `TARGET_SUBREDDITS` in `.env`.

### Adjust Timing
Change `MODE_DELAY_MIN` and `MODE_DELAY_MAX` for auto mode.

## 📊 Monitoring

View logs:
```bash
# Clean, compact logs
uv run reddit-bot auto

# JSON logs (for production)
JSON_LOGS=true uv run reddit-bot auto
```

Check database:
```bash
# Connect to Supabase and query:
SELECT * FROM reddit_bot.comments WHERE status = 'posted';
SELECT AVG(karma_score) FROM reddit_bot.comments WHERE status = 'posted';
```

## 🤝 Contributing

1. Follow clean architecture principles
2. Add tests for new features
3. Use structured logging
4. Type-hint everything
5. Update documentation

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues:
1. Review colorful structured logs
2. Verify `.env` configuration
3. Check Supabase pooler mode (must be "Session" not "Transaction")
4. Ensure all required environment variables are set

## 🎉 Acknowledgments

- Built with [Claude](https://anthropic.com) by Anthropic
- Uses [asyncpraw](https://asyncpraw.readthedocs.io/) for Reddit API
- Database powered by [Supabase](https://supabase.com)
- Package management by [uv](https://github.com/astral-sh/uv)

---

**Ready to enhance your Reddit karma!** 🚀

```bash
uv run reddit-bot test  # Start here!
```

