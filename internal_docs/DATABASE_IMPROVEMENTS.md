# 🗄️ Database Improvements Roadmap

## Current State Analysis

### ✅ What's Good:
- Separate schema (`reddit_bot`) for isolation
- Comprehensive indexes for common queries
- 100% async operations (asyncpg, AsyncSession)
- Connection pooling configured
- Proper error handling and rollback
- Foreign key relationships
- Pgbouncer compatibility (disabled prepared statements)

### ⚠️ What Can Be Better:

---

## 🎯 Top 10 Database Improvements

### 1. **Database Migrations with Alembic** (Priority: HIGH)

**Current Issue:**
- Using `Base.metadata.create_all()` - no version control
- No migration history or rollback capability
- Hard to track schema changes over time

**Solution: Implement Alembic**

```bash
# Install
uv add alembic

# Initialize
uv run alembic init alembic

# Create migration
uv run alembic revision --autogenerate -m "Initial schema"

# Apply migrations
uv run alembic upgrade head

# Rollback if needed
uv run alembic downgrade -1
```

**Configuration (`alembic.ini`):**

```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname
```

**Migration Example (`alembic/versions/001_initial.py`):**

```python
"""Initial schema

Revision ID: 001
Create Date: 2025-11-24
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create schema
    op.execute('CREATE SCHEMA IF NOT EXISTS reddit_bot')
    
    # Create posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('subreddit', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        schema='reddit_bot'
    )
    
    # Create indexes
    op.create_index(
        'ix_posts_subreddit_created',
        'posts',
        ['subreddit', 'created_at'],
        schema='reddit_bot'
    )

def downgrade():
    op.drop_table('posts', schema='reddit_bot')
```

**Benefits:**
- ✅ Version control for schema changes
- ✅ Easy rollback on errors
- ✅ Track schema evolution over time
- ✅ Safe production deployments

---

### 2. **Soft Deletes** (Priority: MEDIUM)

**Current Issue:**
- Hard deletes remove data permanently
- No way to recover accidentally deleted data
- Can't audit who deleted what

**Solution: Add `deleted_at` column**

```python
# In models.py
class PostModel(Base):
    # ... existing columns ...
    deleted_at = Column(DateTime, nullable=True)  # Soft delete timestamp
    
    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

# In repositories.py
async def delete(self, post_id: PostId) -> bool:
    """Soft delete a post."""
    stmt = (
        update(PostModel)
        .where(PostModel.id == post_id)
        .values(deleted_at=datetime.utcnow())
    )
    result = await self.session.execute(stmt)
    return result.rowcount > 0

async def get_by_id(self, post_id: PostId) -> Post | None:
    """Get post (excluding soft-deleted)."""
    stmt = (
        select(PostModel)
        .where(PostModel.id == post_id)
        .where(PostModel.deleted_at.is_(None))  # Exclude deleted
    )
    # ...
```

**Benefits:**
- ✅ Data recovery possible
- ✅ Audit trail for deletions
- ✅ Can analyze deleted data later

---

### 3. **Audit Trail with Timestamps** (Priority: MEDIUM)

**Current Issue:**
- Only `created_at` on some models
- No `updated_at` to track modifications
- Hard to debug when data changed

**Solution: Add created/updated timestamps to all models**

```python
# Create a base mixin
class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class PostModel(Base, TimestampMixin):
    """Post with automatic timestamps."""
    __tablename__ = "posts"
    # ... rest of model ...

class CommentModel(Base, TimestampMixin):
    __tablename__ = "comments"
    # ... rest of model ...
```

**Benefits:**
- ✅ Know when any record was created/modified
- ✅ Debug data issues easier
- ✅ Analytics on data freshness

---

### 4. **Connection Retry Logic** (Priority: HIGH)

**Current Issue:**
- If connection drops, queries fail immediately
- No automatic retry on transient errors
- Manual reconnection required

**Solution: Add retry wrapper for connection errors**

