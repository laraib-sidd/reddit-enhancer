# Reddit Enhancer Bot - Development Makefile
# Usage: make <target>

.PHONY: help install dev lint format test test-cov clean db-migrate db-upgrade db-downgrade run-test run-manual run-auto health stats seed

# Default target
help:
	@echo "Reddit Enhancer Bot - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup:"
	@echo "  make install      Install production dependencies"
	@echo "  make dev          Install dev dependencies + pre-commit hooks"
	@echo ""
	@echo "Quality:"
	@echo "  make lint         Run ruff linter"
	@echo "  make format       Format code with ruff"
	@echo "  make test         Run all tests"
	@echo "  make test-cov     Run tests with coverage report"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   Create new migration (MSG=description)"
	@echo "  make db-upgrade   Apply all pending migrations"
	@echo "  make db-downgrade Rollback last migration"
	@echo ""
	@echo "Bot Commands:"
	@echo "  make run-test     Run bot in test mode (mock)"
	@echo "  make run-manual   Run bot with Telegram approval"
	@echo "  make run-auto     Run bot in auto-post mode"
	@echo "  make health       Check system health"
	@echo "  make stats        Show database statistics"
	@echo "  make seed         Seed successful patterns"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        Remove cache and build artifacts"

# ============================================
# Setup
# ============================================

install:
	uv sync

dev:
	uv sync --extra dev
	uv run pre-commit install
	@echo "✅ Dev environment ready! Pre-commit hooks installed."

# ============================================
# Code Quality
# ============================================

lint:
	uv run ruff check src/ tests/

format:
	uv run ruff check src/ tests/ --fix
	uv run ruff format src/ tests/

test:
	uv run pytest tests/ -v

test-cov:
	uv run pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html
	@echo "📊 Coverage report: htmlcov/index.html"

# ============================================
# Database
# ============================================

db-migrate:
	@if [ -z "$(MSG)" ]; then \
		echo "❌ Please provide a migration message: make db-migrate MSG='your message'"; \
		exit 1; \
	fi
	uv run alembic revision --autogenerate -m "$(MSG)"

db-upgrade:
	uv run alembic upgrade head

db-downgrade:
	uv run alembic downgrade -1

# ============================================
# Bot Commands
# ============================================

run-test:
	uv run reddit-bot test

run-manual:
	uv run reddit-bot manual

run-auto:
	uv run reddit-bot auto

health:
	uv run reddit-bot health

stats:
	uv run reddit-bot stats

seed:
	uv run reddit-bot seed

# ============================================
# Utilities
# ============================================

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	@echo "🧹 Cleaned up cache and build artifacts"

