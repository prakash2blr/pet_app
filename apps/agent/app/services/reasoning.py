from __future__ import annotations

import json
import os
import re
from typing import Any, Callable

from app.prompts import (
    CARE_PLAN_PROMPT,
    DAILY_SUMMARY_PROMPT,
    EMERGENCY_SUMMARY_PROMPT,
    LOST_DOG_PROMPT,
    MEDICAL_DISCLAIMER,
    SYSTEM_PROMPT,
)
from app.schemas import GeneratedCarePlan
from app.services.json_parser import extract_json_object

FallbackFactory = Callable[[dict[str, Any]], dict[str, Any]]


class GeminiReasoner:
    def __init__(self) -> None:
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.last_mode = "deterministic_fallback"

    async def generate_json(
        self,
        task_prompt: str,
        payload: dict[str, Any],
        fallback: FallbackFactory,
    ) -> dict[str, Any]:
        prompt = (
            f"{SYSTEM_PROMPT}\n\n{task_prompt}\n\n"
            "Input JSON:\n"
            f"{json.dumps(payload, ensure_ascii=False, default=str)}"
        )

        # The ADK runner path is opt-in because it depends on the deployed ADK runtime and
        # credentials. The service still defines and deploys a real ADK root_agent with tools.
        if os.getenv("PET_GUARDIAN_USE_ADK_RUNNER", "false").lower() == "true":
            try:
                text = await self._run_adk(prompt)
                self.last_mode = "google_adk_runner"
                return extract_json_object(text)
            except Exception:
                pass

        try:
            text = await self._run_gemini(prompt)
            self.last_mode = "gemini_model"
            return extract_json_object(text)
        except Exception:
            self.last_mode = "deterministic_fallback"
            return fallback(payload)

    async def _run_gemini(self, prompt: str) -> str:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY")
        use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "true").lower() == "true"
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        if use_vertex and project:
            client = genai.Client(vertexai=True, project=project, location=location)
        elif api_key:
            client = genai.Client(api_key=api_key)
        else:
            raise RuntimeError("Gemini credentials not configured")

        response = client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        return response.text or ""

    async def _run_adk(self, prompt: str) -> str:
        from google.adk.runners import InMemoryRunner
        from google.genai import types

        from app.agent import root_agent

        if root_agent is None:
            raise RuntimeError("ADK root_agent is unavailable")

        runner = InMemoryRunner(agent=root_agent, app_name="pet_guardian")
        session_id = "pet-guardian-http-session"
        user_id = "web"
        if hasattr(runner, "session_service"):
            maybe_session = runner.session_service.create_session(
                app_name="pet_guardian", user_id=user_id, session_id=session_id
            )
            if hasattr(maybe_session, "__await__"):
                await maybe_session

        content = types.Content(role="user", parts=[types.Part(text=prompt)])
        final_text = ""
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content,
        ):
            if hasattr(event, "is_final_response") and event.is_final_response():
                parts = getattr(getattr(event, "content", None), "parts", []) or []
                final_text = "".join(getattr(part, "text", "") or "" for part in parts)
        if not final_text:
            raise RuntimeError("ADK runner returned no final response")
        return final_text


