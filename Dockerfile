FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install && cd client && npm install

# Copy all source files
COPY . .

# Build the React app for production (optional - can be done at runtime for dev)
# RUN cd client && npm run build

EXPOSE 5000
EXPOSE 3000