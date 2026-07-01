# Production Node.js Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations for npm workspace installations
COPY package.json package-lock.json turbo.json /app/
COPY frontend/apps/web/package.json /app/frontend/apps/web/

# Clean install monorepo dependencies
RUN npm ci

# Copy frontend source files
COPY frontend/ /app/frontend/

# Build the Next.js production build using Turborepo
RUN npm run build --workspace=web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built package and node_modules from builder
COPY --from=builder /app/package.json /app/package-lock.json /app/turbo.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/frontend /app/frontend

EXPOSE 3000

# Start Next.js frontend application workspace
CMD ["npm", "run", "start", "--workspace=web"]
