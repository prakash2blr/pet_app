# Pet Guardian PRD

## AI Dog Care Handover Agent with Verified Care Check-ins

**Version:** 2.0  
**Purpose:** Codex-ready implementation PRD  
**Hackathon:** Google Cloud Rapid Agent Hackathon  
**Primary Track:** MongoDB  
**Core Requirement Alignment:** Gemini + Google Cloud Agent Builder / ADK + MongoDB MCP  
**Product Format:** Mobile-first web app backed by a deployed ADK agent  
**Primary Deployment Target:** Google Cloud Run  

---

## 0. Important Correction from Previous PRD

The earlier version allowed the implementation to look like a normal Next.js app calling Gemini directly. That is not strong enough for this hackathon.

This version makes the architecture explicit:

```text
Next.js = user interface only
Google Cloud Agent Builder / ADK = agent brain
Gemini = reasoning model
MongoDB MCP = partner MCP tool integration
MongoDB Atlas = persistent care memory
Cloud Run = deployment
```

The product must not be presented as "a Next.js app using Gemini." It must be presented as:

> Pet Guardian is a Gemini-powered care agent built with Google Cloud Agent Builder / ADK, exposed through a mobile-first web interface, and grounded in MongoDB care memory through MongoDB MCP.

---

## 1. Product Summary

### Product Name

**Pet Guardian**

### One-Liner

**Pet Guardian is an AI dog-care handover agent that turns messy owner instructions into structured care plans, caregiver checklists, verified check-ins, and emergency-ready summaries.**

### Primary User

Busy urban dog parents who leave their dog with friends, family, sitters, walkers, or boarding centres during travel, office hours, or emergencies.

### Secondary User

Temporary caregiver: friend, family member, sitter, walker, neighbour, or boarding staff.

### Core Demo Story

A dog parent is travelling for three days and leaves their dog Bruno with a caregiver. Instead of sending scattered WhatsApp messages, the owner uses Pet Guardian.

The agent:

1. Reads messy owner instructions.
2. Creates a structured care plan.
3. Creates daily care tasks.
4. Stores care state in MongoDB.
5. Shares a caregiver link.
6. Tracks verified caregiver check-ins.
7. Reads check-in data through the care memory layer.
8. Generates daily owner summaries.
9. Generates vet-ready emergency summaries if something goes wrong.

---

## 2. Hackathon Alignment

The Google Cloud Rapid Agent Hackathon asks builders to create a functional agent powered by Gemini and Google Cloud Agent Builder that integrates a partner MCP server to solve a real challenge. The submission must include a hosted project URL, public open-source repository with license, approximately three-minute demo video, track selection, and completed Devpost submission.

Pet Guardian aligns because it is not just a chatbot. It performs a real workflow:

- Understands owner instructions.
- Plans care tasks.
- Stores/retrieves care state.
- Tracks check-ins.
- Summarizes outcomes.
- Helps prepare emergency handover information.

### Required Hackathon Components

| Requirement | Pet Guardian Implementation |
|---|---|
| Gemini | Used as the reasoning model for the ADK agent |
| Google Cloud Agent Builder / ADK | Pet Guardian Agent service built with ADK |
| Partner MCP | MongoDB MCP server integrated with the ADK agent |
| Hosted project URL | Deployed web app on Cloud Run |
| Public repo | GitHub repo with MIT license |
| Demo video | 3-minute owner/caregiver/emergency workflow |
| Track | MongoDB |

---

## 3. Product Goal

Build a working MVP where judges can open a public URL and complete the full flow without installing anything.

### MVP Flow

```text
Owner opens web app
  -> creates dog profile and care instructions
  -> Next.js sends request to Pet Guardian ADK Agent
  -> ADK Agent uses Gemini to generate care plan and tasks
  -> Agent stores/retrieves care state using MongoDB MCP / MongoDB Atlas
  -> owner copies caregiver link
  -> caregiver opens link without login
  -> caregiver submits verified check-ins
  -> owner dashboard updates
  -> ADK Agent generates daily summary from stored check-ins
  -> ADK Agent generates emergency vet-ready summary when needed
```

---

## 4. Non-Negotiable Product Decisions

