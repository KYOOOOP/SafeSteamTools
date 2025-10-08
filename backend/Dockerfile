FROM node:18-alpine AS base

# Security: Create non-root user
RUN addgroup -g 1000 -S safesteam && \
    adduser -u 1000 -S safesteam -G safesteam

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY --chown=safesteam:safesteam package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=safesteam:safesteam . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Security: Install security updates and create user
RUN apk update && apk upgrade && apk add --no-cache dumb-init && \
    addgroup -g 1000 -S safesteam && \
    adduser -u 1000 -S safesteam -G safesteam

WORKDIR /app

# Copy built application and dependencies
COPY --from=base --chown=safesteam:safesteam /app/dist ./dist
COPY --from=base --chown=safesteam:safesteam /app/node_modules ./node_modules
COPY --from=base --chown=safesteam:safesteam /app/package.json ./package.json

# Switch to non-root user
USER safesteam

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/index.js"]