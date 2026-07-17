#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class ErrorClassification:
    source: str
    error_class: str
    code: str
    meaning: str


def _source(text: str) -> str:
    lowered = text.lower()
    if "openrouter" in lowered or "openrouter.ai" in lowered:
        return "openrouter"
    if "anthropic" in lowered or "claude" in lowered:
        return "anthropic"
    if "gemini" in lowered or "googleapis" in lowered:
        return "gemini"
    if "mysql" in lowered or re.search(r"\b(?:1205|1213|2003|2006|2013)\b", lowered):
        return "mysql"
    return "unknown"


def classify_error(sample: str) -> ErrorClassification:
    text = " ".join(str(sample or "").split())
    lowered = text.lower()
    source = _source(text)

    mysql_codes = {
        "1205": ("lock_wait_timeout", "lock wait timed out"),
        "1213": ("deadlock", "transaction deadlock"),
        "2003": ("connection_failed", "cannot connect to MySQL server"),
        "2006": ("server_gone", "MySQL server connection disappeared"),
        "2013": ("connection_lost", "MySQL connection was lost during the query"),
    }
    mysql_match = re.search(r"(?:error\s+|\b)(1205|1213|2003|2006|2013)\b", lowered)
    if mysql_match:
        code = mysql_match.group(1)
        error_class, meaning = mysql_codes[code]
        return ErrorClassification("mysql", error_class, f"MYSQL_{code}", meaning)

    http_match = re.search(r"(?:status|code|http(?:\s+error)?)\s*[=:]?\s*(\d{3})\b", lowered)
    http_code = http_match.group(1) if http_match else ""
    if http_code == "402" or "requires more credits" in lowered or "insufficient credit" in lowered:
        return ErrorClassification(source if source != "unknown" else "provider", "insufficient_credits", "HTTP_402", "provider credit or affordable max-token limit exceeded")
    if http_code in {"408", "504"}:
        return ErrorClassification(source if source != "unknown" else "provider", "request_timeout", f"HTTP_{http_code}", "provider request timed out")
    if http_code == "429":
        return ErrorClassification(source if source != "unknown" else "provider", "rate_limited", "HTTP_429", "provider rate limit exceeded")
    if http_code in {"500", "502", "503", "529"}:
        return ErrorClassification(source if source != "unknown" else "provider", "upstream_error", f"HTTP_{http_code}", "provider upstream service error")
    if "timeout" in lowered or "timed out" in lowered:
        return ErrorClassification(source, "request_timeout", "TIMEOUT", "request exceeded its time limit")
    if any(marker in lowered for marker in ("connection refused", "connection reset", "name or service not known", "temporary failure in name resolution")):
        return ErrorClassification(source, "connection_error", "NETWORK", "network connection or name resolution failed")
    if any(marker in lowered for marker in ("no parseable structured output", "json_parse_ok=n", "empty response")):
        return ErrorClassification(source, "invalid_response", "PARSE", "provider response was empty or not parseable")
    return ErrorClassification(source, "unknown_error", http_code and f"HTTP_{http_code}" or "UNKNOWN", "unclassified error; inspect latest run sample")


def main() -> int:
    result = classify_error(" ".join(sys.argv[1:]))
    print("\t".join((result.source, result.error_class, result.code, result.meaning)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