1. Build a **mobile-first website**, not a native mobile app.
2. Use **Google Cloud Agent Builder / ADK** as the agent brain.
3. Use **Gemini** for reasoning inside the agent.
4. Use **MongoDB** as the primary partner track.
5. Use **MongoDB MCP** as the partner MCP integration.
6. Use **MongoDB Atlas** for persistent storage.
7. Deploy the product on **Google Cloud Run** if possible.
8. Do not build a pet sitter marketplace.
9. Do not provide medical diagnosis.
10. Do not require caregiver login for MVP.

---

## 5. Architecture

### Recommended Architecture

```text
[Dog Parent / Caregiver]
        |
        v
[Next.js Mobile-first Web App]
        |
        v
[Next.js API Gateway / BFF]
        |
        v
[Pet Guardian ADK Agent Service on Cloud Run]
        |
        |-- Gemini model for reasoning
        |
        |-- MongoDB MCP tool for database access
        |
        v
[MongoDB Atlas]
        |
        |-- dogs
        |-- carePlans
        |-- careTasks
        |-- checkIns
        |-- emergencyLogs
        |-- agentRuns
```

### Key Principle

The Next.js app should not contain the core AI logic. It should call the deployed Pet Guardian Agent service.

The ADK agent owns:

- care plan generation
- task planning
- missing information detection
- daily summary generation
- emergency summary generation
- lost dog plan generation
- retrieval of care context
- orchestration of tool calls

The web app owns:

- forms
- dashboards
- caregiver check-in UI
- demo buttons
- API proxying
- presentation

---

## 6. Repository Structure

Build a monorepo so both the web app and agent are in one public repo.

```text
pet-guardian/
  README.md
  PRD.md
  LICENSE
  .gitignore
  .env.example
  docker-compose.yml                 # optional local dev

  apps/
    web/
      package.json
      next.config.ts
      src/
        app/
        components/
        lib/
        types/

    agent/
      pyproject.toml
      requirements.txt
      Dockerfile
      app/
        main.py                      # HTTP wrapper for ADK agent
        agent.py                     # Pet Guardian ADK agent definition
        prompts.py
        schemas.py
        tools/
          mongodb_mcp.py             # MCP connection/tool config
          fallback_mongo.py          # optional direct Mongo fallback for demo resilience
        services/
          json_parser.py
          audit_logger.py
```

### Practical Note

Codex should build this in a pragmatic way. If full production MCP wiring becomes unstable, keep the app functional with direct MongoDB fallback, but the README and demo must clearly include the MongoDB MCP integration path and agent architecture.

The goal is a working deployed demo, not theoretical architecture.

---

## 7. Tech Stack

### Web App

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or custom cards/buttons
- Hosted on Cloud Run or Vercel

### Agent Service

- Python
- Google Agent Development Kit (ADK)
- Gemini model through Google Cloud / Vertex AI / Gemini config
- FastAPI or similar HTTP wrapper
- Deployed to Cloud Run

### Data and MCP

- MongoDB Atlas
- MongoDB MCP Server
- MongoDB database: `pet_guardian`
- Collections:
  - `dogs`
  - `carePlans`
  - `careTasks`
  - `checkIns`
  - `emergencyLogs`
  - `agentRuns`

### Deployment

- Cloud Run for ADK agent service
- Cloud Run for web app, or Vercel for web if time is short
- Public hosted URL for judges

---

## 8. Environment Variables

Create `.env.example` in the root and service-specific examples.

### Root `.env.example`

```env
# Web
NEXT_PUBLIC_APP_URL=http://localhost:3000
PET_GUARDIAN_AGENT_URL=http://localhost:8080
DEMO_MODE=true
DEMO_RESET_KEY=demo123

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pet_guardian
MONGODB_DB=pet_guardian
MDB_MCP_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/pet_guardian

# Gemini / Google Cloud
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=

# Optional if using API-key based Gemini in local fallback
GEMINI_API_KEY=
```

### Important Security Notes

- Never expose MongoDB credentials client-side.
- Never expose Gemini credentials client-side.
- Use a demo-only MongoDB database for public judging.
- Use strong random passwords for demo database users.
- Keep `DEMO_RESET_KEY` out of the frontend.

---

## 9. Core Entities

### 9.1 Dog

