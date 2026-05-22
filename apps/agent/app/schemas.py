from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

TaskType = Literal[
    "feeding",
    "medicine",
    "walk",
    "water",
    "grooming",
    "health_observation",
    "other",
]
TaskStatus = Literal["pending", "done", "skipped", "issue"]
Severity = Literal["normal", "watch", "urgent"]
EmergencyType = Literal[
    "vomiting_diarrhea",
    "injury",
    "poisoning",
    "breathing",
    "seizure",
    "lost_dog",
    "other",
]


class Contact(BaseModel):
    name: str | None = None
    phone: str | None = None


class DogInput(BaseModel):
    ownerName: str | None = None
    name: str
    breed: str | None = None
    age: str | None = None
    weight: str | None = None
    allergies: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)
    foodRoutine: str | None = None
    behaviourNotes: str | None = None
    vet: Contact = Field(default_factory=Contact)
    emergencyContact: Contact = Field(default_factory=Contact)
    photoUrl: str | None = None


class CarePlanInput(BaseModel):
    title: str
    startDate: str
    endDate: str
    caregiverName: str | None = None
    caregiverContact: str | None = None
    ownerInstructionsRaw: str


class GenerateCarePlanRequest(BaseModel):
    dog: DogInput
    plan: CarePlanInput
    demo: bool = False


class GeneratedTask(BaseModel):
    title: str
    description: str | None = None
    type: TaskType = "other"
    dueTime: str | None = None
    critical: bool = False


class GeneratedCarePlan(BaseModel):
    summary: str
    caregiverInstructions: str
    criticalWarnings: list[str] = Field(default_factory=list)
    missingInfo: list[str] = Field(default_factory=list)
    tasks: list[GeneratedTask] = Field(default_factory=list)


class RecordCheckInRequest(BaseModel):
    taskId: str
    planId: str
    dogId: str
    status: TaskStatus
    note: str | None = None
    photoUrl: str | None = None
    severity: Severity = "normal"
    submittedBy: str | None = None


class PlanIdRequest(BaseModel):
    planId: str


class EmergencySummaryRequest(BaseModel):
    planId: str
    incidentType: EmergencyType
    answers: dict[str, Any] = Field(default_factory=dict)


class LostDogPlanRequest(BaseModel):
    planId: str
    answers: dict[str, Any] = Field(default_factory=dict)


class DemoResetRequest(BaseModel):
    resetKey: str


class AgentRunInput(BaseModel):
    type: str
    input: dict[str, Any]
    output: dict[str, Any] | None = None
    model: str | None = None
    status: Literal["success", "error"] = "success"
    toolCalls: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None
