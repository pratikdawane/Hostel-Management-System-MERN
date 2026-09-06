# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT, not this directory:
#   docker build -f backend/Dockerfile .
# This is required because backend/ and frontend/ are npm workspaces sharing
# one root package-lock.json — `npm ci` validates the lockfile against every
# workspace declared in the root package.json, so both workspace manifests
# must be present even though this image only builds the backend.

# ---------- Stage: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Manifests only first, so this layer is cached until a dependency changes.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci -w backend

# Now bring in the actual source and compile TypeScript -> backend/dist.
COPY backend ./backend
RUN npm run build -w backend

# ---------- Stage: production ----------
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Separate, production-only install (no devDependencies: no tsx/typescript/eslint).
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci -w backend --omit=dev && npm cache clean --force

# Only the compiled output is copied in from the build stage - no TS source,
# no test files, no devDependencies end up in the final image.
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist

WORKDIR /app/backend

# Official node image already ships a non-root "node" user (uid 1000) -
# run as it instead of root.
USER node

EXPOSE 5000

# Uses Node's built-in fetch so no curl/wget needs to be installed on Alpine.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

# Exec form (not "npm start") so node is PID 1 and receives SIGTERM directly -
# backend/src/server.ts already handles SIGTERM/SIGINT for a graceful shutdown.
CMD ["node", "dist/server.js"]