```ts
{
  _id: ObjectId,
  ownerName?: string,
  name: string,
  breed?: string,
  age?: string,
  weight?: string,
  allergies?: string[],
  medications?: string[],
  foodRoutine?: string,
  behaviourNotes?: string,
  vet: {
    name?: string,
    phone?: string
  },
  emergencyContact: {
    name?: string,
    phone?: string
  },
  photoUrl?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 9.2 Care Plan

```ts
{
  _id: ObjectId,
  dogId: ObjectId,
  title: string,
  startDate: string,
  endDate: string,
  caregiverName?: string,
  caregiverContact?: string,
  ownerInstructionsRaw: string,
  aiGeneratedSummary: string,
  caregiverInstructions: string,
  criticalWarnings: string[],
  missingInfo: string[],
  shareToken: string,
  status: "draft" | "active" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

### 9.3 Care Task

```ts
{
  _id: ObjectId,
  planId: ObjectId,
  dogId: ObjectId,
  title: string,
  description?: string,
  type: "feeding" | "medicine" | "walk" | "water" | "grooming" | "health_observation" | "other",
  dueDate?: string,
  dueTime?: string,
  critical: boolean,
  status: "pending" | "done" | "skipped" | "issue",
  latestCheckInId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 9.4 Check-in

```ts
{
  _id: ObjectId,
  taskId: ObjectId,
  planId: ObjectId,
  dogId: ObjectId,
  status: "done" | "skipped" | "issue",
  note?: string,
  photoUrl?: string,
  severity: "normal" | "watch" | "urgent",
  submittedBy?: string,
  createdAt: Date
}
```

### 9.5 Emergency Log

```ts
{
  _id: ObjectId,
  dogId: ObjectId,
  planId?: ObjectId,
  type: "vomiting_diarrhea" | "injury" | "poisoning" | "breathing" | "seizure" | "lost_dog" | "other",
  rawInput: object,
  aiSummary: string,
  recommendedNextSteps: string[],
  disclaimer: string,
  createdAt: Date
}
```

### 9.6 Agent Run

```ts
{
  _id: ObjectId,
  type: "care_plan_generation" | "daily_summary" | "emergency_summary" | "lost_dog_plan",
  input: object,
  output: object,
  model?: string,
  status: "success" | "error",
  toolCalls?: object[],
  error?: string,
  createdAt: Date
}
```

---

## 10. Agent Design

### Agent Name

`pet_guardian_agent`

### Agent Responsibilities

The agent must:

1. Convert messy owner instructions into structured care handovers.
2. Detect missing safety-critical details.
3. Generate caregiver tasks.
4. Store or retrieve care memory using MongoDB MCP.
5. Summarize caregiver check-ins.
6. Generate emergency vet-ready summaries.
7. Generate lost-dog action plans.
8. Avoid diagnosis.
9. Keep outputs practical and concise.

### Agent Tools

The ADK agent should expose/use tools for:

- `create_dog_profile`
- `create_care_plan`
- `create_care_tasks`
- `get_plan_context`
- `record_checkin`
- `get_checkins_for_plan`
- `save_emergency_log`
- `save_agent_run`

Where possible, these tools should use MongoDB MCP operations. If needed, wrap MCP operations in simple agent tools so the agent can call them predictably.

### MongoDB MCP Integration Requirement

The ADK agent must be configured to use MongoDB MCP, not only direct MongoDB driver calls.

Minimum acceptable MCP proof:

1. MCP server configuration exists in the repo.
2. ADK agent has a MongoDB MCP tool integration path.
3. README explains how the MCP server connects to MongoDB Atlas.
4. Demo video shows MongoDB data being used by the agent.
5. The app persists live care data in MongoDB Atlas.

Strong proof:

1. Daily summary and emergency summary retrieve care state through the MongoDB MCP-backed tool path.
2. Agent run logs include tool-call-like records showing which data was retrieved.

---

## 11. Agent System Prompt

```text
You are Pet Guardian, an AI dog-care handover and emergency preparation agent.

Your job:
1. Convert messy owner instructions into structured dog-care plans.
2. Create clear caregiver checklists.
3. Identify missing critical safety information.
4. Use MongoDB care memory to store and retrieve dog profiles, care plans, care tasks, check-ins, and emergency logs.
5. Summarize verified caregiver check-ins for the owner.
6. Generate vet-ready emergency summaries.
7. Generate lost-dog action plans.

Rules:
- Never diagnose medical conditions.
- Never claim certainty about disease, poisoning, injury, or recovery.
- For urgent symptoms such as breathing difficulty, seizures, suspected poisoning, severe injury, collapse, repeated vomiting, repeated diarrhea, blood, or extreme lethargy, recommend contacting a veterinarian or emergency animal service immediately.
- Keep outputs practical, concise, and action-oriented.
- Do not produce generic pet advice unless directly useful to the current care plan.
- Always preserve owner-provided details exactly where safety matters, such as medicine names, dosage notes, vet contact, allergies, and emergency contacts.
- If critical information is missing, flag it instead of inventing it.
```

---

## 12. Agent Tasks and Expected JSON Outputs

### 12.1 Generate Care Plan

Input:

```json
{
  "dog": {},
  "plan": {
    "title": "Bruno 3-day care plan",
    "startDate": "2026-06-01",
    "endDate": "2026-06-03",
    "caregiverName": "Rahul",
    "ownerInstructionsRaw": "I am travelling..."
  }
}
```

Output JSON only:

```json
{
  "summary": "string",
  "caregiverInstructions": "string",
  "criticalWarnings": ["string"],
  "missingInfo": ["string"],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "type": "feeding",
      "dueTime": "08:00",
      "critical": true
    }
  ]
}
```

Rules:

- Do not invent medicine dosage.
- Do not invent vet phone.
- Mark medicine/allergy/safety tasks as critical.
- Include health observation task.
- Include water refill task if missing but reasonable.
- Include missing information list.

---

### 12.2 Generate Daily Summary

Input:

```json
{
  "dog": {},
  "carePlan": {},
  "tasks": [],
  "checkIns": []
}
```

Output JSON only:

```json
{
  "summary": "string",
  "completedTasks": ["string"],
  "missedOrSkippedTasks": ["string"],
  "issues": ["string"],
  "ownerAttentionNeeded": true,
  "nextRecommendedAction": "string"
}
```

Rules:

- Summarize only actual check-in data.
- Do not exaggerate.
- Do not diagnose.
- If urgent symptoms are mentioned, recommend vet contact.

---

### 12.3 Generate Emergency Vet Summary

Input:

```json
{
  "dog": {},
  "carePlan": {},
  "recentCheckIns": [],
  "incidentType": "vomiting_diarrhea",
  "answers": {}
}
```

Output JSON only:

```json
{
  "vetReadySummary": "string",
  "timeline": ["string"],
  "criticalKnownInfo": ["string"],
  "questionsForVet": ["string"],
  "recommendedNextSteps": ["string"],
  "disclaimer": "string"
}
```

Rules:

- Do not diagnose.
- Include known allergies, medicines, food routine, and recent check-ins.
- Include missing info.
- Recommend vet contact for urgent symptoms.

---

### 12.4 Generate Lost Dog Plan

Output JSON only:

```json
{
  "immediateActions": ["string"],
  "searchChecklist": ["string"],
  "whatsappAlert": "string",
  "posterText": "string",
  "ownerScript": "string",
  "disclaimer": "string"
}
```

Rules:

- Use provided last-seen details.
- Do not invent contact details.
- Do not claim guaranteed recovery.
- Generate copy-ready WhatsApp alert.
- Generate simple poster text.

---

## 13. Web App Pages

### 13.1 Landing Page

Route:

```text
/
```

Purpose:

Explain product and drive demo.

Required buttons:

- `Create Care Plan`
- `Try Demo as Owner`
- `Try Demo as Caregiver`

Hero copy:

```text
AI Dog Care Handover That Actually Gets Followed
```

Subtitle:

```text
Create care plans, share caregiver checklists, verify check-ins, and prepare emergency summaries.
```

---

### 13.2 Owner Create Flow

Route:

```text
/owner/new
```

Fields:

Dog profile:

- Dog name
- Breed
- Age
- Weight
- Allergies
- Medicines
- Food routine
- Behaviour notes
- Vet name
- Vet phone
- Emergency contact name
- Emergency contact phone

Care plan:

- Plan title
- Start date
- End date
- Caregiver name
- Caregiver contact optional
- Owner instructions raw textarea

Button:

```text
Generate AI Care Plan
```

On submit:

1. Send payload to web API.
2. Web API calls ADK Agent service.
3. Agent generates plan and tasks.
4. Agent stores data in MongoDB.
5. Redirect to `/owner/plan/[planId]`.

---

### 13.3 Owner Plan Review

Route:

```text
/owner/plan/[planId]
```

Show:

- Dog profile summary
- Generated care plan summary
- Critical warnings
- Missing info
- Generated tasks
- Caregiver instructions
- Caregiver link

Buttons:

- `Copy Caregiver Link`
- `Open Caregiver View`
- `Open Owner Dashboard`

---

### 13.4 Owner Dashboard

Route:

```text
/owner/dashboard/[planId]
```

Show:

- Plan title
- Dog name
- Care dates
- Overall task counts
- Pending tasks
- Completed tasks
- Skipped tasks
- Issue tasks
- Latest check-ins

Buttons:

- `Generate Daily Summary`
- `Open Emergency Mode`
- `Lost Dog Mode`

---

### 13.5 Caregiver View

Route:

```text
/caregiver/[shareToken]
```

No login required.

Show:

- Dog name
- Caregiver instructions
- Critical warnings
- Vet contact
- Emergency contact
- Today’s checklist

Each task card:

- title
- type
- due time
- critical badge
- note field
- optional photo URL field
- status buttons: Done / Skipped / Issue
- submit button

When submitted:

1. Create check-in.
2. Update task status.
3. Show confirmation.
4. If status is `issue`, show emergency mode CTA.

---

### 13.6 Emergency Mode

Route:

```text
/emergency/[planId]
```

Emergency types:

- vomiting / diarrhea
- injury
- suspected poisoning / ingestion
- breathing issue
- seizure
- lost dog
- other

For health emergency, collect:

- what happened
- when it started
- symptoms
- food/medicine given recently
- suspected ingestion
- photo/video URL optional
- breathing normal yes/no
- alert yes/no
- eating/drinking yes/no
- repeated vomiting/diarrhea yes/no

For lost dog, collect:

- last seen location
- last seen time
- collar/tag details
- microchip yes/no/unknown
- dog photo URL optional
- contact number
- behaviour notes
- reward optional

Buttons:

- `Generate Vet Summary`
- `Generate Lost Dog Action Plan`

---

## 14. Web API Gateway Endpoints

The Next.js API layer should call the ADK Agent service, not Gemini directly.

### 14.1 Create Care Plan

```text
POST /api/care-plans
```

Behavior:

- Validate request.
- Forward request to ADK agent endpoint: `/agent/generate-care-plan`.
- Return planId, dogId, shareToken, caregiverUrl, dashboardUrl.

### 14.2 Get Plan

```text
GET /api/care-plans/[planId]
```

Behavior:

- Fetch plan context from backend/agent service or direct read fallback.
- Return dog, plan, tasks, check-ins.

### 14.3 Get Caregiver Plan

```text
GET /api/caregiver/[shareToken]
```

Behavior:

- Return caregiver-safe data only.

### 14.4 Submit Check-in

```text
POST /api/check-ins
```

Behavior:

- Forward check-in request to ADK agent endpoint `/agent/record-checkin`.
- Agent records check-in and updates task status.

### 14.5 Generate Daily Summary

```text
POST /api/agent/daily-summary
```

Behavior:

- Forward planId to ADK agent endpoint `/agent/daily-summary`.
- Agent retrieves plan/check-ins and generates summary.

### 14.6 Generate Emergency Summary

```text
POST /api/agent/emergency-summary
```

Behavior:

- Forward incident data to ADK agent endpoint `/agent/emergency-summary`.

### 14.7 Generate Lost Dog Plan

```text
POST /api/agent/lost-dog-plan
```

Behavior:

- Forward lost dog data to ADK agent endpoint `/agent/lost-dog-plan`.

### 14.8 Demo Seed

```text
POST /api/demo/seed
POST /api/demo/reset
```

Rules:

- Only enabled when `DEMO_MODE=true`.
- Use reset key.
- Never wipe non-demo records.

---

## 15. ADK Agent Service HTTP Endpoints

Create a small HTTP wrapper around the ADK agent so the web app can call it.

### 15.1 Health

```text
GET /health
```

Returns:

```json
{
  "status": "ok",
  "service": "pet-guardian-agent"
}
```

### 15.2 Generate Care Plan

```text
POST /agent/generate-care-plan
```

Behavior:

1. Receive dog profile and owner instructions.
2. Agent generates structured plan.
3. Agent stores dog, care plan, tasks in MongoDB.
4. Agent logs run.
5. Return IDs and generated content.

### 15.3 Record Check-in

```text
POST /agent/record-checkin
```

Behavior:

1. Store check-in.
2. Update task status.
3. Return updated task and check-in.

### 15.4 Daily Summary

```text
POST /agent/daily-summary
```

Behavior:

1. Retrieve dog, plan, tasks, check-ins from MongoDB.
2. Generate Gemini summary.
3. Log agent run.
4. Return summary.

### 15.5 Emergency Summary

```text
POST /agent/emergency-summary
```

Behavior:

1. Retrieve dog, plan, recent check-ins.
2. Generate vet-ready summary.
3. Store emergency log.
4. Log agent run.
5. Return summary.

### 15.6 Lost Dog Plan

```text
POST /agent/lost-dog-plan
```

Behavior:

1. Retrieve dog profile.
2. Generate lost-dog action plan.
3. Store emergency log.
4. Log agent run.
5. Return action plan.

---

## 16. Verified Care Check-ins

This is the killer differentiator.

### What It Means

When a caregiver takes care of the dog, they do not only say "done" casually. They submit structured confirmation with:

- task status
- timestamp
- note
- optional photo URL
- severity

### Statuses

```text
pending
completed/done
skipped
issue
```

### Severity

```text
normal
watch
urgent
```

### Example

```json
{
  "taskTitle": "Give liver tablet after dinner",
  "status": "done",
  "note": "Tablet given after dinner at 8:15 PM",
  "severity": "normal"
}
```

### Owner Value

The owner gets proof that care happened and a summary of anything missed or concerning.

---

## 17. Demo Mode Requirements

Judges should be able to test without creating accounts.

### Homepage Demo Buttons

1. `Try Demo as Owner`
2. `Try Demo as Caregiver`
3. `Reset Demo`

### Demo Dog

```json
{
  "name": "Bruno",
  "breed": "Labrador",
  "age": "4 years",
  "weight": "28 kg",
  "allergies": ["Chicken"],
  "medications": ["Liver tablet after dinner"],
  "foodRoutine": "One scoop dry food at 8 AM and 8 PM",
  "behaviourNotes": "Pulls on leash. Avoid street dogs. Gets anxious during thunder.",
  "vet": {
    "name": "Dr Rao",
    "phone": "+91 98765 43210"
  },
  "emergencyContact": {
    "name": "Prakash",
    "phone": "+91 90000 00000"
  }
}
```

### Demo Owner Instructions

```text
I am travelling for 3 days from 1 June to 3 June. Bruno needs food at 8 AM and 8 PM. Give his liver tablet after dinner. Take him for a morning and evening walk, but avoid street dogs because he gets reactive. Refill water twice daily. Please watch for loose motion because he had stomach issues last week.
```

### Expected Tasks

- Feed breakfast at 8 AM
- Morning walk
- Refill water
- Evening walk
- Feed dinner at 8 PM
- Give liver tablet after dinner
- Health observation: stool/appetite/energy
- Night water refill

---

## 18. Medical Safety Disclaimer

Show this on emergency pages and generated summaries:

```text
Pet Guardian does not provide medical diagnosis or treatment. This summary is only to help you organize information before contacting a veterinarian. For urgent symptoms, suspected poisoning, breathing difficulty, seizures, severe injury, collapse, or repeated vomiting/diarrhea, contact a veterinarian or emergency animal service immediately.
```

The agent must never diagnose.

---

## 19. UI Design Requirements

### Visual Style

- Mobile-first
- Clean cards
- Large buttons
- Friendly but not childish
- Status badges
- Minimal friction

### Caregiver UX Rule

The caregiver should complete a check-in in under 30 seconds.

### Required Components

- `DogProfileForm`
- `CarePlanForm`
- `GeneratedPlanCard`
- `TaskCard`
- `CheckInForm`
- `StatusBadge`
- `OwnerDashboardSummary`
- `EmergencyForm`
- `VetSummaryCard`
- `LostDogPlanCard`
- `CopyLinkButton`
- `LoadingState`
- `EmptyState`

---

## 20. Acceptance Criteria

The MVP is complete only if all of the following work:

1. User can open public deployed URL.
2. User can create dog profile.
3. User can enter natural language care instructions.
4. Web app calls ADK agent service, not Gemini directly.
5. ADK agent uses Gemini to generate care plan.
6. Agent generates structured tasks.
7. Dog, plan, tasks are saved in MongoDB.
8. MongoDB MCP integration is configured and documented.
9. Owner can view generated plan.
10. Owner can copy caregiver link.
11. Caregiver can open link without login.
12. Caregiver can mark task Done / Skipped / Issue.
13. Check-in is saved in MongoDB.
14. Owner dashboard reflects check-in.
15. Agent can generate daily summary from stored check-ins.
16. Agent can generate emergency vet-ready summary.
17. Agent can generate lost-dog action plan.
18. Medical disclaimer is visible.
19. README explains ADK, Gemini, MongoDB MCP, MongoDB Atlas, and Cloud Run setup.
20. Public repo includes license.
21. Demo mode exists for judges.
22. Deployed URL works without local setup.

---

## 21. What Not To Build

Do not build:

- Native mobile app
- Payment system
- Pet sitter marketplace
- Full auth system
- Insurance flow
- Real GPS tracking
- Real WhatsApp API
- Real SMS API
- Real veterinary diagnosis
- Multi-pet complexity
- Admin panel
- Complex observability dashboard
- Extra partner integrations before MongoDB flow works

---

## 22. Build Plan for Codex

### Phase 1: Repo Setup

1. Create monorepo.
2. Create `apps/web` Next.js app.
3. Create `apps/agent` Python ADK agent service.
4. Add root README, PRD, LICENSE, env examples.
5. Add basic Cloud Run deployment notes.

### Phase 2: Agent Service

1. Setup Python app.
2. Add ADK dependency.
3. Define Pet Guardian agent.
4. Add prompts.
5. Add JSON schema validation.
6. Add Gemini model config.
7. Add MongoDB MCP integration config.
8. Add fallback MongoDB helper if needed for demo resilience.
9. Add HTTP endpoints.

### Phase 3: MongoDB

1. Create database helper.
2. Implement collections.
3. Implement create dog/plan/tasks.
4. Implement get plan context.
5. Implement record check-in.
6. Implement emergency logs.
7. Implement agent run logs.
8. Add seed/reset demo data.

### Phase 4: Web App

1. Landing page.
2. Owner create page.
3. Owner plan review page.
4. Owner dashboard.
5. Caregiver page.
6. Emergency page.
7. Demo buttons.
8. Loading and error states.

### Phase 5: Integration

1. Web API calls agent service.
2. Agent service writes to MongoDB.
3. Dashboard reads live data.
4. Check-in updates reflect immediately.
5. Summaries generated by agent.
6. Emergency mode generated by agent.

### Phase 6: Deployment

1. Create Dockerfile for agent service.
2. Create Dockerfile for web app if deploying both to Cloud Run.
3. Add deployment commands.
4. Add environment variable docs.
5. Deploy agent service.
6. Deploy web app.
7. Update `NEXT_PUBLIC_APP_URL` and `PET_GUARDIAN_AGENT_URL`.
8. Test public judge flow.

### Phase 7: Submission Polish

1. Add screenshots to README.
2. Add architecture diagram.
3. Add demo script.
4. Add clear MongoDB track explanation.
5. Add safety disclaimer.
6. Add known limitations.

---

## 23. README Requirements

README must include:

1. Project title.
2. One-liner.
3. Problem statement.
4. Why this is an agent, not a chatbot.
5. Architecture diagram.
6. Tech stack.
7. Agent workflow.
8. MongoDB MCP integration.
9. MongoDB collections.
10. Environment variables.
11. Local setup.
12. Cloud Run deployment.
13. Demo flow.
14. Safety disclaimer.
15. Hackathon track: MongoDB.
16. License.

### Mermaid Architecture Diagram

```mermaid
flowchart TD
    A[Dog Parent] --> B[Next.js Mobile Web App]
    N[Caregiver] --> B
    B --> C[Next.js API Gateway]
    C --> D[Pet Guardian ADK Agent on Cloud Run]
    D --> E[Gemini Model]
    D --> F[MongoDB MCP Server]
    F --> G[MongoDB Atlas]
    G --> H[Dog Profiles]
    G --> I[Care Plans]
    G --> J[Care Tasks]
    G --> K[Verified Check-ins]
    G --> L[Emergency Logs]
    D --> M[Daily Summary / Emergency Summary]
