# Pet Guardian

Pet Guardian is an AI dog-care handover agent that turns messy owner instructions into structured care plans, caregiver checklists, verified check-ins, and emergency-ready summaries.

This is intentionally not a simple Next.js-to-Gemini app. Next.js is only the mobile-first web UI and API gateway. The agent brain lives in `apps/agent`: a Python Google ADK service using Gemini for reasoning, MongoDB MCP as the partner MCP integration path, and MongoDB Atlas as care memory.

## Problem

Dog parents often leave instructions in scattered chats. Caregivers get unclear tasks, owners get little proof, and emergency handovers are hard to assemble under stress. Pet Guardian converts the handover into a tracked care workflow.

## Why This Is An Agent

The Pet Guardian agent does more than answer questions:

- Generates a structured care plan from natural language.
- Creates task checklists and flags missing safety details.
- Stores dog profiles, care plans, tasks, check-ins, emergency logs, and agent runs.
- Retrieves stored care context before daily and emergency summaries.
- Logs tool-call-like records showing MongoDB/MCP-backed context retrieval.
- Avoids diagnosis and prepares information for a veterinarian.

## Architecture

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

## Tech Stack

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS.
- `apps/agent`: FastAPI HTTP wrapper, Google ADK root agent, Gemini model calls, MongoDB persistence.
- Partner MCP: MongoDB MCP Server configured through ADK `McpToolset`.
- Persistence: MongoDB Atlas database `pet_guardian`.
- Deployment target: Google Cloud Run for both services.

## MongoDB Collections

- `dogs`
- `carePlans`
- `careTasks`
- `checkIns`
- `emergencyLogs`
- `agentRuns`

## Agent Workflow

1. Owner submits dog profile and messy care instructions in the web app.
2. Next.js posts to `/api/care-plans`.
3. The API gateway forwards to `POST /agent/generate-care-plan`.
4. The ADK agent service uses Gemini to produce JSON care-plan output.
5. The agent stores dog, plan, and tasks in MongoDB Atlas.
6. Caregiver opens a no-login share link and submits verified check-ins.
7. Agent retrieves care state and check-ins through MongoDB MCP for daily summaries and emergency summaries.

## MongoDB MCP Integration

The integration lives in [apps/agent/app/tools/mongodb_mcp.py](apps/agent/app/tools/mongodb_mcp.py). It follows the official ADK pattern:

- ADK `McpToolset`
- `StdioConnectionParams`
- `npx -y mongodb-mcp-server`
- `MDB_MCP_CONNECTION_STRING`

MongoDB MCP is now part of the actual agent workflow:

- Daily summaries call the MongoDB MCP server `find` tool to retrieve the care plan, dog profile, care tasks, and verified check-ins.
- Emergency summaries and lost-dog plans use the same MCP-first care-memory retrieval before Gemini prepares the output.
- Owner/caregiver read endpoints also try MCP first, so demo pages can show data sourced through the partner MCP path.
- `agentRuns.toolCalls` records the actual path used, for example `mongodb_mcp.find` with `mode: "mcp_server"`.
- If MCP is not configured or the MCP server fails, the service falls back to the direct MongoDB driver so the public demo still works. Writes such as creating the initial plan and updating task status remain direct MongoDB transactions for reliability.

In short: MongoDB MCP gives the agent its “care memory retrieval” superpower; direct MongoDB is retained as a resilience layer for transactional writes and fallback reads.

Official references:

- Google ADK docs: https://adk.dev/
- Google Cloud Run ADK deployment: https://docs.cloud.google.com/run/docs/ai/build-and-deploy-ai-agents/deploy-adk-agent
- ADK MongoDB MCP integration: https://adk.dev/integrations/mongodb/
- MongoDB MCP Server tools: https://www.mongodb.com/docs/mcp-server/tools/
- Hackathon: https://rapid-agent.devpost.com/

## Environment

Copy the root example:

```bash
cp .env.example .env
```

Important variables:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
PET_GUARDIAN_AGENT_URL=http://localhost:8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pet_guardian
MONGODB_DB=pet_guardian
MDB_MCP_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/pet_guardian
MDB_MCP_READ_ONLY=true
MDB_MCP_COMMAND=mongodb-mcp-server
MDB_MCP_ARGS=--readOnly --loggers stderr
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=
```

For local demos without credentials, the agent falls back to an in-memory store and deterministic JSON generation. For judging/deployment, configure MongoDB Atlas, `MDB_MCP_CONNECTION_STRING`, and Google Cloud/Gemini credentials. The agent Docker image includes Node 22 and installs `mongodb-mcp-server` so the MCP server can run on Cloud Run.

For local hackathon testing, install the MongoDB MCP binary under Node 22 and point the agent at the binary directly:

```bash
nvm use 22
npm install -g mongodb-mcp-server
which mongodb-mcp-server
```

Then set `MDB_MCP_COMMAND` in `apps/agent/.env` to the absolute path printed by `which mongodb-mcp-server`. This avoids `npx` launching through an older `node` from another shell PATH.

## Local Setup

Agent:

```bash
cd apps/agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000.

Docker Compose:

```bash
docker compose up --build
```

## Cloud Run Deployment

Agent:

```bash
gcloud run deploy pet-guardian-agent \
  --source apps/agent \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_DB=pet_guardian,GEMINI_MODEL=gemini-2.5-flash
```

Then set secrets/env vars for:

- `MONGODB_URI`
- `MDB_MCP_CONNECTION_STRING`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS` or Workload Identity/ADC

Web:

```bash
gcloud run deploy pet-guardian-web \
  --source apps/web \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_APP_URL=https://WEB_URL,PET_GUARDIAN_AGENT_URL=https://AGENT_URL
```

## Demo Flow

1. Open the web URL.
2. Click `Try Demo as Owner`.
3. Review Bruno's generated plan and copy/open the caregiver link.
4. Submit caregiver check-ins.
5. Open owner dashboard and generate daily summary.
6. Open emergency mode and generate a vet-ready summary.
7. Switch to lost dog mode and generate the action plan.

## Safety Disclaimer

Pet Guardian does not provide medical diagnosis or treatment. Emergency summaries only organize known information before contacting a veterinarian. For urgent symptoms, suspected poisoning, breathing difficulty, seizures, severe injury, collapse, or repeated vomiting/diarrhea, contact a veterinarian or emergency animal service immediately.

## Hackathon Track

MongoDB track: MongoDB Atlas stores persistent care memory, and MongoDB MCP is the partner MCP integration for the ADK agent.

## License

MIT. See [LICENSE](LICENSE).
