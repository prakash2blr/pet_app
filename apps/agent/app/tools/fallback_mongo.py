from __future__ import annotations

import os
import secrets
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

try:
    from bson import ObjectId
    from bson.errors import InvalidId
    from pymongo import MongoClient
except Exception:  # pragma: no cover - allows docs/type checks without pymongo installed.
    ObjectId = None  # type: ignore[assignment]
    InvalidId = Exception
    MongoClient = None  # type: ignore[assignment]

from app.services.audit_logger import agent_tool_call

COLLECTIONS = (
    "dogs",
    "carePlans",
    "careTasks",
    "checkIns",
    "emergencyLogs",
    "agentRuns",
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _local_id() -> str:
    return secrets.token_hex(12)


def _mongo_id(value: str) -> Any:
    if ObjectId is None:
        return value
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return value


def serialize(value: Any) -> Any:
    if ObjectId is not None and isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value


class LocalMemoryStore:
    def __init__(self) -> None:
        self.collections: dict[str, dict[str, dict[str, Any]]] = {
            name: {} for name in COLLECTIONS
        }

    def insert_one(self, collection: str, document: dict[str, Any]) -> dict[str, Any]:
        doc = deepcopy(document)
        doc["_id"] = doc.get("_id") or _local_id()
        self.collections[collection][str(doc["_id"])] = doc
        return deepcopy(doc)

    def find_one(self, collection: str, predicate: dict[str, Any]) -> dict[str, Any] | None:
        for doc in self.collections[collection].values():
            if all(str(doc.get(key)) == str(value) for key, value in predicate.items()):
                return deepcopy(doc)
        return None

    def find_many(self, collection: str, predicate: dict[str, Any]) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for doc in self.collections[collection].values():
            if all(str(doc.get(key)) == str(value) for key, value in predicate.items()):
                items.append(deepcopy(doc))
        return items

    def update_one(self, collection: str, document_id: str, update: dict[str, Any]) -> dict[str, Any]:
        doc = self.collections[collection][str(document_id)]
        doc.update(update)
        return deepcopy(doc)

    def delete_demo_records(self) -> int:
        all_dog_ids = {str(doc.get("_id")) for doc in self.collections["dogs"].values()}
        all_plan_ids = {str(doc.get("_id")) for doc in self.collections["carePlans"].values()}
        all_task_ids = {str(doc.get("_id")) for doc in self.collections["careTasks"].values()}
        demo_dog_ids = {
            str(doc.get("_id"))
            for doc in self.collections["dogs"].values()
            if doc.get("demo") is True
        }
        demo_plan_ids = {
            str(doc.get("_id"))
            for doc in self.collections["carePlans"].values()
            if doc.get("demo") is True
        }
        demo_task_ids = {
            str(doc.get("_id"))
            for doc in self.collections["careTasks"].values()
            if doc.get("demo") is True
        }

        deleted = 0
        for collection in COLLECTIONS:
            keep: dict[str, dict[str, Any]] = {}
            for key, value in self.collections[collection].items():
                linked_to_demo = (
                    str(value.get("dogId")) in demo_dog_ids
                    or str(value.get("planId")) in demo_plan_ids
                    or str(value.get("taskId")) in demo_task_ids
                )
                orphaned_checkin = collection == "checkIns" and (
                    str(value.get("dogId")) not in all_dog_ids
                    or str(value.get("planId")) not in all_plan_ids
                    or str(value.get("taskId")) not in all_task_ids
                )
                orphaned_emergency_log = collection == "emergencyLogs" and (
                    str(value.get("dogId")) not in all_dog_ids
                    or (
                        value.get("planId") is not None
                        and str(value.get("planId")) not in all_plan_ids
                    )
                )
                if value.get("demo") is True or linked_to_demo or orphaned_checkin or orphaned_emergency_log:
                    deleted += 1
                else:
                    keep[key] = value
            self.collections[collection] = keep
        return deleted


LOCAL_STORE = LocalMemoryStore()


class MongoMemory:
    def __init__(self) -> None:
        self.db_name = os.getenv("MONGODB_DB", "pet_guardian")
        self.uri = os.getenv("MONGODB_URI")
        self.client = None
        self.db = None
        if self.uri and MongoClient is not None:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            self.db = self.client[self.db_name]

    @property
    def mode(self) -> str:
        return "mongodb_atlas" if self.db is not None else "local_memory_demo"

    @property
    def mcp_mode(self) -> str:
        return "mongodb_mcp_configured" if os.getenv("MDB_MCP_CONNECTION_STRING") else "mongodb_mcp_unconfigured"

    @property
    def direct_mode(self) -> str:
        return "direct_mongodb_driver" if self.db is not None else "local_memory_demo"

    def ping(self) -> dict[str, Any]:
        if self.db is None:
            return {"mode": self.mode, "ok": True}
        self.client.admin.command("ping")
        return {"mode": self.mode, "ok": True, "database": self.db_name}

    def _insert(self, collection: str, document: dict[str, Any]) -> dict[str, Any]:
        if self.db is None:
            return serialize(LOCAL_STORE.insert_one(collection, document))

        result = self.db[collection].insert_one(document)
        stored = self.db[collection].find_one({"_id": result.inserted_id})
        return serialize(stored)

    def _find_one(self, collection: str, predicate: dict[str, Any]) -> dict[str, Any] | None:
        if self.db is None:
            return serialize(LOCAL_STORE.find_one(collection, predicate))
        normalized = {
            key: _mongo_id(value) if key == "_id" else value
            for key, value in predicate.items()
        }
        return serialize(self.db[collection].find_one(normalized))

    def _find_many(self, collection: str, predicate: dict[str, Any]) -> list[dict[str, Any]]:
        if self.db is None:
            return serialize(LOCAL_STORE.find_many(collection, predicate))
        normalized = {
            key: _mongo_id(value) if key == "_id" else value
            for key, value in predicate.items()
        }
        return serialize(list(self.db[collection].find(normalized)))

    def _update_one(self, collection: str, document_id: str, update: dict[str, Any]) -> dict[str, Any]:
        update["updatedAt"] = utc_now()
        if self.db is None:
            return serialize(LOCAL_STORE.update_one(collection, document_id, update))
        _id = _mongo_id(document_id)
        self.db[collection].update_one({"_id": _id}, {"$set": update})
        return serialize(self.db[collection].find_one({"_id": _id}))

    def create_care_plan_bundle(
        self,
        dog: dict[str, Any],
        plan: dict[str, Any],
        generated: dict[str, Any],
        demo: bool = False,
    ) -> dict[str, Any]:
        now = utc_now()
        dog_doc = {
            **dog,
            "demo": demo,
            "createdAt": now,
            "updatedAt": now,
        }
        stored_dog = self._insert("dogs", dog_doc)

        share_token = secrets.token_urlsafe(16)
        plan_doc = {
            **plan,
            "dogId": stored_dog["_id"],
            "aiGeneratedSummary": generated["summary"],
            "caregiverInstructions": generated["caregiverInstructions"],
            "criticalWarnings": generated.get("criticalWarnings", []),
            "missingInfo": generated.get("missingInfo", []),
            "shareToken": share_token,
            "status": "active",
            "demo": demo,
            "createdAt": now,
            "updatedAt": now,
        }
        stored_plan = self._insert("carePlans", plan_doc)

        stored_tasks = []
        for task in generated.get("tasks", []):
            task_doc = {
                **task,
                "planId": stored_plan["_id"],
                "dogId": stored_dog["_id"],
                "status": "pending",
                "demo": demo,
                "createdAt": now,
                "updatedAt": now,
            }
            stored_tasks.append(self._insert("careTasks", task_doc))

        return {"dog": stored_dog, "plan": stored_plan, "tasks": stored_tasks}

    def get_plan_context(self, plan_id: str) -> dict[str, Any]:
        plan = self._find_one("carePlans", {"_id": plan_id})
        if not plan:
            raise KeyError(f"Care plan {plan_id} not found")
        dog = self._find_one("dogs", {"_id": plan["dogId"]})
        tasks = self._find_many("careTasks", {"planId": plan["_id"]})
        check_ins = self._find_many("checkIns", {"planId": plan["_id"]})
        return {
            "dog": dog,
            "plan": plan,
            "tasks": sorted(tasks, key=lambda item: item.get("dueTime") or ""),
            "checkIns": sorted(check_ins, key=lambda item: item.get("createdAt") or ""),
            "toolCalls": [
                agent_tool_call(
                    "direct_mongodb.find",
                    "carePlans",
                    mode=self.direct_mode,
                    filter={"_id": plan_id},
                ),
                agent_tool_call("direct_mongodb.find", "dogs", mode=self.direct_mode),
                agent_tool_call("direct_mongodb.find", "careTasks", mode=self.direct_mode),
                agent_tool_call("direct_mongodb.find", "checkIns", mode=self.direct_mode),
            ],
        }

    def get_caregiver_context(self, share_token: str) -> dict[str, Any]:
        plan = self._find_one("carePlans", {"shareToken": share_token})
        if not plan:
            raise KeyError("Caregiver link not found")
        context = self.get_plan_context(plan["_id"])
        dog = context["dog"] or {}
        safe_dog = {
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
        return {**context, "dog": safe_dog}

    def record_checkin(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        plan = self._find_one("carePlans", {"_id": payload["planId"]})
        task = self._find_one("careTasks", {"_id": payload["taskId"]})
        checkin_doc = {
            **payload,
            "demo": bool((plan or {}).get("demo") or (task or {}).get("demo")),
            "createdAt": now,
        }
        stored_checkin = self._insert("checkIns", checkin_doc)
        updated_task = self._update_one(
            "careTasks",
            payload["taskId"],
            {"status": payload["status"], "latestCheckInId": stored_checkin["_id"]},
        )
        return {
            "checkIn": stored_checkin,
            "task": updated_task,
            "toolCalls": [
                agent_tool_call("direct_mongodb.insert-one", "checkIns", mode=self.direct_mode),
                agent_tool_call("direct_mongodb.update-one", "careTasks", mode=self.direct_mode),
            ],
        }

    def save_emergency_log(
        self,
        dog_id: str,
        plan_id: str | None,
        emergency_type: str,
        raw_input: dict[str, Any],
        output: dict[str, Any],
        demo: bool = False,
    ) -> dict[str, Any]:
        log = {
            "dogId": dog_id,
            "planId": plan_id,
            "type": emergency_type,
            "rawInput": raw_input,
            "aiSummary": output.get("vetReadySummary") or output.get("whatsappAlert") or "",
            "recommendedNextSteps": output.get("recommendedNextSteps")
            or output.get("immediateActions")
            or [],
            "disclaimer": output.get("disclaimer"),
            "demo": demo,
            "createdAt": utc_now(),
        }
        return self._insert("emergencyLogs", log)

    def save_agent_run(self, run: dict[str, Any]) -> dict[str, Any]:
        return self._insert("agentRuns", {**run, "createdAt": utc_now()})

    def reset_demo(self) -> int:
        if self.db is None:
            return LOCAL_STORE.delete_demo_records()

        demo_dog_ids = [str(doc["_id"]) for doc in self.db["dogs"].find({"demo": True}, {"_id": 1})]
        demo_plan_ids = [str(doc["_id"]) for doc in self.db["carePlans"].find({"demo": True}, {"_id": 1})]
        demo_task_ids = [str(doc["_id"]) for doc in self.db["careTasks"].find({"demo": True}, {"_id": 1})]
        all_dog_ids = [str(doc["_id"]) for doc in self.db["dogs"].find({}, {"_id": 1})]
        all_plan_ids = [str(doc["_id"]) for doc in self.db["carePlans"].find({}, {"_id": 1})]
        all_task_ids = [str(doc["_id"]) for doc in self.db["careTasks"].find({}, {"_id": 1})]

        deleted = 0
        checkins_filter = {
            "$or": [
                {"demo": True},
                {"dogId": {"$in": demo_dog_ids}},
                {"planId": {"$in": demo_plan_ids}},
                {"taskId": {"$in": demo_task_ids}},
                {"dogId": {"$nin": all_dog_ids}},
                {"planId": {"$nin": all_plan_ids}},
                {"taskId": {"$nin": all_task_ids}},
            ]
        }
        result = self.db["checkIns"].delete_many(checkins_filter)
        deleted += result.deleted_count

        emergency_logs_filter = {
            "$or": [
                {"demo": True},
                {"dogId": {"$in": demo_dog_ids}},
                {"planId": {"$in": demo_plan_ids}},
                {"dogId": {"$nin": all_dog_ids}},
                {"planId": {"$nin": all_plan_ids, "$ne": None}},
            ]
        }
        result = self.db["emergencyLogs"].delete_many(emergency_logs_filter)
        deleted += result.deleted_count

        agent_runs_filter = {
            "$or": [
                {"demo": True},
                {"input.demo": True},
                {"output.demo": True},
                {"output.plan.demo": True},
                {"input.planId": {"$in": demo_plan_ids}},
                {"output.planId": {"$in": demo_plan_ids}},
            ]
        }
        result = self.db["agentRuns"].delete_many(agent_runs_filter)
        deleted += result.deleted_count

        for collection in COLLECTIONS:
            if collection in {"checkIns", "emergencyLogs", "agentRuns"}:
                continue
            result = self.db[collection].delete_many({"demo": True})
            deleted += result.deleted_count
        return deleted