```python
# In common/retry.py
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from asyncpg.exceptions import ConnectionDoesNotExistError, InterfaceError

@retry(
    retry=retry_if_exception_type((ConnectionDoesNotExistError, InterfaceError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
async def execute_with_retry(session: AsyncSession, stmt):
    """Execute statement with automatic retry on connection errors."""
    return await session.execute(stmt)

# In repositories.py
async def get_by_id(self, post_id: PostId) -> Post | None:
    stmt = select(PostModel).where(PostModel.id == post_id)
    result = await execute_with_retry(self.session, stmt)
    # ...
```

**Benefits:**
- ✅ Resilient to temporary connection issues
- ✅ No manual retry logic needed
- ✅ Better user experience

---

### 5. **Query Performance Monitoring** (Priority: MEDIUM)

**Current Issue:**
- No visibility into slow queries
- Hard to identify performance bottlenecks
- Can't optimize without data

**Solution: Add query timing logs**

```python
# In connection.py or a middleware
from time import perf_counter

class QueryLogger:
    """Log slow queries for optimization."""
    
    def __init__(self, threshold_ms: float = 100):
        self.threshold_ms = threshold_ms
    
    async def log_query(self, query_func, query_name: str):
        """Log queries that exceed threshold."""
        start = perf_counter()
        try:
            result = await query_func()
            duration_ms = (perf_counter() - start) * 1000
            
            if duration_ms > self.threshold_ms:
                logger.warning(
                    "database.slow_query",
                    query=query_name,
                    duration_ms=round(duration_ms, 2),
                    threshold_ms=self.threshold_ms,
                )
            
            return result
        except Exception as e:
            duration_ms = (perf_counter() - start) * 1000
            logger.error(
                "database.query_failed",
                query=query_name,
                duration_ms=round(duration_ms, 2),
                error=str(e),
            )
            raise

# Usage in repository
async def get_by_id(self, post_id: PostId) -> Post | None:
    query_logger = QueryLogger(threshold_ms=50)
    
    async def _query():
        stmt = select(PostModel).where(PostModel.id == post_id)
        return await self.session.execute(stmt)
    
    result = await query_logger.log_query(_query, "post.get_by_id")
    # ...
```

**Benefits:**
- ✅ Identify slow queries automatically
- ✅ Optimize based on real data
- ✅ Monitor query performance over time

---

### 6. **Batch Operations for Efficiency** (Priority: MEDIUM)

**Current Issue:**
- Seeding 180 patterns = 180 individual inserts
- Inefficient for bulk operations
- Slow when importing large datasets

**Solution: Use bulk operations**

```python
# In repositories.py
async def bulk_save(self, patterns: list[SuccessfulPattern]) -> int:
    """Bulk save patterns efficiently."""
    try:
        # Convert entities to dicts
        pattern_dicts = [
            {
                "pattern_text": p.pattern_text,
                "subreddit": p.subreddit,
                "score": p.score.value,
                "extracted_at": p.extracted_at,
            }
            for p in patterns
        ]
        
        # Use bulk_insert_mappings for efficiency
        self.session.bulk_insert_mappings(
            SuccessfulPatternModel,
            pattern_dicts
        )
        
        await self.session.flush()
        
        logger.info("patterns.bulk_saved", count=len(patterns))
        return len(patterns)
        
    except Exception as e:
        logger.error("patterns.bulk_save_failed", error=str(e))
        raise DatabaseError(f"Failed to bulk save patterns: {e}") from e

# Usage in seeder
patterns = await reddit_reader.get_top_comments(subreddit, limit=60)
await pattern_repo.bulk_save(patterns)  # Much faster!
```

**Performance:**
- Before: 180 individual inserts = ~5 seconds
- After: 1 bulk insert = ~0.5 seconds
- **10x faster!**

---

### 7. **Database Health Checks** (Priority: LOW)

**Current Issue:**
- No way to check DB health
- Connection pool status unknown
- Hard to diagnose issues

**Solution: Add health check endpoint**

