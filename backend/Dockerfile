FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm ci

# Build TypeScript
RUN npm run build

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["node", "dist/src/index.js"]