import json
import time
from collections.abc import Callable
from typing import Any

from langchain.tools import tool
from tavily import TavilyClient

from src.config import get_app_config


def _get_tavily_client(tool_name: str) -> TavilyClient:
    config = get_app_config().get_tool_config(tool_name)
    api_key = None
    if config is not None and "api_key" in config.model_extra:
        api_key = config.model_extra.get("api_key")
    return TavilyClient(api_key=api_key)


def _get_retry_settings(tool_name: str) -> tuple[int, float]:
    attempts = 3
    delay_seconds = 0.8
    config = get_app_config().get_tool_config(tool_name)

    if config is not None and "retry_attempts" in config.model_extra:
        attempts = int(config.model_extra.get("retry_attempts") or attempts)
    if config is not None and "retry_initial_delay_seconds" in config.model_extra:
        delay_seconds = float(
            config.model_extra.get("retry_initial_delay_seconds") or delay_seconds
        )

    return max(1, attempts), max(0.1, delay_seconds)


def _is_transient_network_error(exc: Exception) -> bool:
    message = str(exc).lower()
    transient_markers = (
        "ssl",
        "ssleoferror",
        "unexpected_eof_while_reading",
        "httpsconnectionpool",
        "max retries exceeded",
        "connection reset",
        "connection aborted",
        "temporarily unavailable",
        "timeout",
    )
    return any(marker in message for marker in transient_markers)


def _call_tavily_with_retry(
    func: Callable[[], Any],
    *,
    operation: str,
    attempts: int,
    initial_delay_seconds: float,
) -> Any:
    delay_seconds = initial_delay_seconds
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            return func()
        except Exception as exc:
            last_error = exc
            if attempt >= attempts or not _is_transient_network_error(exc):
                break
            time.sleep(delay_seconds)
            delay_seconds *= 2

    return {
        "error": f"{operation} failed after {attempts} attempts: {last_error}",
    }


@tool("web_search", parse_docstring=True)
def web_search_tool(query: str) -> str:
    """Search the web.

    Args:
        query: The query to search for.
    """
    config = get_app_config().get_tool_config("web_search")
    max_results = 5
    if config is not None and "max_results" in config.model_extra:
        max_results = config.model_extra.get("max_results")

    client = _get_tavily_client("web_search")
    retry_attempts, retry_delay_seconds = _get_retry_settings("web_search")
    res = _call_tavily_with_retry(
        lambda: client.search(query, max_results=max_results),
        operation="web_search",
        attempts=retry_attempts,
        initial_delay_seconds=retry_delay_seconds,
    )
    if "error" in res:
        return f"Error: {res['error']}"
    normalized_results = [
        {
            "title": result["title"],
            "url": result["url"],
            "snippet": result["content"],
        }
        for result in res["results"]
    ]
    json_results = json.dumps(normalized_results, indent=2, ensure_ascii=False)
    return json_results


@tool("web_fetch", parse_docstring=True)
def web_fetch_tool(url: str) -> str:
    """Fetch the contents of a web page at a given URL.
    Only fetch EXACT URLs that have been provided directly by the user or have been returned in results from the web_search and web_fetch tools.
    This tool can NOT access content that requires authentication, such as private Google Docs or pages behind login walls.
    Do NOT add www. to URLs that do NOT have them.
    URLs must include the schema: https://example.com is a valid URL while example.com is an invalid URL.

    Args:
        url: The URL to fetch the contents of.
    """
    client = _get_tavily_client("web_fetch")
    retry_attempts, retry_delay_seconds = _get_retry_settings("web_fetch")
    res = _call_tavily_with_retry(
        lambda: client.extract([url]),
        operation="web_fetch",
        attempts=retry_attempts,
        initial_delay_seconds=retry_delay_seconds,
    )
    if "error" in res:
        return f"Error: {res['error']}"
    if "failed_results" in res and len(res["failed_results"]) > 0:
        return f"Error: {res['failed_results'][0]['error']}"
    elif "results" in res and len(res["results"]) > 0:
        result = res["results"][0]
        return f"# {result['title']}\n\n{result['raw_content'][:4096]}"
    else:
        return "Error: No results found"
