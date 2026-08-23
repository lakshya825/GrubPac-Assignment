FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
# Use legacy-peer-deps to bypass ts-jest/typescript conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose API port
EXPOSE 3000

# Default command runs the API
CMD ["npx", "tsx", "src/server.ts"]
