# CloudOps Monitor

Uptime and API monitoring SaaS. This repository is the foundation only:
folder layout, linting, formatting, and a MongoDB Atlas connection.

The API can start and answer `GET /api/v1/health`.
The background worker, tests, and React app are not built yet.

## Requirements

- Node.js 20.19 or newer (needed by ESLint 10)
- npm
- A MongoDB Atlas cluster

Redis is optional. Leave `REDIS_URL` unset and the API starts without it.

## Project layout

```text
backend/     API and, later, the worker
frontend/    React app (added in a later phase)
```

Empty folders contain a `.gitkeep` file so Git keeps the folder. Git does not track empty directories.

## Run the API

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Put your Atlas connection string in `MONGO_URI`. On macOS or Linux, use `cp .env.example .env` instead of `copy`.

Open `http://localhost:5000/api/v1/health`. A healthy response has `"success": true`, MongoDB `"connected"`, and Redis `"disabled"` until `REDIS_URL` is set.

`npm run dev` uses Node's built-in `--watch`, so the process restarts when you save a file. `npm start` runs it once, without watching.

## Lint and format

Backend:

```bash
cd backend
npm install
npm run lint
npm run format
```

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run format
```

`lint` checks JavaScript with ESLint. `format` rewrites files with Prettier. Prettier owns spacing and quotes. ESLint owns code-quality rules. `eslint-config-prettier` turns off ESLint rules that would argue with Prettier.
