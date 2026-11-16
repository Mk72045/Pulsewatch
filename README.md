# CloudOps Monitor

Foundation for an uptime and API monitoring app. Users will later add URLs, a worker will check them, and the site will show a dashboard. That product behavior is not built yet.

What works today:

- An API process serves `GET /api/v1/health` and can place one test job on a queue.
- A worker process, started separately, reads that job and logs it.
- MongoDB Atlas stores the database connection used by the health check.
- Redis (Upstash is fine) holds the queue.
- A React page calls the health route and prints the JSON.
- One automated test covers `GET /api/v1/health`.

## Architecture

Three programs cooperate. Only two of them are Node processes that you start.

```text
Browser  -->  React app (Vite, port 5173)
                 |
                 |  HTTP  GET /api/v1/health
                 v
              API process (Express, port 5000)
                 |                         |
                 | Mongoose                | adds a job
                 v                         v
            MongoDB Atlas              Redis (Upstash)
                                           ^
                                           | waits for jobs
                                    Worker process
```

**API process** (`backend/src/server.js`). This is the website's backend. It checks `.env`, connects to MongoDB and Redis, then listens for HTTP. It should stay quick. It does not perform the background job itself. For the test route, it only writes a job into Redis and returns the job id.

**Worker process** (`backend/src/workers/worker.js`). This is a second `node` program. It waits on the BullMQ queue named `checks`. When a job appears, it logs `Processing job <id>`. It has no HTTP port. If this process stops, the API can still accept requests, and the job stays in Redis until a worker runs again.

**MongoDB.** Mongoose opens one connection for the API process. The health route reports that connection's state. No collections are defined yet.

**Redis.** Two uses, two connections:

- The health check uses the client in `backend/src/config/redis.js`.
- BullMQ opens its own connections for the queue and the worker. A worker must be allowed to wait on Redis, so its client retries without a limit. The API client fails a request quickly instead.

`docker-compose.yml` is a commented draft for running MongoDB and Redis on your machine later. The current setup uses Atlas and Upstash, so you do not need Docker to run the app.

## Requirements

- Node.js 20.19 or newer
- npm
- A MongoDB connection string (Atlas)
- A Redis URL when you want the queue (Upstash)

## Environment

Copy the examples once:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

On macOS or Linux, use `cp` instead of `copy`.

`backend/.env`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `production`, or `test` |
| `PORT` | API port, usually `5000` |
| `MONGO_URI` | Atlas connection string |
| `REDIS_URL` | Redis URL. Optional for the health route. Required for the worker and `POST /api/v1/checks/test` |
| `CLIENT_URL` | Frontend origin allowed by CORS. Use `http://localhost:5173` |

`frontend/.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API origin, `http://localhost:5000`. Vite only exposes names that start with `VITE_` |

Real `.env` files stay out of Git. If a required value is missing or invalid, the API exits before it listens.

## Run everything

Install once in each app:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Use three terminals after that.

**Terminal 1, API**

```bash
cd backend
npm run dev
```

Wait for MongoDB connected, Redis connected, and `Server listening on port 5000`. `npm start` runs the same server once, without restarting on save.

**Terminal 2, worker**

```bash
cd backend
npm run dev:worker
```

Wait for `Worker waiting for jobs on the checks queue`.

**Terminal 3, React app**

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The home page shows the health JSON. `mongodb` and `redis` should both be `"connected"`. Open `http://localhost:5173/missing` to see the not-found page.

Prove the queue from any terminal:

```bash
curl -X POST http://localhost:5000/api/v1/checks/test
```

The response contains a `jobId`. The worker terminal prints `Processing job` and that same id.

Stop a process with Ctrl+C.

## Test, lint, and format

```bash
cd backend
npm test
```

The test calls the health route in memory. It needs `backend/.env`. It does not need Atlas or Redis to be reachable. Node prints `ExperimentalWarning: VM Modules`. That warning is expected: Jest still needs that flag to load ES modules.

```bash
cd backend
npm run lint
npm run format

cd ../frontend
npm run lint
npm run format
```

ESLint checks code quality. Prettier rewrites spacing and quotes. `eslint-config-prettier` turns off ESLint rules that would fight with Prettier.

## Folder responsibilities

```text
backend/src/config/        env, logger, MongoDB, Redis
backend/src/routes/        URL map. index.js mounts everything under /api/v1
backend/src/controllers/   read the request and send the JSON response
backend/src/services/      the decision or the work, kept out of the controller
backend/src/middlewares/   logging, rate limit, 404, and the one error handler
backend/src/utils/         ApiError and asyncHandler
backend/src/queues/        BullMQ queue named "checks"
backend/src/workers/       the separate worker process
backend/src/models/        empty until data is stored
backend/tests/             Jest tests
frontend/src/pages/        one screen per route
frontend/src/components/   shared layout
frontend/src/services/     Axios client
frontend/src/hooks/        empty
frontend/src/context/      empty
frontend/src/utils/        empty
```

A request passes through the pieces in this order: route, controller, service, then the JSON response. If a route throws, `asyncHandler` sends the error to `errorHandler`, which always answers `{ success: false, message }`.

Empty folders contain `.gitkeep` so Git keeps them. Git does not store empty directories.
