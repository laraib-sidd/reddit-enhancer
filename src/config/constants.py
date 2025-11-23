"""Application constants."""

# Application
APP_NAME = "reddit-enhancer"
APP_VERSION = "0.2.0"

# Reddit API
REDDIT_API_RATE_LIMIT = 60  # requests per minute
REDDIT_USER_AGENT_FORMAT = "python:{app}:v{version} (by /u/{username})"

# AI Generation
DEFAULT_AI_MODEL = "claude-sonnet-4-5-20250929"  # Latest Claude Sonnet 4.5 (Sept 2025)
MAX_COMMENT_TOKENS = 300
AI_TEMPERATURE = 0.7

# Database
DB_POOL_SIZE = 5
DB_MAX_OVERFLOW = 10
DB_POOL_TIMEOUT = 30

# Retry Configuration
MAX_RETRY_ATTEMPTS = 3
MIN_RETRY_WAIT_SECONDS = 1
MAX_RETRY_WAIT_SECONDS = 60

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD = 5
CIRCUIT_BREAKER_TIMEOUT = 60

# Auto Mode Delays (in seconds)
DEFAULT_MIN_DELAY = 300  # 5 minutes
DEFAULT_MAX_DELAY = 1800  # 30 minutes
SCAN_CYCLE_DELAY = 900  # 15 minutes

# Telegram
TELEGRAM_APPROVAL_TIMEOUT = 300  # 5 minutes

