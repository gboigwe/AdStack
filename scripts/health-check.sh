#!/bin/bash
set -euo pipefail

echo "=== AdStack System Health Check ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

check_service() {
    local name=$1
    local url=$2
    local response
    local http_code

    http_code=$(curl -sf -o /dev/null -w '%{http_code}' --max-time 5 "${url}" 2>/dev/null || echo "000")

    if [[ "${http_code}" == "200" ]]; then
        echo "  [OK]   ${name} (${url})"
    else
        echo "  [FAIL] ${name} (${url}) - HTTP ${http_code}"
    fi
}

echo "Application Services:"
check_service "Backend API" "http://localhost:3000/health"
check_service "Frontend" "http://localhost:3001"
check_service "WebSocket" "http://localhost:3002/health"
check_service "Bridge Relayer" "http://localhost:3003/health"
check_service "ML Service" "http://localhost:8000/health"

echo ""
echo "Monitoring Services:"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3100/api/health"
check_service "Loki" "http://localhost:3200/ready"
check_service "Alertmanager" "http://localhost:9093/-/healthy"

echo ""
echo "Infrastructure:"

# PostgreSQL
if docker compose exec -T postgres pg_isready -q 2>/dev/null; then
    echo "  [OK]   PostgreSQL"
else
    echo "  [FAIL] PostgreSQL"
fi

# Redis
if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "  [OK]   Redis"
else
    echo "  [FAIL] Redis"
fi

echo ""
echo "Docker Containers:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  Could not list containers"

echo ""
echo "Disk Usage:"
df -h / | tail -1 | awk '{printf "  Used: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo "Docker Disk Usage:"
docker system df 2>/dev/null | head -5 || echo "  Could not get Docker disk usage"
