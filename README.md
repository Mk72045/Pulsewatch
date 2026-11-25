# Pulsewatch

Uptime and API monitoring. A user adds a URL, a scheduler checks it on a fixed
interval, two consecutive failures open an incident, and both the outage and the
recovery are delivered by email and Telegram through a MongoDB-backed outbox.

There is a public status page too: the owner can share one address that shows
monitor names and status without anyone logging in.

## What it does

- **Monitor a URL** on a 1, 5, 10 or 30 minute interval, up to a per-user cap.
- **Confirm before alarming.** One failed check does not mark a site down. It
  retries in 60 seconds, and only a second consecutive failure opens an incident.
- **Alert on state change only.** Going down sends an alert, coming back up sends
  a recovery notice. A healthy check sends nothing, so a one minute interval does
  not mean 1,440 emails a day.
- **Never lose an alert.** Every message is written to the outbox first and
  delivered by a separate step, so a slow or failing provider cannot block a check.
  Failed sends retry after 2, 4, 8 minutes and then every 15 minutes, and are
  abandoned after 24 hours.
- **Keep the history.** Every check is stored with its status code and response
  time, and the detail page turns that into a response-time chart and an uptime
  percentage. Rows expire after 7 days.
- **Show it publicly.** A status page at `/status/:token`, with a random 48
  character token, that reveals nothing private.

## Stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind v4, React Router 7, axios, sonner |
| Backend | Node 20.19+, Express 5, Mongoose 9, zod 4 |
| Database | MongoDB (Atlas in production) |
| Email | Brevo HTTPS API |
| Telegram | Bot API, inbound through long polling |
| Hosting | Render (API) and Vercel (SPA, proxying `/api/*`) |

Both apps are ES modules. There is no root workspace: `backend/` and `frontend/`
install separately.

## Running it

You need Node 20.19 or newer, a MongoDB connection string, and optionally a
Brevo key and a Telegram bot token.

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Fill in `MONGO_URI`, `JWT_SECRET` (at least 32 characters) and `CLIENT_URL` in
`backend/.env`. Email and Telegram are optional: without those keys the app runs
and simply cannot send on that channel.

```bash
cd backend
npm install
npm run dev
```

`npm run dev` starts the HTTP server, the scheduler and the Telegram poller in a
single process. In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The API is at `http://localhost:5000`, the app at `http://localhost:5173`.

## Architecture

```text
Browser  ->  React SPA (Vite)
                 |  axios, withCredentials, JWT in an httpOnly cookie
                 v
            Express API  ----------------------------------------------.
                 |                                                      |
                 | Mongoose                                             | Brevo HTTPS
                 v                                                      | Telegram Bot API
            MongoDB  <-- scheduler, outbox, incidents                   |
                 ^                                                      |
                 '------------------------------------ outbox delivery --'
```

Everything runs **inside the API process**: the scheduler, the outbox delivery
and the Telegram poller. There is no separate worker and no Redis.

That means **run exactly one instance.** Two instances would both long-poll
`getUpdates` for the same bot and Telegram answers one of them with HTTP 409.

A request travels route, controller, service, model. Route handlers are wrapped
in `asyncHandler`, so a thrown error reaches the single error handler.

### The check pipeline

Every `SCHEDULER_TICK_SECONDS` the scheduler runs one round:

1. Find active monitors whose `nextCheckAt` has passed, up to
   `MAX_CHECKS_PER_TICK`, and process them `CHECKS_AT_ONCE` at a time.
2. **Claim** each one with a compare-and-set update on `nextCheckAt`. If a second
   round or a second instance already took it, nothing matches and it is skipped.
3. `checkUrl()` with a timeout. It never throws: it returns
   `{ ok, statusCode, responseTimeMs, error }`.
4. Decide the next state. One failure keeps the old status and schedules a retry
   in `RETRY_DELAY_SECONDS`. The second consecutive failure sets `down`.
5. Save the result, filtered on the URL read earlier, so a monitor that was
   edited or deleted mid-check discards the result.
6. Store a `CheckResult`, then open or close an incident and queue the alert.
7. Deliver whatever is due in the outbox.

### Why two failures

A single timeout is usually a blip: a dropped packet, a momentarily overloaded
origin, a slow DNS answer. Paging someone for that destroys trust in the tool.
Two consecutive failures costs one extra retry interval and removes nearly all
of that noise.

### Why an outbox

Sending inline couples the health checker to the slowest external service in the
system. If Brevo takes eight seconds, every monitor checked in that window waits
eight seconds. The outbox breaks that link: a check writes a row and moves on,
and delivery is a separate step that can fail, retry and back off on its own.

