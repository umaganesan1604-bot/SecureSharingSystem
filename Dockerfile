# ==============================================================================
# Multi-Stage Dockerfile for SecureShare
# Stage 1: Build Frontend (React + Vite)
# Stage 2: Backend Container (Python + Django + Dependencies)
# ==============================================================================

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Production Image
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose Django port
EXPOSE 8000

WORKDIR /app/backend

# Create media directory for persistent encrypted storage
RUN mkdir -p /app/backend/media/encrypted_files

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
