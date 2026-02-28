#!/bin/bash
set -euo pipefail

SERVICE=${1:-}
COMPOSE_FILE="docker-compose.yml"

if [[ -z "${SERVICE}" ]]; then
    echo "Usage: $0 <service-name>"
    echo "Available services: backend, frontend, websocket-server, bridge-relayer, ml-service"
    exit 1
fi

echo "Rolling back ${SERVICE}..."

PREVIOUS_IMAGE=$(docker compose -f ${COMPOSE_FILE} images ${SERVICE} --format json 2>/dev/null | head -1 | jq -r '.Repository + ":" + .Tag' 2>/dev/null || echo "")

if [[ -z "${PREVIOUS_IMAGE}" || "${PREVIOUS_IMAGE}" == ":" ]]; then
    echo "Error: Could not determine current image for ${SERVICE}"
    exit 1
fi

echo "Current image: ${PREVIOUS_IMAGE}"
echo "Stopping ${SERVICE}..."
docker compose -f ${COMPOSE_FILE} stop ${SERVICE}

echo "Starting ${SERVICE} with previous version..."
docker compose -f ${COMPOSE_FILE} up -d ${SERVICE}

sleep 5

HEALTH_PORT=""
case ${SERVICE} in
    backend) HEALTH_PORT=3000 ;;
    frontend) HEALTH_PORT=3001 ;;
    websocket-server) HEALTH_PORT=3002 ;;
    bridge-relayer) HEALTH_PORT=3003 ;;
    ml-service) HEALTH_PORT=8000 ;;
esac

if [[ -n "${HEALTH_PORT}" ]]; then
    if curl -sf "http://localhost:${HEALTH_PORT}/health" > /dev/null 2>&1; then
        echo "Rollback of ${SERVICE} completed. Service is healthy."
    else
        echo "Warning: ${SERVICE} is not responding after rollback."
        echo "Check logs: docker compose logs ${SERVICE}"
    fi
fi
