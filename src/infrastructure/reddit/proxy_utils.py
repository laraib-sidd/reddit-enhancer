"""Proxy utilities for Reddit API clients.

Shared module for proxy configuration to avoid DRY violations.
"""

import aiohttp

from src.common.logging import get_logger

logger = get_logger(__name__)


def create_proxy_session(proxy_url: str | None) -> aiohttp.ClientSession | None:
    """
    Create an aiohttp session with SOCKS5 proxy support.

    Args:
        proxy_url: Proxy URL (socks5://user:pass@host:port)

    Returns:
        aiohttp.ClientSession with proxy configured, or None if:
        - No proxy URL provided
        - Proxy is HTTP (handled differently by asyncpraw)
        - aiohttp-socks not installed

    Note:
        HTTP proxies are NOT handled here - they use asyncpraw's
        environment variable approach. Only SOCKS5 proxies use
        this custom session.
    """
    if not proxy_url:
        return None

    # Only handle SOCKS proxies here
    if not proxy_url.startswith("socks"):
        return None

    try:
        from aiohttp_socks import ProxyConnector

        connector = ProxyConnector.from_url(proxy_url)
        return aiohttp.ClientSession(connector=connector)

    except ImportError:
        logger.warning(
            "reddit.proxy_socks_unavailable",
            message="aiohttp-socks not installed. SOCKS proxy will not work.",
            hint="Run: uv add aiohttp-socks",
        )
        return None
    except Exception as e:
        logger.warning(
            "reddit.proxy_session_failed",
            error=str(e),
            message="Failed to create proxy session. Continuing without proxy.",
        )
        return None
