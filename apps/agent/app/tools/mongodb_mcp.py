from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import timedelta
import json
import os
import re
from dataclasses import dataclass
from typing import Any

from app.services.audit_logger import agent_tool_call


@dataclass(frozen=True)
class MongoMcpConfig:
    command: str
    args: list[str]
    env: dict[str, str]
    read_only: bool


def get_mongodb_mcp_config(read_only: bool | None = None) -> MongoMcpConfig | None:
    connection_string = os.getenv("MDB_MCP_CONNECTION_STRING") or os.getenv("MONGODB_URI")
    if not connection_string:
        return None

    if read_only is None:
        read_only = os.getenv("MDB_MCP_READ_ONLY", "false").lower() == "true"

    command = os.getenv("MDB_MCP_COMMAND", "npx")
    args = os.getenv("MDB_MCP_ARGS")
    command_name = os.path.basename(command)
    if args:
        arg_list = args.split()
    elif command_name == "npx":
        arg_list = ["-y", "mongodb-mcp-server@latest"]
    else:
        arg_list = []

    if read_only and "--readOnly" not in arg_list:
        arg_list.append("--readOnly")

    env = {
        "MDB_MCP_CONNECTION_STRING": connection_string,
        "MDB_MCP_READ_ONLY": "true" if read_only else "false",
    }
    if os.path.isabs(command):
        command_dir = os.path.dirname(command)
        env["PATH"] = f"{command_dir}{os.pathsep}{os.getenv('PATH', '')}"

    for key in (
        "MDB_MCP_API_CLIENT_ID",
        "MDB_MCP_API_CLIENT_SECRET",
        "MDB_MCP_DISABLED_TOOLS",
        "MDB_MCP_LOGGERS",
        "MDB_MCP_LOG_PATH",
    ):
        value = os.getenv(key)
        if value:
            env[key] = value

    return MongoMcpConfig(command=command, args=arg_list, env=env, read_only=read_only)


def build_mongodb_mcp_toolset(read_only: bool | None = None) -> Any | None:
    """Build the ADK MCP toolset for MongoDB.

    The service uses direct MongoDB writes for predictable demo transactions, while this toolset
    is attached to the ADK agent so the agent has the official MongoDB MCP integration path.
    """
    config = get_mongodb_mcp_config(read_only=read_only)
    if not config:
        return None

    try:
        from google.adk.tools.mcp_tool import McpToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
        from mcp import StdioServerParameters
    except Exception:
        return None

    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=config.command,
                args=config.args,
                env=config.env,
            ),
            timeout=30,
        )
    )


def mcp_status() -> dict[str, Any]:
    config = get_mongodb_mcp_config()
    return {
        "configured": config is not None,
        "server": "mongodb-mcp-server",
        "transport": "stdio",
        "runtimeUse": "MCP-first care-memory reads for summaries and emergency context",
        "command": config.command if config else None,
        "args": config.args if config else [],
        "readOnly": config.read_only if config else None,
        "envKeys": sorted(config.env.keys()) if config else [],
    }


def _extract_json_from_text(text: str) -> Any:
    cleaned = text.strip()
    if not cleaned:
        return None

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    for pattern in (r"(\[[\s\S]*\])", r"(\{[\s\S]*\})"):
        match = re.search(pattern, cleaned)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    return None


def _documents_from_tool_result(result: Any) -> list[dict[str, Any]]:
    structured = getattr(result, "structuredContent", None)
    candidates: list[Any] = []
    if structured is not None:
        candidates.append(structured)

    for content in getattr(result, "content", []) or []:
        text = getattr(content, "text", None)
        if text:
            parsed = _extract_json_from_text(text)
            if parsed is not None:
                candidates.append(parsed)

    for candidate in candidates:
        if isinstance(candidate, list):
            return [item for item in candidate if isinstance(item, dict)]
        if isinstance(candidate, dict):
            for key in ("documents", "results", "items", "data"):
                value = candidate.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
            if candidate:
                return [candidate]
    return []


def _oid_filter(document_id: str) -> dict[str, Any]:
    if re.fullmatch(r"[0-9a-fA-F]{24}", str(document_id)):
        return {"_id": {"$oid": str(document_id)}}
    return {"_id": document_id}


def _json_id(value: Any) -> str:
    if isinstance(value, dict):
        for key in ("$oid", "oid"):
            if key in value:
                return str(value[key])
    return str(value)


def _normalize_mcp_value(value: Any) -> Any:
    if isinstance(value, list):
        return [_normalize_mcp_value(item) for item in value]
    if isinstance(value, dict):
        if set(value.keys()) == {"$oid"}:
            return str(value["$oid"])
        if set(value.keys()) == {"$date"}:
            return value["$date"]
        return {key: _normalize_mcp_value(item) for key, item in value.items()}
    return value