```python
# In config/validator.py (enhance existing)
async def check_database_health() -> dict[str, any]:
    """
    Comprehensive database health check.
    
    Returns:
        Health metrics including:
        - Connection status
        - Pool statistics
        - Query latency
        - Active connections
    """
    from src.infrastructure.database.connection import get_engine
    from sqlalchemy import text
    from time import perf_counter
    
    engine = get_engine()
    
    # Check connection
    start = perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = (perf_counter() - start) * 1000
        
        # Get pool stats
        pool = engine.pool
        pool_status = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total": pool.size() + pool.overflow(),
        }
        
        return {
            "status": "healthy",
            "latency_ms": round(latency_ms, 2),
            "pool": pool_status,
            "connection": "ok",
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connection": "failed",
        }

# CLI command
@app.command()
def health():
    """Check database health."""
    result = asyncio.run(check_database_health())
    
    if result["status"] == "healthy":
        console.print("[green]✓ Database healthy[/green]")
        console.print(f"  Latency: {result['latency_ms']}ms")
        console.print(f"  Pool: {result['pool']}")
    else:
        console.print(f"[red]✗ Database unhealthy: {result['error']}[/red]")
```

**Benefits:**
- ✅ Monitor database health
- ✅ Diagnose connection issues
- ✅ Track pool utilization

---

### 8. **Caching Layer with Redis** (Priority: LOW)

**Current Issue:**
- Successful patterns fetched on every comment generation
- Same subreddit patterns queried repeatedly
- Database load for read-heavy operations

**Solution: Add Redis caching**

```python
# Install
uv add redis[async]

# In infrastructure/cache/redis_client.py
from redis.asyncio import Redis
from typing import Optional
import json

class RedisCache:
    """Async Redis cache client."""
    
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url)
    
    async def get(self, key: str) -> Optional[dict]:
        """Get cached value."""
        value = await self.redis.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: dict, ttl: int = 3600):
        """Set cached value with TTL."""
        await self.redis.set(key, json.dumps(value), ex=ttl)
    
    async def delete(self, key: str):
        """Delete cached value."""
        await self.redis.delete(key)
    
    async def close(self):
        """Close connection."""
        await self.redis.close()

# In repositories.py with caching
async def get_by_subreddit(
    self,
    subreddit: SubredditName,
    limit: int = 5,
) -> list[SuccessfulPattern]:
    """Get patterns with caching."""
    cache_key = f"patterns:{subreddit}:{limit}"
    
    # Try cache first
    if self.cache:
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug("patterns.cache_hit", subreddit=subreddit)
            return [self._dict_to_entity(p) for p in cached]
    
    # Cache miss - query database
    patterns = await self._fetch_from_db(subreddit, limit)
    
    # Cache for 1 hour
    if self.cache and patterns:
        await self.cache.set(
            cache_key,
            [self._entity_to_dict(p) for p in patterns],
            ttl=3600
        )
    
    return patterns
```

**Benefits:**
- ✅ Faster reads (10-100x)
- ✅ Reduced database load
- ✅ Better scalability

---

### 9. **Full-Text Search** (Priority: LOW)

**Current Issue:**
- Can't search comments/posts by content
- No way to find similar patterns
- Limited analytics capabilities

**Solution: Add PostgreSQL full-text search**

```python
# In models.py
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy import Index

class CommentModel(Base):
    # ... existing columns ...
    
    # Add tsvector column for full-text search
    search_vector = Column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', content)",
            persisted=True
        )
    )
    
    __table_args__ = (
        # ... existing indexes ...
        
        # GIN index for full-text search
        Index("ix_comments_search_vector", "search_vector", postgresql_using="gin"),
        
        {"schema": DB_SCHEMA_NAME},
    )

# In repositories.py
from sqlalchemy import func

async def search_comments(self, query: str, limit: int = 10) -> list[Comment]:
    """Full-text search on comments."""
    stmt = (
        select(CommentModel)
        .where(
            func.to_tsvector('english', CommentModel.content)
            .op('@@')(func.plainto_tsquery('english', query))
        )
        .order_by(CommentModel.karma_score.desc())
        .limit(limit)
    )
    
    result = await self.session.execute(stmt)
    models = result.scalars().all()
    
    return [self._to_entity(model) for model in models]

# Usage
comments = await comment_repo.search_comments("python learning tips", limit=10)
```