```

---

## 24. Demo Video Script

Target length: 3 minutes.

### 0:00 to 0:20 — Problem

Say:

```text
Pet parents usually leave dog-care instructions in WhatsApp. The problem is there is no structure, no proof, and no emergency readiness.
```

Show landing page.

### 0:20 to 0:50 — Owner Creates Plan

Open owner demo.

Show Bruno profile and messy instructions.

Click:

```text
Generate AI Care Plan
```

Say:

```text
The web app sends the request to a Pet Guardian agent built with Google ADK and powered by Gemini.
```

### 0:50 to 1:20 — Agent Generates Tasks

Show:

- summary
- critical warnings
- task checklist
- caregiver link

Say:

```text
The agent converts unstructured instructions into a structured care workflow and stores the care memory in MongoDB.
```

### 1:20 to 1:55 — Caregiver Check-in

Open caregiver link.

Mark:

- breakfast done
- walk done
- medicine done
- health observation issue

Add note:

```text
Loose motion once.
```

Say:

```text
The caregiver does not need an app. They open a link and submit verified check-ins.
```

### 1:55 to 2:25 — Owner Dashboard

Open owner dashboard.

Show updated task status.

Click:

```text
Generate Daily Summary
```

Say:

```text
The agent reads stored care state and summarizes completed, missed, and issue tasks.
```

### 2:25 to 2:50 — Emergency Mode

Open emergency mode.

Generate vet-ready summary.

Say:

```text
Pet Guardian does not diagnose. It prepares a clean vet-ready summary from dog profile, care plan, and caregiver observations.
```

### 2:50 to 3:00 — Close

Say:

```text
Pet Guardian is not a pet chatbot. It is an agentic care workflow that plans, stores, tracks, verifies, and helps respond when something goes wrong.
```

---

## 25. Submission Wording

Use this in Devpost:

```text
Pet Guardian is submitted under the MongoDB track. It is a Gemini-powered dog-care handover agent built with Google Cloud Agent Builder / ADK and exposed through a mobile-first web app. MongoDB Atlas stores the agent’s persistent care memory: dog profiles, care plans, care tasks, verified caregiver check-ins, and emergency logs. MongoDB MCP is used as the partner MCP integration so the agent workflow can inspect and retrieve care state from MongoDB and generate grounded daily summaries and emergency-ready outputs.
```

---

## 26. Sources and Official References

Use these references in README and submission notes:

1. Google Cloud Rapid Agent Hackathon Devpost: https://rapid-agent.devpost.com/
2. Google Cloud ADK documentation: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk
3. Google Cloud Run ADK deployment documentation: https://docs.cloud.google.com/run/docs/ai/build-and-deploy-ai-agents/deploy-adk-agent
4. ADK MongoDB MCP integration: https://adk.dev/integrations/mongodb/
5. MongoDB MCP Server get started: https://www.mongodb.com/docs/mcp-server/get-started/
6. MongoDB MCP Server tools: https://www.mongodb.com/docs/mcp-server/tools/

---

## 27. Final Implementation Instruction for Codex

Build a working MVP according to this PRD.

Prioritize:

1. ADK agent service first.
2. MongoDB persistence second.
3. Web app flows third.
4. MongoDB MCP documentation and integration proof fourth.
5. UI polish last.

Do not add extra features until this exact flow works:

```text
Owner creates care plan
  -> ADK agent generates tasks using Gemini
  -> data saved in MongoDB
  -> caregiver opens link
  -> caregiver submits check-ins
  -> owner dashboard updates
  -> ADK agent generates daily summary
  -> ADK agent generates emergency summary
```

The project is successful only if the deployed demo proves that Pet Guardian is an agentic care workflow, not a normal chatbot or static checklist app.
