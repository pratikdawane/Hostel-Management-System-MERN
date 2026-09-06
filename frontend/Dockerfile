# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT, not this directory:
#   docker build -f frontend/Dockerfile .
# Same reason as backend/Dockerfile: npm workspaces share one root lockfile.

# ---------- Stage: build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci -w frontend

COPY frontend ./frontend

# IMPORTANT: Vite inlines import.meta.env.VITE_* values into the static JS
# bundle at BUILD TIME (see frontend/src/services/api.ts). This value is
# never read again once the container is running - it must be a URL the
# user's BROWSER can reach (e.g. http://localhost:5000/api), never an
# internal Docker Compose service name like http://backend:5000/api, because
# the browser - not this container - is what makes the request.
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w frontend
# -> /app/frontend/dist

# ---------- Stage: production ----------
FROM nginx:1.27-alpine AS production

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
