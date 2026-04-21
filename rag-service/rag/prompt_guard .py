import re

_BLOCKED = [
    r"ignore (previous|above|all) instructions",
    r"jailbreak",
    r"act as (dan|evil|unrestricted)",
    r"<script",
    r"system prompt",
]
_COMPILED  = [re.compile(p, re.IGNORECASE) for p in _BLOCKED]
MAX_LENGTH = 300


def sanitise_query(query: str) -> str:
    query = query.strip()

    if len(query) > MAX_LENGTH:
        raise ValueError(f"Query too long ({len(query)} chars, max {MAX_LENGTH})")

    for pattern in _COMPILED:
        if pattern.search(query):
            raise ValueError("Query contains disallowed content")

    query = re.sub(r"<[^>]+>", "", query)
    query = re.sub(r"[^\w\s\-\.,!?&'\"()%$€₹#@+]", "", query)
    query = re.sub(r"\s{2,}", " ", query).strip()

    if not query:
        raise ValueError("Query is empty after sanitisation")

    return query