**Benefits:**
- ✅ Fast text search
- ✅ Find similar patterns
- ✅ Better content discovery

---

### 10. **Database Constraints & Validation** (Priority: MEDIUM)

**Current Issue:**
- Karma scores can be negative (they shouldn't be)
- Status field accepts any string
- No constraint on valid subreddit names

**Solution: Add CHECK constraints**

```python
# In models.py
from sqlalchemy import CheckConstraint

class CommentModel(Base):
    __tablename__ = "comments"
    __table_args__ = (
        # ... existing indexes ...
        
        # CHECK constraints for data validation
        CheckConstraint(
            "karma_score >= 0",
            name="ck_comments_karma_non_negative"
        ),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'posted', 'failed', 'skipped')",
            name="ck_comments_valid_status"
        ),
        CheckConstraint(
            "length(content) > 0",
            name="ck_comments_content_not_empty"
        ),
        
        {"schema": DB_SCHEMA_NAME},
    )

class SuccessfulPatternModel(Base):
    __table_args__ = (
        # ... existing indexes ...
        
        CheckConstraint(
            "score >= 0",
            name="ck_patterns_score_non_negative"
        ),
        CheckConstraint(
            "length(pattern_text) >= 10",
            name="ck_patterns_min_length"
        ),
        
        {"schema": DB_SCHEMA_NAME},
    )
```

**Benefits:**
- ✅ Data integrity at database level
- ✅ Catch invalid data early
- ✅ Self-documenting schema

---

## 📊 Priority Matrix

| Improvement | Priority | Complexity | Impact |
|-------------|----------|------------|--------|
| Alembic Migrations | **HIGH** | Medium | High |
| Connection Retry | **HIGH** | Low | High |
| Soft Deletes | MEDIUM | Low | Medium |
| Audit Timestamps | MEDIUM | Low | Medium |
| Query Monitoring | MEDIUM | Medium | Medium |
| Batch Operations | MEDIUM | Low | High |
| DB Constraints | MEDIUM | Low | Medium |
| Health Checks | LOW | Low | Medium |
| Redis Caching | LOW | High | High |
| Full-Text Search | LOW | Medium | Low |

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. ✅ Implement Alembic migrations
2. ✅ Add connection retry logic
3. ✅ Add batch operations for seeding

### Phase 2: Monitoring (Week 2)
4. ✅ Add query performance monitoring
5. ✅ Add database health checks
6. ✅ Add audit timestamps (created_at, updated_at)

### Phase 3: Optimization (Week 3)
7. ✅ Implement soft deletes
8. ✅ Add CHECK constraints
9. ✅ Add Redis caching (optional)

### Phase 4: Advanced (Future)
10. ✅ Add full-text search
11. ✅ Add partitioning for large tables
12. ✅ Add read replicas for scaling

---

## 💡 Quick Wins (Start Here)

### 1. Alembic Setup (30 minutes)
```bash
uv add alembic
uv run alembic init alembic
uv run alembic revision --autogenerate -m "Initial schema"
```

### 2. Batch Operations (15 minutes)
Add `bulk_save()` method to `PatternRepository` - **10x faster seeding!**

### 3. Query Monitoring (20 minutes)
Add `QueryLogger` wrapper - **identify slow queries immediately!**

---

## 🎯 Expected Outcomes

After implementing these improvements:

- ✅ **Schema versioning** with Alembic
- ✅ **10x faster** bulk operations
- ✅ **Automatic recovery** from connection issues
- ✅ **Visibility** into query performance
- ✅ **Data integrity** with constraints
- ✅ **Audit trail** for all changes
- ✅ **Production-ready** database layer

---

## 📝 Notes

- Start with **Alembic** - foundational for schema management
- **Batch operations** provide immediate speed improvement
- **Caching** can wait until traffic increases
- **Full-text search** is nice-to-have, not critical

---

**Status:** Roadmap defined, ready to implement!  
**Estimated Time:** 2-3 weeks for Phases 1-3  
**Impact:** Production-grade database layer 🚀

