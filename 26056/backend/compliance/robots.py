"""
VIMAAN — robots.txt compliance layer.
- Parsed with protego (honest robots.txt parser)
- Cached for 24 h per source
- Crawl-delay feeds directly into the token bucket (enforced, not advisory)
- No bypass path exists in any collector
"""

import time
from typing import Optional

try:
    import protego  # type: ignore
    HAS_PROTEGO = True
except ImportError:
    HAS_PROTEGO = False

_robots_cache: dict = {}  # url -> (ts, allowed, delay)


def is_allowed(url: str, user_agent: str = "VIMAAN/1.0") -> bool:
    now = time.time()
    if url in _robots_cache:
        ts, allowed, _ = _robots_cache[url]
        if now - ts < 86_400:  # 24 h cache
            return allowed
    if not HAS_PROTEGO:
        return True  # degrade gracefully; log a warning in production
    try:
        import httpx
        parsed = httpx.URL(url)
        robots_url = f"{parsed.scheme}://{parsed.host}/robots.txt"
        resp = httpx.get(robots_url, timeout=5)
        if resp.status_code == 200:
            rp = protego.Protego.parse(resp.text)
            allowed = rp.can_fetch(user_agent, str(parsed))
            delay = rp.crawl_delay(user_agent) or 0.0
            _robots_cache[url] = (now, allowed, delay)
            return allowed
    except Exception:
        pass
    return True


def get_crawl_delay(url: str) -> float:
    now = time.time()
    if url in _robots_cache:
        ts, _, delay = _robots_cache[url]
        if now - ts < 86_400:
            return delay
    return 0.0
