from __future__ import annotations

import os
from typing import Any

from app.prompts import SYSTEM_PROMPT
from app.tools.fallback_mongo import MongoMemory
from app.tools.mongodb_mcp import build_mongodb_mcp_toolset, get_plan_context_mcp_first


def create_dog_profile(dog: dict[str, Any]) -> dict[str, Any]:
    """Persist a dog profile in MongoDB care memory."""
    memory = MongoMemory()
    return memory._insert("dogs", dog)  # noqa: SLF001 - exposed as an ADK tool wrapper.


def create_care_plan(bundle: dict[str, Any]) -> dict[str, Any]:
    """Persist a generated care plan and generated tasks."""
    memory = MongoMemory()
    return memory.create_care_plan_bundle(
        dog=bundle["dog"],
        plan=bundle["plan"],
        generated=bundle["generated"],
        demo=bundle.get("demo", False),
    )


async def get_plan_context(plan_id: str) -> dict[str, Any]:
    """Retrieve dog, care plan, tasks, and verified check-ins for a plan."""
    memory = MongoMemory()
    return await get_plan_context_mcp_first(plan_id, memory)


def record_checkin(checkin: dict[str, Any]) -> dict[str, Any]:
    """Record a verified caregiver check-in and update the task status."""
    memory = MongoMemory()
    return memory.record_checkin(checkin)


async def get_checkins_for_plan(plan_id: str) -> dict[str, Any]:
    """Return check-ins for a plan from MongoDB care memory."""
    memory = MongoMemory()
    context = await get_plan_context_mcp_first(plan_id, memory)
    return {"checkIns": context["checkIns"], "toolCalls": context.get("toolCalls", [])}


def save_emergency_log(payload: dict[str, Any]) -> dict[str, Any]:
    """Persist an emergency preparation log."""
    memory = MongoMemory()
    return memory.save_emergency_log(
        dog_id=payload["dogId"],
        plan_id=payload.get("planId"),
        emergency_type=payload["type"],
        raw_input=payload.get("rawInput", {}),
        output=payload.get("output", {}),
        demo=payload.get("demo", False),
    )


def save_agent_run(run: dict[str, Any]) -> dict[str, Any]:
    """Audit an agent run and its tool-call-like records."""
    memory = MongoMemory()
    return memory.save_agent_run(run)


def build_root_agent() -> Any | None:
    try:
        from google.adk.agents import Agent
    except Exception:
        return None

    tools: list[Any] = [
        create_dog_profile,
        create_care_plan,
        get_plan_context,
        record_checkin,
        get_checkins_for_plan,
        save_emergency_log,
        save_agent_run,
    ]
    mcp_toolset = build_mongodb_mcp_toolset()
    if mcp_toolset is not None:
        tools.append(mcp_toolset)

    return Agent(
        model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        name="pet_guardian_agent",
        instruction=SYSTEM_PROMPT,
        tools=tools,
    )


root_agent = build_root_agent()
