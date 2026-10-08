# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    mongodb-tools

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Copy backend package.json and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./

# Copy frontend build (must be built before docker build)
COPY frontend/build ./public

# Create necessary directories
RUN mkdir -p logs exports

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start server
CMD ["node", "server.js"]