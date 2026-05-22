from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def agent_tool_call(tool: str, collection: str | None = None, **metadata: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {"tool": tool, "timestamp": now_iso()}
    if collection:
        payload["collection"] = collection
    payload.update(metadata)
    return payload
