#!/bin/bash

# Build and run the Docker container

echo "Building Docker image..."
docker build -t air-land-sea .

if [ $? -eq 0 ]; then
    echo "Build successful! Starting container..."
    docker run -p 8080:8080 --name air-land-sea-game air-land-sea
else
    echo "Build failed!"
    exit 1
fi