def _normalize_mcp_docs(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [_normalize_mcp_value(doc) for doc in docs]


def _walk_exception_tree(exc: BaseException) -> list[BaseException]:
    children = getattr(exc, "exceptions", None)
    if not children:
        return [exc]

    items: list[BaseException] = []
    for child in children:
        items.extend(_walk_exception_tree(child))
    return items or [exc]


def _exception_text(exc: BaseException) -> str:
    parts = []
    for item in _walk_exception_tree(exc):
        message = str(item)
        parts.append(f"{item.__class__.__name__}: {message}" if message else item.__class__.__name__)
    return "; ".join(parts)


def _is_stdio_close_noise(exc: BaseException) -> bool:
    return any(item.__class__.__name__ == "BrokenResourceError" for item in _walk_exception_tree(exc))


class MongoMcpRuntime:
    """Small MCP client for real MongoDB MCP database tool calls."""

    def __init__(self, read_only: bool = True) -> None:
        self.config = get_mongodb_mcp_config(read_only=read_only)
        self.db_name = os.getenv("MONGODB_DB", "pet_guardian")

    @property
    def configured(self) -> bool:
        return self.config is not None

    async def _call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        timeout = float(os.getenv("MDB_MCP_TIMEOUT_SECONDS", "8"))
        return await asyncio.wait_for(self._call_tool_inner(tool_name, arguments), timeout=timeout)

    async def _call_tool_inner(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        if self.config is None:
            raise RuntimeError("MongoDB MCP is not configured")

        try:
            async with self._client_session() as session:
                return await self._call_tool_in_session(session, tool_name, arguments)
        except Exception as exc:
            raise RuntimeError(f"MongoDB MCP tool {tool_name} failed: {_exception_text(exc)}") from exc

    @asynccontextmanager
    async def _client_session(self) -> Any:
        if self.config is None:
            raise RuntimeError("MongoDB MCP is not configured")

        try:
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client
        except Exception as exc:
            raise RuntimeError("Python MCP client is not installed") from exc

        env = os.environ.copy()
        env.update(self.config.env)
        server_params = StdioServerParameters(
            command=self.config.command,
            args=self.config.args,
            env=env,
        )

        async with stdio_client(server_params) as (read_stream, write_stream):
            async with ClientSession(
                read_stream,
                write_stream,
                read_timeout_seconds=timedelta(seconds=float(os.getenv("MDB_MCP_READ_TIMEOUT_SECONDS", "8"))),
            ) as session:
                await session.initialize()
                yield session

    async def _call_tool_in_session(self, session: Any, tool_name: str, arguments: dict[str, Any]) -> Any:
        timeout = float(os.getenv("MDB_MCP_TIMEOUT_SECONDS", "8"))
        try:
            return await asyncio.wait_for(session.call_tool(tool_name, arguments), timeout=timeout)
        except Exception as exc:
            raise RuntimeError(f"MongoDB MCP tool {tool_name} failed: {_exception_text(exc)}") from exc

    async def find(
        self,
        collection: str,
        filter: dict[str, Any] | None = None,
        limit: int = 50,
        sort: dict[str, Any] | None = None,
        session: Any | None = None,
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        arguments: dict[str, Any] = {
            "database": self.db_name,
            "collection": collection,
            "filter": filter or {},
            "limit": limit,
            "responseBytesLimit": 1_048_576,
        }
        if sort:
            arguments["sort"] = sort

        result = (
            await self._call_tool_in_session(session, "find", arguments)
            if session is not None
            else await self._call_tool("find", arguments)
        )
        if getattr(result, "isError", False):
            raise RuntimeError(f"MongoDB MCP find failed for {collection}")

        docs = _normalize_mcp_docs(_documents_from_tool_result(result))
        return docs, agent_tool_call(
            "mongodb_mcp.find",
            collection,
            mode="mcp_server",
            database=self.db_name,
            filter=filter or {},
        )

    async def find_one_by_id(
        self,
        collection: str,
        document_id: str,
        session: Any | None = None,
    ) -> tuple[dict[str, Any] | None, dict[str, Any]]:
        docs, call = await self.find(collection, _oid_filter(document_id), limit=1, session=session)
        if docs:
            return docs[0], call

        docs, call = await self.find(collection, {"_id": document_id}, limit=1, session=session)
        return (docs[0] if docs else None), call

    async def get_plan_context(self, plan_id: str) -> dict[str, Any]:
        context: dict[str, Any] | None = None
        try:
            async with self._client_session() as session:
                context = await self._get_plan_context(plan_id, session)
        except Exception as exc:
            if context is not None and _is_stdio_close_noise(exc):
                return context
            raise

        return context

    async def _get_plan_context(self, plan_id: str, session: Any) -> dict[str, Any]:
        tool_calls: list[dict[str, Any]] = []

        plan, call = await self.find_one_by_id("carePlans", plan_id, session=session)
        tool_calls.append(call)
        if not plan:
            raise KeyError(f"Care plan {plan_id} not found through MongoDB MCP")

        plan_id_value = _json_id(plan.get("_id", plan_id))
        dog, call = await self.find_one_by_id("dogs", _json_id(plan["dogId"]), session=session)
        tool_calls.append(call)
        if not dog:
            raise KeyError(f"Dog {plan['dogId']} not found through MongoDB MCP")

        tasks, call = await self.find(
            "careTasks",
            {"planId": plan_id_value},
            limit=100,
            sort={"dueTime": "asc"},
            session=session,
        )
        tool_calls.append(call)

        check_ins, call = await self.find(
            "checkIns",
            {"planId": plan_id_value},
            limit=200,
            sort={"createdAt": "asc"},
            session=session,
        )
        tool_calls.append(call)

        return {
            "dog": dog,
            "plan": plan,
            "tasks": sorted(tasks, key=lambda item: item.get("dueTime") or ""),
            "checkIns": sorted(check_ins, key=lambda item: item.get("createdAt") or ""),
            "toolCalls": tool_calls,
            "memorySource": "mongodb_mcp_server",
        }

    async def get_caregiver_context(self, share_token: str) -> dict[str, Any]:
        context: dict[str, Any] | None = None
        try:
            async with self._client_session() as session:
                plans, call = await self.find("carePlans", {"shareToken": share_token}, limit=1, session=session)
                if not plans:
                    raise KeyError("Caregiver link not found through MongoDB MCP")
                context = await self._get_plan_context(_json_id(plans[0]["_id"]), session)
                context["toolCalls"] = [call, *context.get("toolCalls", [])]
        except Exception as exc:
            if context is not None and _is_stdio_close_noise(exc):
                return context
            raise

        dog = context["dog"] or {}
        context["dog"] = {
            "_id": dog.get("_id"),
            "name": dog.get("name"),
            "breed": dog.get("breed"),
            "age": dog.get("age"),
            "weight": dog.get("weight"),
            "allergies": dog.get("allergies", []),
            "medications": dog.get("medications", []),
            "foodRoutine": dog.get("foodRoutine"),
            "behaviourNotes": dog.get("behaviourNotes"),
            "vet": dog.get("vet", {}),
            "emergencyContact": dog.get("emergencyContact", {}),
            "photoUrl": dog.get("photoUrl"),
        }
        return context


async def get_plan_context_mcp_first(plan_id: str, fallback_memory: Any) -> dict[str, Any]:
    runtime = MongoMcpRuntime(read_only=True)
    if runtime.configured:
        try:
            return await runtime.get_plan_context(plan_id)
        except Exception as exc:
            mcp_error = _exception_text(exc)
            try:
                context = fallback_memory.get_plan_context(plan_id)
            except Exception as fallback_exc:
                fallback_error = _exception_text(fallback_exc)
                raise RuntimeError(
                    f"MongoDB MCP failed ({mcp_error}); "
                    f"direct MongoDB fallback also failed ({fallback_error})"
                ) from fallback_exc
            context["memorySource"] = "direct_mongodb_fallback_after_mcp_error"
            context["mcpError"] = mcp_error
            context["toolCalls"] = [
                agent_tool_call("mongodb_mcp.find", mode="mcp_server_failed", error=mcp_error),
                *context.get("toolCalls", []),
            ]
            return context

    context = fallback_memory.get_plan_context(plan_id)
    context["memorySource"] = "direct_mongodb_fallback_mcp_unconfigured"
    return context


async def get_caregiver_context_mcp_first(share_token: str, fallback_memory: Any) -> dict[str, Any]:
    runtime = MongoMcpRuntime(read_only=True)
    if runtime.configured:
        try:
            return await runtime.get_caregiver_context(share_token)
        except Exception as exc:
            mcp_error = _exception_text(exc)
            try:
                context = fallback_memory.get_caregiver_context(share_token)
            except Exception as fallback_exc:
                fallback_error = _exception_text(fallback_exc)
                raise RuntimeError(
                    f"MongoDB MCP failed ({mcp_error}); "
                    f"direct MongoDB fallback also failed ({fallback_error})"
                ) from fallback_exc
            context["memorySource"] = "direct_mongodb_fallback_after_mcp_error"
            context["mcpError"] = mcp_error
            context["toolCalls"] = [
                agent_tool_call("mongodb_mcp.find", mode="mcp_server_failed", error=mcp_error),
                *context.get("toolCalls", []),
            ]
            return context

    context = fallback_memory.get_caregiver_context(share_token)
    context["memorySource"] = "direct_mongodb_fallback_mcp_unconfigured"
    return context
