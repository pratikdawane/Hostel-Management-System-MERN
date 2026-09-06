# Docker & Docker Compose

> Deliberately not numbered like `001`-`005` in this folder — those track feature phases
> (see `docs/ImplementationPlan.md`). This is infrastructure, not a feature.

## 1. Purpose & scope

Docker and Docker Compose let you run the whole system (frontend + backend + MongoDB) with one
command, identically on any machine. This is primarily for **local development parity** — so
every contributor runs the exact same environment instead of "works on my machine."

This does **not** replace the production recommendation in
[`docs/Architecture.md`](../Architecture.md) §8 (static hosting for the frontend + a single small
Node process + MongoDB Atlas). That guidance still stands. Docker here is a supported alternative
for local dev, and optionally a starting point for a future container-based deployment if that
becomes the right call later — not a decision that's been made.

## 2. Concepts, in plain terms

| Term | What it means here |
|---|---|
| **Image** | A frozen snapshot of an app + everything it needs to run (Node, dependencies, compiled code). Built once from a `Dockerfile`. |
| **Container** | A running instance of an image — isolated from your machine and from other containers. |
| **Dockerfile** | The recipe for building an image, step by step. |
| **Docker Compose** | A tool that starts several containers together as one unit, wires up their networking, and knows the order to start them in. |
| **Volume** | Storage that survives even if its container is removed — used here so MongoDB's data isn't lost every restart. |
| **Network** | A private network Compose creates so containers can find each other by name (e.g. the backend reaches Mongo at `mongo:27017`, not `localhost`). |

## 3. Architecture

```
                         YOUR BROWSER
                              │
              ┌───────────────┴───────────────┐
              │ http://localhost:8080 (prod)   │  http://localhost:5000/api
              │ http://localhost:5173 (dev)    │
              ▼                                 ▼
      ┌───────────────┐                 ┌───────────────┐
      │   frontend     │  published     │    backend     │  published
      │  (nginx / vite)│  port          │  (Express API) │  port
      └───────────────┘                 └───────┬────────┘
                                                  │ internal Docker network
                                                  │ mongodb://mongo:27017
                                                  ▼
                                          ┌───────────────┐
                                          │     mongo      │
                                          │   (mongo:7)    │
                                          └───────┬────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │ hostel-mongo-   │  (named volume,
                                          │ data volume     │   persists data)
                                          └────────────────┘
```

**The one rule to remember:** anything the *browser* talks to must use a `localhost:<published
port>` address. Anything *containers* talk to each other with uses the Compose *service name*
(`mongo`, `backend`) instead. Mixing these up is the #1 source of confusion — see Troubleshooting.

## 4. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running (on
  Windows, with the WSL2 backend enabled).
- Docker Compose v2, which ships with Docker Desktop — you run it as `docker compose ...` (with a
  space), not the old standalone `docker-compose`.

## 5. First-time setup

```bash
# From the repo root:
cp .env.example backend/.env              # if you don't already have one
cp frontend/.env.example frontend/.env    # if you don't already have one
cp .env.docker.example .env
```

Open the root `.env` and fill in real `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` values (32+
random characters each — see the comment in the file for a one-line generator command). This is
what Docker Compose reads; `backend/.env` is a separate file only used when running the backend
directly with `npm run dev` (no Docker) and can keep its own values. Leave `frontend/.env` at its
example defaults unless you're changing ports.

## 6. Day-to-day: development (hot reload)

```bash
docker compose up --build
```

This is the zero-flag default — Compose automatically merges `docker-compose.override.yml` on top
of `docker-compose.yml`, which swaps in hot-reload dev mode:

- Frontend: **http://localhost:5173** (Vite dev server, edits reflect instantly)
- Backend: **http://localhost:5000/api** (restarts automatically on file changes via `tsx watch`)
- Mongo: also published on **localhost:27017** for Compass/mongosh if you want to inspect data
  directly

Edit any file under `backend/src` or `frontend/src` on your host machine — the container picks it
up immediately, no rebuild needed. Stop with `Ctrl+C`, or `docker compose down` from another
terminal.

## 7. Running the real production-style build

```bash
docker compose -f docker-compose.yml up -d --build
```

Explicitly passing `-f docker-compose.yml` skips the dev override. This builds the actual
multi-stage production images (compiled backend, nginx-served static frontend) and runs them
detached (`-d`):

- Frontend: **http://localhost:8080** (built SPA, served by nginx)
- Backend: **http://localhost:5000/api**

This is the setup to test before deploying anywhere, since it's the same images a real deployment
would use.

## 8. Command reference

| Command | What it does |
|---|---|
| `docker compose up --build` | Start everything (dev mode by default), rebuilding images first |
| `docker compose -f docker-compose.yml up -d --build` | Start the production-style stack, detached |
| `docker compose down` | Stop and remove containers (data volume is kept) |
| `docker compose down -v` | Stop and remove containers **and** the Mongo data volume (full reset) |
| `docker compose ps` | List running services and their health status |
| `docker compose logs -f backend` | Follow logs for one service (`frontend`, `mongo` also work) |
| `docker compose exec backend sh` | Open a shell inside the running backend container |
| `docker compose build --no-cache backend` | Force a clean rebuild after changing dependencies |
| `docker compose run --rm backend npm run typecheck` | Run a one-off command in a fresh container (useful for future seed/migration scripts) |
| `docker system prune` | Remove unused images/containers/networks to free disk space |
| `docker volume prune` | Remove unused volumes (be careful — this can delete data) |

