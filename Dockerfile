# Use nginx as base image
FROM nginx:alpine

# Set working directory inside container
WORKDIR /app

# Copy all project files to /app
COPY . .

# Copy files from /app to nginx web directory
RUN cp -r /app/* /usr/share/nginx/html/

# Expose nginx port
EXPOSE 80
