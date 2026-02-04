# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/client-example/package*.json ./apps/client-example/
COPY apps/server-example/package*.json ./apps/server-example/
COPY packages/utils/package*.json ./packages/utils/

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build all packages (turbo handles dependency order)
RUN npx turbo build

# Prune dev dependencies for production
RUN npm prune --omit=dev

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy built files and production node_modules
COPY --from=build /app/apps/server-example/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/index.js"]
