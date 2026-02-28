#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
COMPOSE_FILE="docker-compose.yml"
MONITORING_COMPOSE="docker-compose.monitoring.yml"

echo "Deploying AdStack to ${ENVIRONMENT}..."

if [[ ! -f ".env" ]]; then
    echo "Error: .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

echo "Pulling latest images..."
docker compose -f ${COMPOSE_FILE} pull

echo "Running database migrations..."
docker compose -f ${COMPOSE_FILE} exec -T backend npm run migrate 2>/dev/null || true

echo "Starting application services..."
docker compose -f ${COMPOSE_FILE} up -d --remove-orphans

echo "Starting monitoring stack..."
docker compose -f ${MONITORING_COMPOSE} up -d --remove-orphans

echo "Waiting for services to become healthy..."
sleep 10

SERVICES=("backend:3000" "frontend:3001" "websocket-server:3002")
ALL_HEALTHY=true

for SERVICE_PORT in "${SERVICES[@]}"; do
    SERVICE="${SERVICE_PORT%%:*}"
    PORT="${SERVICE_PORT##*:}"
    if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
        echo "  ${SERVICE}: healthy"
    else
        echo "  ${SERVICE}: not responding on port ${PORT}"
        ALL_HEALTHY=false
    fi
done

if [[ "${ALL_HEALTHY}" == "true" ]]; then
    echo "Deployment to ${ENVIRONMENT} completed successfully."
else
    echo "Warning: Some services are not healthy. Check logs with: docker compose logs"
    exit 1
fi
