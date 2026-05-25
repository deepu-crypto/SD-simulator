# AGENTS.md

## Cursor Cloud specific instructions

### Project structure

The application code lives under `scratch/`:
- `scratch/node-express-backend/` — Express 5 + TypeScript backend (port 3002)
- `scratch/interview-frontend/` — React 19 + Vite 8 frontend (port 5173)
- `scratch/node-express-backend/python-worker/` — Optional CrewAI Python worker (requires Redis)

Top-level directories like `annotations/`, `brain/`, `conversations/`, `implicit/`, `knowledge/`, `code_tracker/` are Cursor IDE metadata, not application code.

### Running services

| Service | Command | Directory | Port |
|---------|---------|-----------|------|
| Backend | `npm run dev` | `scratch/node-express-backend` | 3002 |
| Frontend | `npm run dev` | `scratch/interview-frontend` | 5173 |

### Key startup notes

- After `npm install`, run `chmod +x node_modules/.bin/*` in both `scratch/node-express-backend/` and `scratch/interview-frontend/` — the committed `node_modules` in the backend has broken executable permissions.
- The backend requires a `.env` file. Copy from `.env.example`. To use mock LLM responses (no OpenAI key needed), set `OPENAI_API_KEY=development_mock_key_only`.
- Redis connection errors on startup are expected and non-blocking — Redis is only needed for the optional CrewAI pipeline feature (`/crewai/*` endpoints).
- The backend uses nodemon + ts-node for hot-reload in dev mode.

### Lint / Build / Test

- **Frontend lint**: `cd scratch/interview-frontend && npm run lint` (ESLint; 4 pre-existing `no-explicit-any` errors in `App.tsx`)
- **Backend type check**: `cd scratch/node-express-backend && npx tsc --noEmit`
- **Backend build**: `cd scratch/node-express-backend && npm run build`
- **Frontend build**: `cd scratch/interview-frontend && npm run build`
- No automated test suite exists in this repository.
