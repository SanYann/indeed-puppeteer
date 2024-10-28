# Use an official Node.js image as the base image
FROM node:20-slim

# Install necessary packages for Puppeteer (Chrome dependencies + Xvfb for headful mode)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libasound2 \
    libatspi2.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils
RUN rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./

# Install node dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Ensure TypeScript is built (optional if you're using ts-node directly)
RUN npm run build

CMD ["npm", "test"]
