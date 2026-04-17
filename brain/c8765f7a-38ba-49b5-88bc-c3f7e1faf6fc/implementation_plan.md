# Integrate CrewAI via Asynchronous Task Queue

This plan details how we will integrate the Python-based CrewAI framework into your current Node.js project using an asynchronous task queue. We will use **Redis** as the message broker because it is incredibly fast, simple to set up, and has excellent libraries for both Node.js and Python.

## User Review Required

> [!IMPORTANT]
> This architecture requires **Redis** to be running on your machine (either directly installed or via Docker). Let me know if you need help setting this up.

## Proposed Changes

### 1. Node.js Backend (Producer)
We will add endpoints to your existing Node server to dispatch long-running jobs to the Python worker and check on their status:

#### [NEW] `src/services/crewai-queue.service.ts`
- A service using `ioredis` to connect to local Redis.
- A `enqueueJob` method: Generates a unique UUID, stores the initial status as `pending` under the key `crewai_job:<id>`, and pushes the job payload to a Redis list `crewai_queue`.
- A `getJobStatus` method: Reads the key `crewai_job:<id>` to return the current status/result.

#### [NEW] `src/controllers/crewai.controller.ts`
- `POST /api/crewai/job`: Receives data, calls `enqueueJob`, and immediately responds with the `jobId`.
- `GET /api/crewai/job/:id`: Retrieves and returns the job's status/result.

#### [MODIFY] `package.json`
- Add `ioredis` dependency.

### 2. Python Worker (Consumer)
We will create a standalone Python application that runs alongside your Node project continuously:

#### [NEW] `python-worker/requirements.txt`
- Dependencies: `redis`, `crewai`, `langchain-openai`, `python-dotenv`.

#### [NEW] `python-worker/worker.py`
- Connects to the local Redis instance.
- Runs a continuous `while True` loop waiting for jobs using `bzpopmin` or `brpop`.
- When a job appears in `crewai_queue`, it parses the JSON, executes a demo CrewAI task hierarchy (agents & tasks).
- Once completed, it updates the `crewai_job:<id>` Redis key with the final execution output and sets the status to `completed`.

## Open Questions

> [!WARNING]
> Please answer these before we start execution:
> 1. **Redis**: Do you have Redis installed locally, or should I provide a Docker command to spin one up easily?
> 2. **CrewAI Logic**: Do you already have specific agents/tasks built in Python that you want me to port over, or should I create a simple standard CrewAI example (like a "Research Agent") for you to modify later?
> 3. **Environment Variables**: We'll need the `OPENAI_API_KEY` to be accessible by the Python script to run crewAI. Is it fine if we just point the Python script to your existing Node `.env` file?

## Verification Plan

### Manual Verification
1. Start a local Redis server.
2. Run the Python script: `python python-worker/worker.py`.
3. Run the Node.js server: `npm run dev`.
4. Make a POST request to the Node.js server to start the job.
5. Watch the Python terminal to see CrewAI actively working.
6. Make a GET request using the Job ID to see the final CrewAI result in the Node application.
