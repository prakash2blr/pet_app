from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agent import root_agent
from app.prompts import MEDICAL_DISCLAIMER
from app.schemas import (
    DemoResetRequest,
    EmergencySummaryRequest,
    GenerateCarePlanRequest,
    GeneratedCarePlan,
    LostDogPlanRequest,
    PlanIdRequest,
    RecordCheckInRequest,
)
from app.services.reasoning import (
    GeminiReasoner,
    generate_care_plan,
    generate_daily_summary,
    generate_emergency_summary,
    generate_lost_dog_plan,
)
from app.tools.fallback_mongo import MongoMemory
from app.tools.mongodb_mcp import (
    get_caregiver_context_mcp_first,
    get_plan_context_mcp_first,
    mcp_status,
)

app = FastAPI(
    title="Pet Guardian ADK Agent Service",
    description="Gemini-powered dog-care handover agent using Google ADK and MongoDB MCP.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory = MongoMemory()
reasoner = GeminiReasoner()


def public_urls(plan_id: str, share_token: str) -> dict[str, str]:
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
    return {
        "caregiverUrl": f"{app_url}/caregiver/{share_token}",
        "dashboardUrl": f"{app_url}/owner/dashboard/{plan_id}",
        "reviewUrl": f"{app_url}/owner/plan/{plan_id}",
    }


def persist_run(
    run_type: str,
    run_input: dict[str, Any],
    output: dict[str, Any],
    status: str = "success",
    tool_calls: list[dict[str, Any]] | None = None,
    error: str | None = None,
) -> None:
    try:
        memory.save_agent_run(
            {
                "type": run_type,
                "input": run_input,
                "output": output,
                "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                "status": status,
                "toolCalls": tool_calls or [],
                "error": error,
                "reasoningMode": reasoner.last_mode,
                "adkAgent": "pet_guardian_agent",
                "mcp": mcp_status(),
            }
        )
    except Exception:
        pass


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        mongo = memory.ping()
    except Exception as exc:
        mongo = {"mode": memory.mode, "ok": False, "error": str(exc)}
    return {
        "status": "ok",
        "service": "pet-guardian-agent",
        "agent": "pet_guardian_agent",
        "adkAgentLoaded": root_agent is not None,
        "mongo": mongo,
        "mcp": mcp_status(),
        "careMemoryReadPath": "MongoDB MCP first; direct MongoDB fallback if MCP is unavailable",
        "careMemoryWritePath": "Direct MongoDB driver for transactional writes; agent run logs show the path used",
    }


@app.post("/agent/generate-care-plan")
async def agent_generate_care_plan(request: GenerateCarePlanRequest) -> dict[str, Any]:
    payload = request.model_dump()
    try:
        generated = await generate_care_plan(payload, reasoner)
        generated = GeneratedCarePlan.model_validate(generated).model_dump()
        bundle = memory.create_care_plan_bundle(
            dog=request.dog.model_dump(),
            plan=request.plan.model_dump(),
            generated=generated,
            demo=request.demo,
        )
        plan_id = bundle["plan"]["_id"]
        share_token = bundle["plan"]["shareToken"]
        response = {
            **bundle,
            "generated": generated,
            "planId": plan_id,
            "dogId": bundle["dog"]["_id"],
            "shareToken": share_token,
            **public_urls(plan_id, share_token),
        }
        persist_run(
            "care_plan_generation",
            payload,
            response,
            tool_calls=[
                {"tool": "create_dog_profile", "mode": memory.mode},
                {"tool": "create_care_plan", "mode": memory.mode},
                {"tool": "create_care_tasks", "mode": memory.mode},
            ],
        )
        return response
    except Exception as exc:
        persist_run("care_plan_generation", payload, {}, status="error", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/agent/plan/{plan_id}")
async def agent_get_plan(plan_id: str) -> dict[str, Any]:
    try:
        context = await get_plan_context_mcp_first(plan_id, memory)
        urls = public_urls(context["plan"]["_id"], context["plan"]["shareToken"])
        return {**context, **urls, "medicalDisclaimer": MEDICAL_DISCLAIMER}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/agent/caregiver/{share_token}")
async def agent_get_caregiver_plan(share_token: str) -> dict[str, Any]:
    try:
        context = await get_caregiver_context_mcp_first(share_token, memory)
        return {**context, "medicalDisclaimer": MEDICAL_DISCLAIMER}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agent/record-checkin")
def agent_record_checkin(request: RecordCheckInRequest) -> dict[str, Any]:
    payload = request.model_dump()
    try:
        result = memory.record_checkin(payload)
        persist_run(
            "record_checkin",
            payload,
            result,
            tool_calls=result.get("toolCalls", []),
        )
        return result
    except Exception as exc:
        persist_run("record_checkin", payload, {}, status="error", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agent/daily-summary")
async def agent_daily_summary(request: PlanIdRequest) -> dict[str, Any]:
    try:
        context = await get_plan_context_mcp_first(request.planId, memory)
        payload = {
            "dog": context["dog"],
            "carePlan": context["plan"],
            "tasks": context["tasks"],
            "checkIns": context["checkIns"],
        }
        output = await generate_daily_summary(payload, reasoner)
        persist_run(
            "daily_summary",
            {"planId": request.planId},
            output,
            tool_calls=context.get("toolCalls", []),
        )
        return {"summary": output, "toolCalls": context.get("toolCalls", [])}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        persist_run("daily_summary", {"planId": request.planId}, {}, status="error", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agent/emergency-summary")
async def agent_emergency_summary(request: EmergencySummaryRequest) -> dict[str, Any]:
    try:
        context = await get_plan_context_mcp_first(request.planId, memory)
        payload = {
            "dog": context["dog"],
            "carePlan": context["plan"],
            "recentCheckIns": context["checkIns"][-8:],
            "incidentType": request.incidentType,
            "answers": request.answers,
        }
        output = await generate_emergency_summary(payload, reasoner)
        log = memory.save_emergency_log(
            dog_id=context["dog"]["_id"],
            plan_id=context["plan"]["_id"],
            emergency_type=request.incidentType,
            raw_input=request.answers,
            output=output,
            demo=bool(context["plan"].get("demo")),
        )
        persist_run(
            "emergency_summary",
            payload,
            {**output, "emergencyLog": log},
            tool_calls=[
                *context.get("toolCalls", []),
                {"tool": "save_emergency_log", "mode": memory.mode},
            ],
        )
        return {"summary": output, "emergencyLog": log}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        persist_run(
            "emergency_summary",
            request.model_dump(),
            {},
            status="error",
            error=str(exc),
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agent/lost-dog-plan")
async def agent_lost_dog_plan(request: LostDogPlanRequest) -> dict[str, Any]:
    try:
        context = await get_plan_context_mcp_first(request.planId, memory)
        payload = {
            "dog": context["dog"],
            "carePlan": context["plan"],
            "answers": request.answers,
        }
        output = await generate_lost_dog_plan(payload, reasoner)
        log = memory.save_emergency_log(
            dog_id=context["dog"]["_id"],
            plan_id=context["plan"]["_id"],
            emergency_type="lost_dog",
            raw_input=request.answers,
            output=output,
            demo=bool(context["plan"].get("demo")),
        )
        persist_run(
            "lost_dog_plan",
            payload,
            {**output, "emergencyLog": log},
            tool_calls=[
                *context.get("toolCalls", []),
                {"tool": "save_emergency_log", "mode": memory.mode},
            ],
        )
        return {"plan": output, "emergencyLog": log}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        persist_run("lost_dog_plan", request.model_dump(), {}, status="error", error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/demo/seed")
async def demo_seed() -> dict[str, Any]:
    demo_payload = GenerateCarePlanRequest(
        demo=True,
        dog={
            "ownerName": "Prakash",
            "name": "Bruno",
            "breed": "Labrador",
            "age": "4 years",
            "weight": "28 kg",
            "allergies": ["Chicken"],
            "medications": ["Liver tablet after dinner"],
            "foodRoutine": "One scoop dry food at 8 AM and 8 PM",
            "behaviourNotes": "Pulls on leash. Avoid street dogs. Gets anxious during thunder.",
            "vet": {"name": "Dr Rao", "phone": "+91 98765 43210"},
            "emergencyContact": {"name": "Prakash", "phone": "+91 90000 00000"},
        },
        plan={
            "title": "Bruno 3-day care plan",
            "startDate": "2026-06-01",
            "endDate": "2026-06-03",
            "caregiverName": "Rahul",
            "caregiverContact": "",
            "ownerInstructionsRaw": (
                "I am travelling for 3 days from 1 June to 3 June. Bruno needs food at "
                "8 AM and 8 PM. Give his liver tablet after dinner. Take him for a morning "
                "and evening walk, but avoid street dogs because he gets reactive. Refill "
                "water twice daily. Please watch for loose motion because he had stomach "
                "issues last week."
            ),
        },
    )
    return await agent_generate_care_plan(demo_payload)


@app.post("/demo/reset")
def demo_reset(request: DemoResetRequest) -> dict[str, Any]:
    if os.getenv("DEMO_MODE", "true").lower() != "true":
        raise HTTPException(status_code=403, detail="Demo mode is disabled")
    expected_key = os.getenv("DEMO_RESET_KEY", "demo123")
    if request.resetKey != expected_key:
        raise HTTPException(status_code=403, detail="Invalid reset key")
    deleted = memory.reset_demo()
    return {"deleted": deleted}
