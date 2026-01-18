FROM node:20-slim

# Install common tools for bash execution
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY . .

# Create sandbox directory
RUN mkdir -p /app/sandbox

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
