# Multi-stage Dockerfile for Air, Land & Sea game
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy backend source
COPY models/ ./models/
COPY service/ ./service/
COPY handlers/ ./handlers/
COPY main.go ./

# Build backend
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# Stage 3: Final runtime image
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy backend binary from builder
COPY --from=backend-builder /app/server /app/server

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080

# Run the server
CMD ["/app/server"]
