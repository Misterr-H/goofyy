# Use official Node.js LTS image
FROM node:20

# Install ffmpeg and yt-dlp via apt
RUN apt-get update && \
    apt-get install -y ffmpeg yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Build the backend
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"] 