### SSRF protection

Users supply URLs, and the server fetches them, which is exactly the shape of a
server-side request forgery bug. Two layers stop it:

- `utils/urlSafety.js` rejects private, loopback and link-local hosts when the
  monitor is created.
- `checker.service.js` supplies a custom `lookup` to the HTTP request, so the
  **resolved** address is checked at connect time. This defeats DNS rebinding,
  where a hostname resolves to a public address during validation and to
  `127.0.0.1` a moment later.

Any new outbound request to a user-supplied URL must keep both layers.

## API

All routes are under `/api/v1`. Success is `{ success: true, message?, data? }`
and errors are `{ success: false, message, details? }`, where `details` is
`[{ field, message }]` and drives the per-input errors in the UI.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | no | API and database reachability |
| POST | `/auth/register` | no | Create an account, email a 6-digit code |
| POST | `/auth/verify-email` | no | Check the code, verify, log in |
| POST | `/auth/resend-verification` | no | Send a new code, 60s cooldown |
| POST | `/auth/login` | no | Log in, set the cookie |
| POST | `/auth/logout` | yes | Clear the cookie |
| GET | `/auth/me` | yes | The current user |
| GET | `/monitors` | yes | The user's monitors |
| POST | `/monitors` | yes | Add a monitor |
| GET | `/monitors/summary` | yes | Uptime and average response, last 24h |
| GET | `/monitors/:id/history` | yes | Chart data, `?range=6h\|24h\|7d` |
| GET | `/monitors/:id` | yes | One monitor |
| PATCH | `/monitors/:id` | yes | Edit, pause or resume |
| DELETE | `/monitors/:id` | yes | Delete, with its history and incidents |
| GET | `/incidents` | yes | The latest 50 incidents |
| POST | `/notifications/telegram/link` | yes | Start linking a chat |
| DELETE | `/notifications/telegram` | yes | Unlink |
| POST | `/notifications/telegram/test` | yes | Send a test message |
| GET | `/status-settings` | yes | Is the public page on |
| PUT | `/status-settings` | yes | Turn the public page on or off |
| GET | `/status/:token` | **no** | The public status page |

`/monitors/summary` and `/monitors/:id/history` must stay above `/monitors/:id`
in `routes/monitor.routes.js`. Express matches in order, so a later `/summary`
would be read as a monitor whose id is the word "summary".

## Data model

| Model | Purpose | Notable index / TTL |
| --- | --- | --- |
| `User` | Account, Telegram chat, public status token | unique `email`, sparse unique `publicStatusToken` |
| `Monitor` | URL, interval, latest result, `nextCheckAt` | unique `{user,url}`, `{isActive,nextCheckAt}` for the scheduler |
| `CheckResult` | One row per check | TTL 7 days on `checkedAt`, `{monitor,checkedAt}` for the chart |
| `Incident` | One row per outage, open while `resolvedAt` is null | `{monitor,resolvedAt}`, `{user,startedAt}` |
| `OutboxMessage` | Queued message and its retry state | `{status,nextAttemptAt}`, TTL on `finishedAt` |

There are no migrations. Mongoose creates the indexes from the schemas when it
connects.

## Checks and commands

```bash
cd backend && npm run lint
cd frontend && npm run lint
cd frontend && npm run build
```

There is **no test runner**. An earlier version of this project used Jest, and
that suite and its script have been removed. Backend changes are verified with
lint plus a manual run against a development `.env`; frontend changes with lint
and a production build.

## Frontend notes

- Tailwind v4 is configured in `src/index.css` only. There is no
  `tailwind.config.js`.
- `AuthContext` calls `/auth/me` on mount and holds `loading` until it answers,
  so a logged-in user is not bounced to `/login`.
- `services/*.js` holds one function per endpoint. Pages never call axios.
- `utils/handleApi.js` wraps every call and returns `{ ok, data }` or
  `{ ok, error }`, with a de-duplicated error toast.
- Data pages use `status` of exactly `"loading" | "error" | "ready"` plus a
  `reloadKey` for retry.
- `ResponseChart` is plain SVG with no charting library: a polyline per run of
  buckets that has data, and one rectangle per bucket for the uptime strip.

## Deployment

Render hosts the API and Vercel hosts the SPA, rewriting `/api/:path*` to the
Render URL in `frontend/vercel.json`. The cookie is `sameSite: "lax"`, which
would not be sent cross-site, so the proxy keeps the API call first-party.

`TRUST_PROXY` must equal the number of proxies in front of the app (2 behind
Vercel and Render) or rate limiting and `secure` cookies misbehave.