def care_plan_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    dog = payload.get("dog", {})
    plan = payload.get("plan", {})
    raw = (plan.get("ownerInstructionsRaw") or "").lower()
    dog_name = dog.get("name") or "the dog"
    tasks: list[dict[str, Any]] = []

    def add(
        title: str,
        description: str,
        task_type: str,
        due_time: str | None = None,
        critical: bool = False,
    ) -> None:
        if title not in {task["title"] for task in tasks}:
            tasks.append(
                {
                    "title": title,
                    "description": description,
                    "type": task_type,
                    "dueTime": due_time,
                    "critical": critical,
                }
            )

    food_routine = dog.get("foodRoutine") or ""
    if "8 am" in raw or "8am" in raw or "8 AM" in food_routine:
        add("Feed breakfast", f"Feed {dog_name} according to the owner food routine.", "feeding", "08:00", True)
    else:
        add("Morning meal", f"Feed {dog_name} according to the owner food routine.", "feeding", "08:00", True)

    if "walk" in raw:
        add("Morning walk", "Keep the walk calm and follow behaviour notes.", "walk", "09:00")
        add("Evening walk", "Avoid unsafe triggers mentioned by the owner.", "walk", "18:00")

    if "water" in raw or True:
        add("Refill water", "Refresh the water bowl and confirm it is accessible.", "water", "12:00")

    if "8 pm" in raw or "8pm" in raw or "8 PM" in food_routine:
        add("Feed dinner", f"Feed {dog_name} according to the owner food routine.", "feeding", "20:00", True)
    else:
        add("Evening meal", f"Feed {dog_name} according to the owner food routine.", "feeding", "20:00", True)

    medication_text = " ".join(dog.get("medications", [])) or raw
    if dog.get("medications") or "tablet" in raw or "medicine" in raw or "medication" in raw:
        add(
            "Give medicine after dinner",
            f"Give only the medicine exactly as provided by the owner: {medication_text}.",
            "medicine",
            "20:30",
            True,
        )

    add(
        "Health observation",
        "Check stool, appetite, water intake, energy, and any unusual symptoms.",
        "health_observation",
        "21:00",
        True,
    )
    add("Night water refill", "Top up water before bedtime.", "water", "21:30")

    critical_warnings = []
    if dog.get("allergies"):
        critical_warnings.append(f"Allergies: {', '.join(dog['allergies'])}. Do not offer these foods.")
    if dog.get("medications"):
        critical_warnings.append("Medication must be given exactly as written by the owner.")
    if dog.get("behaviourNotes"):
        critical_warnings.append(str(dog["behaviourNotes"]))

    missing_info = []
    if not dog.get("vet", {}).get("phone"):
        missing_info.append("Vet phone number is missing.")
    if not dog.get("emergencyContact", {}).get("phone"):
        missing_info.append("Emergency contact phone number is missing.")
    medicine_has_dose = bool(re.search(r"\d", medication_text))
    medicine_has_timing = any(
        phrase in medication_text.lower()
        for phrase in (
            "after dinner",
            "before dinner",
            "after food",
            "before food",
            "after meal",
            "before meal",
            "morning",
            "evening",
            "night",
            "am",
            "pm",
        )
    )
    if dog.get("medications") and not (medicine_has_dose or medicine_has_timing):
        missing_info.append("Medicine dosage/timing details may need confirmation.")
    if not dog.get("foodRoutine"):
        missing_info.append("Food quantity/routine is missing.")

    return GeneratedCarePlan(
        summary=(
            f"{dog_name} has an active handover from {plan.get('startDate')} to "
            f"{plan.get('endDate')}. The plan focuses on meals, walks, water, medication, "
            "and health observations."
        ),
        caregiverInstructions=(
            "Follow the checklist in order, submit a verified check-in for each task, and "
            "flag any skipped task or concerning symptom immediately."
        ),
        criticalWarnings=critical_warnings,
        missingInfo=missing_info,
        tasks=tasks,
    ).model_dump()


def daily_summary_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    tasks = payload.get("tasks", [])
    check_ins = payload.get("checkIns", [])
    task_by_id = {str(task.get("_id")): task for task in tasks}
    completed: list[str] = []
    missed: list[str] = []
    issues: list[str] = []

    for check_in in check_ins:
        task = task_by_id.get(str(check_in.get("taskId")), {})
        label = task.get("title") or "Care task"
        status = check_in.get("status")
        note = check_in.get("note")
        if status == "done":
            completed.append(f"{label}: {note or 'completed'}")
        elif status == "skipped":
            missed.append(f"{label}: {note or 'skipped'}")
        elif status == "issue":
            issues.append(f"{label}: {note or 'issue reported'}")

    pending = [task.get("title") for task in tasks if task.get("status") == "pending"]
    missed.extend([f"{title}: pending" for title in pending if title])
    urgent = any((item.get("severity") == "urgent") for item in check_ins)
    attention = bool(missed or issues or urgent)

    return {
        "summary": (
            f"{len(completed)} task(s) have verified check-ins. "
            f"{len(missed)} task(s) are pending or skipped. {len(issues)} issue(s) reported."
        ),
        "completedTasks": completed,
        "missedOrSkippedTasks": missed,
        "issues": issues,
        "ownerAttentionNeeded": attention,
        "nextRecommendedAction": (
            "Contact a veterinarian or emergency animal service immediately for urgent symptoms."
            if urgent
            else "Review issue notes and message the caregiver if anything needs clarification."
            if attention
            else "No owner action is needed beyond continuing the checklist."
        ),
    }


def _first_answer_value(answers: dict[str, Any], keys: tuple[str, ...], default: str) -> str:
    for key in keys:
        value = answers.get(key)
        if value is not None and str(value).strip():
            return str(value)
    return default


