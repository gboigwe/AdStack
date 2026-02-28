# Service Down Runbook

## Symptoms
- Health check endpoint returning non-200 status
- Uptime monitor alerts firing
- Users reporting 502/503 errors

## Diagnosis

### 1. Check service status
```bash
docker compose ps
pm2 status
```

### 2. Check logs
```bash
docker compose logs --tail=100 <service-name>
# Or via Grafana Loki
# Navigate to Explore > Loki > {container_name="adstack-<service>"}
```

### 3. Check resource usage
```bash
docker stats
htop
df -h
```

### 4. Check dependencies
```bash
# PostgreSQL
docker compose exec postgres pg_isready

# Redis
docker compose exec redis redis-cli ping

# Stacks API
curl -s https://api.mainnet.hiro.so/v2/info | jq .burn_block_height
```

## Resolution

### Service crashed due to OOM
1. Check memory limits in `docker-compose.yml`
2. Increase memory allocation if needed
3. Restart: `docker compose up -d <service-name>`
4. Investigate memory leak in application logs

### Service crashed due to unhandled error
1. Check error logs for stack trace
2. Check Sentry for error details
3. Restart: `docker compose restart <service-name>`
4. Deploy fix if root cause identified

### Dependency unavailable
1. If PostgreSQL down: see `database-recovery.md`
2. If Redis down: `docker compose restart redis`
3. If Stacks API down: check https://status.hiro.so, switch to fallback RPC

### Network issues
1. Check nginx: `docker compose logs nginx`
2. Verify DNS resolution: `dig adstack.io`
3. Check SSL certificates: `openssl s_client -connect adstack.io:443`

## Post-Recovery
1. Verify health endpoints return 200
2. Check Grafana dashboards for metric recovery
3. Monitor error rates for 15 minutes
4. Update incident timeline in post-mortem document
