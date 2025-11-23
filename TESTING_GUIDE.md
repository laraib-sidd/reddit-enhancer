# Testing Guide

## Prerequisites

✅ You've already:
- Committed the new code
- Updated `.env` with your credentials

## Test Commands (in order)

### 1. Initialize Database

First, create the database tables in Supabase:

```bash
uv run reddit-bot init
```

**Expected output:**
```
Initializing database...
✓ Database initialized successfully!
```

This creates three tables:
- `posts` - Reddit posts
- `comments` - Generated comments
- `successful_patterns` - Learned patterns

---

### 2. Test Mode (Mock Reddit + Real AI)

Test the bot without making real Reddit API calls:

```bash
uv run reddit-bot test
```

**What this does:**
- ✅ Uses MockRedditClient (no Reddit API needed)
- ✅ Generates 3 fake Reddit posts
- ✅ Calls Claude AI to generate real comments
- ✅ Displays everything beautifully in terminal
- ✅ Does NOT post to Reddit

**Expected output:**
```
🧪 Test Flow - Mock Reddit + Real AI

1. Fetching mock Reddit posts...
✓ Found 3 mock posts

============================================================
Post 1/3

📝 Reddit Post
Title: What is the best programming language to learn in 2025?
Subreddit: r/AskReddit
Content: I want to start coding but don't know where to begin.
URL: https://reddit.com/r/AskReddit/test

2. Generating AI comment...
✓ Comment generated!

💬 Generated Comment
[Your AI-generated comment appears here]

Comment length: 150 characters
Status: pending

============================================================
[... 2 more posts ...]

✓ Test flow complete!

This test used:
  • Mock Reddit client (no API calls)
  • Real Claude AI (actual API calls)
  • No comments were posted to Reddit
```

---

### 3. Run Unit Tests (Optional)

Verify all 36 unit tests pass:

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run with coverage report
uv run pytest --cov=src --cov-report=html
```

**Expected output:**
```
============================= test session starts ==============================
...
collected 36 items

tests/unit/domain/test_entities.py ............ [ 33%]
tests/unit/domain/test_value_objects.py ......... [ 58%]
tests/unit/domain/test_services.py ......... [ 80%]
tests/unit/application/test_use_cases.py .... [ 91%]
tests/unit/infrastructure/test_mock_reddit.py .... [100%]

============================== 36 passed in 0.97s =============================
```

---

## What Each Command Does

| Command | What It Tests | Needs Reddit Credentials? | Makes Real API Calls? |
|---------|---------------|---------------------------|------------------------|
| `init` | Database setup | ❌ No | ✅ Yes (Supabase) |
| `test` | Mock Reddit + Real AI | ❌ No | ✅ Yes (Claude only) |
| `pytest` | Unit tests | ❌ No | ❌ No |

---

## Common Issues & Solutions

### Issue: "Failed to load settings"
**Solution:** Make sure your `.env` has:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key
DB_CONNECTION_STRING=postgresql://postgres:password@db.ref.supabase.co:5432/postgres
```

### Issue: "Database connection failed"
**Solution:** Check your Supabase connection string is correct:
1. Go to Supabase Dashboard
2. Project Settings → Database
3. Copy the connection string
4. Make sure it starts with `postgresql://`

### Issue: "AI generation failed"
**Solution:** Verify your Anthropic API key:
1. Go to https://console.anthropic.com/
2. Get your API key
3. Make sure it starts with `sk-ant-`

---

## After Testing Successfully

Once `test` command works, you can try:

### Seed Patterns (Requires Reddit Credentials)

Fetch successful comments from Reddit to learn from:

```bash
uv run reddit-bot seed
```

Needs in `.env`:
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

### Manual Mode (Requires Reddit + Telegram)

Run with human approval via Telegram:

```bash
uv run reddit-bot manual
```

Needs in `.env`:
```bash
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Auto Mode (Fully Automatic) ⚠️

Automatically posts comments:

```bash
uv run reddit-bot auto
```

⚠️ **Use with caution** - this posts to Reddit automatically!

---

## Quick Verification Checklist

Before running tests:

- [ ] `.env` file exists with your credentials
- [ ] `ANTHROPIC_API_KEY` is set
- [ ] `DB_CONNECTION_STRING` is set
- [ ] Dependencies installed (`uv sync` was run)

Then run in order:
1. [ ] `uv run reddit-bot init` ✅
2. [ ] `uv run reddit-bot test` ✅
3. [ ] `uv run pytest` (optional) ✅

---

## Success Indicators

You know it's working when you see:

1. **Init command:** "✓ Database initialized successfully!"
2. **Test command:** You see 3 mock posts with AI-generated comments
3. **Pytest:** "36 passed in X.XXs"

🎉 If all three work, your bot is production-ready!

---

## AI Model Configuration

The AI model is now hardcoded in `src/config/constants.py`:

```python
DEFAULT_AI_MODEL = "claude-3-5-sonnet-20241022"  # Latest stable Claude 3.5 Sonnet
```

This ensures everyone uses the same tested model version. To change it, edit the constant (not `.env`).