def emergency_summary_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    dog = payload.get("dog", {})
    plan = payload.get("carePlan", {})
    check_ins = payload.get("recentCheckIns", [])
    answers = payload.get("answers", {})
    dog_name = dog.get("name") or "Dog"
    happened = answers.get("whatHappened") or answers.get("symptoms") or "Incident reported"
    when = _first_answer_value(
        answers,
        ("whenStarted", "time", "incidentTime", "startedAt", "started", "when"),
        "Time not provided",
    )
    urgent_flags = [
        answers.get("breathingNormal") == "no",
        answers.get("alert") == "no",
        answers.get("repeatedVomitingDiarrhea") == "yes",
        payload.get("incidentType") in {"poisoning", "breathing", "seizure"},
    ]

    return {
        "vetReadySummary": (
            f"{dog_name} is under care plan '{plan.get('title')}'. Reported issue: {happened}. "
            f"Started: {when}. This is an information summary for the vet, not a diagnosis."
        ),
        "timeline": [
            f"Incident started: {when}",
            f"Caregiver report: {happened}",
            *[
                f"Recent check-in: {item.get('status')} - {item.get('note') or 'no note'}"
                for item in check_ins[-3:]
            ],
        ],
        "criticalKnownInfo": [
            f"Allergies: {', '.join(dog.get('allergies') or []) or 'not provided'}",
            f"Medicines: {', '.join(dog.get('medications') or []) or 'not provided'}",
            f"Food routine: {dog.get('foodRoutine') or 'not provided'}",
            f"Vet contact: {dog.get('vet', {}).get('name') or ''} {dog.get('vet', {}).get('phone') or ''}".strip()
            or "Vet contact not provided",
        ],
        "questionsForVet": [
            "Does this symptom require immediate emergency care?",
            "Should food, water, walks, or medicine be paused until examined?",
            "What warning signs should the caregiver monitor next?",
        ],
        "recommendedNextSteps": [
            "Contact the veterinarian or emergency animal service immediately."
            if any(urgent_flags)
            else "Share this summary with the veterinarian and ask whether a visit is needed.",
            "Keep the dog calm and supervised.",
            "Do not give new medicine unless a veterinarian instructs it.",
        ],
        "disclaimer": MEDICAL_DISCLAIMER,
    }


def lost_dog_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    dog = payload.get("dog", {})
    answers = payload.get("answers", {})
    dog_name = dog.get("name") or "dog"
    location = answers.get("lastSeenLocation") or "last seen location not provided"
    time = answers.get("lastSeenTime") or "time not provided"
    contact = answers.get("contactNumber") or dog.get("emergencyContact", {}).get("phone") or "[contact number]"

    return {
        "immediateActions": [
            "Search the last-seen spot and nearby hiding places calmly.",
            "Ask one person to stay reachable by phone while others search.",
            "Call nearby vets, shelters, security desks, and building staff.",
        ],
        "searchChecklist": [
            "Carry leash, treats, a familiar toy, and a recent photo.",
            "Check parking areas, stairwells, parks, food stalls, and quiet corners.",
            "Share the alert with neighbours, walkers, guards, and local pet groups.",
        ],
        "whatsappAlert": (
            f"Missing dog: {dog_name}. Last seen at {location} around {time}. "
            f"Breed: {dog.get('breed') or 'not provided'}. "
            f"Please call {contact} with any sighting. Do not chase; calmly note location."
        ),
        "posterText": (
            f"MISSING DOG\nName: {dog_name}\nBreed: {dog.get('breed') or 'not provided'}\n"
            f"Last seen: {location}, {time}\nContact: {contact}"
        ),
        "ownerScript": (
            f"Hi, I am looking for my dog {dog_name}, last seen at {location} around {time}. "
            "Have you seen a dog matching this photo or description?"
        ),
        "disclaimer": "This plan cannot guarantee recovery. Keep searching safely and contact local animal services.",
    }


async def generate_care_plan(payload: dict[str, Any], reasoner: GeminiReasoner) -> dict[str, Any]:
    return await reasoner.generate_json(CARE_PLAN_PROMPT, payload, care_plan_fallback)


async def generate_daily_summary(payload: dict[str, Any], reasoner: GeminiReasoner) -> dict[str, Any]:
    return await reasoner.generate_json(DAILY_SUMMARY_PROMPT, payload, daily_summary_fallback)


async def generate_emergency_summary(payload: dict[str, Any], reasoner: GeminiReasoner) -> dict[str, Any]:
    return await reasoner.generate_json(EMERGENCY_SUMMARY_PROMPT, payload, emergency_summary_fallback)


async def generate_lost_dog_plan(payload: dict[str, Any], reasoner: GeminiReasoner) -> dict[str, Any]:
    return await reasoner.generate_json(LOST_DOG_PROMPT, payload, lost_dog_fallback)
