# syntax=docker/dockerfile:1.7

# ---- Stage 1: Build the React client ----
FROM node:20-alpine AS build

WORKDIR /app

# VITE_* values are baked into the client bundle at build time. Pass them
# with --build-arg (or `build` { args } in compose) so the SPA can talk to
# Cognito and the API in production.
ARG VITE_API_URL=""
ARG VITE_COGNITO_DOMAIN
ARG VITE_COGNITO_REGION
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_REDIRECT_URI
ARG VITE_COGNITO_SCOPES="email+openid+phone"

ENV VITE_API_URL=$VITE_API_URL \
    VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN \
    VITE_COGNITO_REGION=$VITE_COGNITO_REGION \
    VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID \
    VITE_COGNITO_REDIRECT_URI=$VITE_COGNITO_REDIRECT_URI \
    VITE_COGNITO_SCOPES=$VITE_COGNITO_SCOPES

COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm ci --no-audit --no-fund --prefer-offline

COPY client/ ./client/
RUN cd client && npm run build

# ---- Stage 2: Production server ----
FROM node:20-alpine AS runtime

# tini gives us proper PID-1 signal handling (graceful SIGTERM from ECS / App Runner).
RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=5050

WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund --prefer-offline \
    && npm cache clean --force

COPY server/src/ ./server/src/
COPY --from=build /app/client/dist ./client/dist

# Drop root. node:alpine ships a uid 1000 "node" user already.
RUN chown -R node:node /app
USER node

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/src/index.js"]
