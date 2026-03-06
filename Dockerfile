# ---- Stage 1: Build the React client ----
FROM node:20-alpine AS build

WORKDIR /app

# Install client dependencies
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm ci

# Copy client source and build
COPY client/ ./client/
RUN cd client && npm run build

# ---- Stage 2: Production server ----
FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy server source
COPY server/src/ ./server/src/

# Copy built client assets from Stage 1
COPY --from=build /app/client/dist ./client/dist

EXPOSE 5050

CMD ["node", "server/src/index.js"]
