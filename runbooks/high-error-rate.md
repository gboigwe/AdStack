# High Error Rate Runbook

## Symptoms
- Prometheus alert `HighErrorRate` firing (>5% 5xx responses)
- Spike in Sentry error reports
- Users reporting failures

## Diagnosis

### 1. Identify error patterns
```bash
# Check recent error logs
docker compose logs --tail=200 backend | grep -i "error\|ERR\|500"

# Check Sentry for grouped errors
# Navigate to Sentry > Issues > Sort by frequency
```

### 2. Check error rate by endpoint
Navigate to Grafana > System Overview > Error Rate panel.

Or query Prometheus directly:
```promql
sum by (route, method) (rate(http_requests_total{status_code=~"5.."}[5m]))
/
sum by (route, method) (rate(http_requests_total[5m]))
```

### 3. Check dependency health
```bash
# Database
docker compose exec postgres pg_isready

# Redis
docker compose exec redis redis-cli ping

# Stacks API
curl -sf http://localhost:3999/v2/info || echo "Stacks API unreachable"
```

### 4. Check resource saturation
```bash
docker stats --no-stream
```

## Resolution

### Dependency failure causing cascade
1. Identify which dependency is failing from error logs
2. Restart the dependency: `docker compose restart <dependency>`
3. Application should auto-recover once dependency is healthy

### Code regression
1. Check recent deployments: `git log --oneline -10`
2. If recent deploy correlates with error spike:
   - Rollback: `docker compose pull <service>:previous-tag && docker compose up -d <service>`
3. Fix forward if rollback is not viable

### Rate limiting or traffic spike
1. Check request rate: Grafana > System Overview > Request Rate
2. If legitimate traffic: scale horizontally
3. If attack: check source IPs in nginx access logs
```bash
docker compose logs nginx | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

### Memory or resource exhaustion
1. Check container resource limits
2. Increase limits in `docker-compose.yml` if needed
3. Restart affected containers

## Post-Recovery
1. Confirm error rate drops below 1%
2. Review Sentry for remaining unresolved issues
3. Add regression test if code bug was the cause
4. Document findings in post-mortem