## 9. Environment variables

All backend values below come from the root `.env` (copied from `.env.docker.example`) or, in CI,
from GitHub Secrets written into that same file by `deploy.yml` — see §13. `backend/.env` is a
separate file, only read when running the backend directly with `npm run dev` (no Docker).

| Variable | Lives in | Used by | Notes |
|---|---|---|---|
| `PORT`, `NODE_ENV` | hardcoded in `docker-compose.yml` | backend | Fixed per environment, not meant to vary |
| `MONGODB_URI` | root `.env` (optional) | backend | Defaults to `mongodb://mongo:27017/hostel_management` (the containerized Mongo) if unset — only set this to point at an external Mongo (e.g. Atlas) |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | root `.env` | backend | Real secrets — never commit, never bake into an image |
| `CLIENT_URL` | derived from `FRONTEND_ORIGIN` | backend | Must equal the origin the browser actually loads the frontend from (`:5173` in dev, `:8080` in prod) |
| `VITE_API_URL` | root `.env` | frontend build | Baked in at **build time** — must be browser-reachable |
| `FRONTEND_ORIGIN` | root `.env` | used to set backend's `CLIENT_URL` in prod compose | Must match the frontend's published port |

## 10. Data persistence & reset

MongoDB data lives in the named volume `hostel-mongo-data`, which survives `docker compose down`
and container rebuilds. To wipe it and start fresh:

```bash
docker compose down -v
docker compose up --build
```

## 11. Troubleshooting

- **"Port already in use"** — something on your machine already uses 5000/5173/8080/27017. Either
  stop that process, or change the host-side port in the relevant `ports:` mapping (the left
  number, e.g. `"5001:5000"`).
- **CORS errors in the browser console** — `CLIENT_URL` on the backend doesn't match the origin
  the browser actually loaded the frontend from. Check you're using the right URL for the mode
  you're in (`:5173` for dev, `:8080` for production-style).
- **Frontend changes don't show up after editing `VITE_API_URL`** — this value is baked into the
  JS bundle at **build time**, not read at runtime. Restarting the container does nothing; you
  must rebuild: `docker compose build frontend` (or `-f docker-compose.yml build frontend` for
  the prod image).
- **"Cannot find module" / stale dependencies after adding a package** — the dev override keeps
  each container's own `node_modules` in a named volume so your host's `node_modules` doesn't
  overwrite it. After changing `package.json`, rebuild: `docker compose build backend` (or
  `frontend`), or delete the corresponding named volume (`backend-node-modules` /
  `frontend-node-modules`) and let it reinstall.
- **Backend keeps restarting / exits immediately** — check `docker compose logs backend`. The app
  validates all required env vars at startup and exits with a clear message if any are
  missing/invalid (see `backend/src/config/env.ts`) — this is almost always a `backend/.env`
  problem, not a Docker problem.
- **Windows-specific** — if file changes aren't detected in dev mode, ensure the repo is inside
  the WSL2 filesystem (or that Docker Desktop's WSL2 integration is enabled) rather than purely on
  a Windows drive mounted into WSL, since cross-filesystem file-watching can be unreliable.

## 12. Relationship to the non-Docker workflow

Nothing here changes how the app runs without Docker. `npm run dev` at the repo root continues to
work exactly as before — Docker is an additional, optional way to run the system, not a
replacement.

## 13. CI/CD deploy

`.github/workflows/deploy.yml` runs after `CI` succeeds on `main` (or manually via the Actions
tab). It SSHes into a server that already has this repo cloned and Docker installed, does a
`git pull`, regenerates the root `.env` from GitHub Secrets, then runs

```bash
docker compose -f docker-compose.yml up -d --build
```

— the same production-style command from §7, just executed remotely. It never bakes secrets into
an image or commits them to the repo; they're written to the gitignored root `.env` on the server
fresh on every deploy, then read by `docker-compose.yml`'s `${VAR}` references (§9).

**One-time server setup** (not automated — do this once per server):

```bash
git clone <this repo's URL> <deploy path>
cd <deploy path>
```

Docker Desktop isn't required on the server, just the Docker Engine + Compose v2 plugin.

**Required GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
|---|---|
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT` | Connect to the deploy server |
| `DEPLOY_PATH` | Absolute path to the cloned repo on that server |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Written into the root `.env` — same values described in §9 |
| `FRONTEND_ORIGIN` | The real public origin the frontend is served from; sets both the backend's `CLIENT_URL` and the root `.env` entry |
| `VITE_API_URL` | The real public URL the browser should call for the API; baked into the frontend build |

`MONGODB_URI` is intentionally not on this list — Compose still points the backend at the
containerized `mongo` service, same as local dev (see §9). Point it at MongoDB Atlas instead only
as a deliberate follow-up change to `docker-compose.yml`, not as a side effect of this workflow.

## 14. Explicitly out of scope

MongoDB authentication, TLS/HTTPS termination, a reverse proxy in front of these containers, CI
image publishing, multi-architecture builds, and any orchestration beyond Compose (Kubernetes,
Swarm, ECS). Consistent with `docs/BRD-HMS.md`'s stance against over-engineering for this
project's scale — these would be deliberate, separate decisions if ever needed.
