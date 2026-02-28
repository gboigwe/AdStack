# Blockchain Sync Issues Runbook

## Symptoms
- `BlockHeightDrift` alert firing
- Stale blockchain data in application
- Contract event processing delays
- Pending transactions not confirming

## Diagnosis

### 1. Check current block heights
```bash
# Local node/API block height
curl -s http://localhost:3999/v2/info | jq '.stacks_tip_height'

# Mainnet reference
curl -s https://api.mainnet.hiro.so/v2/info | jq '.stacks_tip_height'
```

### 2. Check blockchain monitor logs
```bash
docker compose logs --tail=100 backend | grep -i "blockchain\|block.*height\|stacks"
```

### 3. Check Stacks API connectivity
```bash
curl -sf http://localhost:3999/v2/info && echo "API OK" || echo "API UNREACHABLE"
```

### 4. Check pending transactions
```bash
curl -s "http://localhost:3999/extended/v1/tx/mempool?limit=20" | jq '.results[] | {txid: .tx_id, status: .tx_status}'
```

## Resolution

### Stacks API unreachable
1. If self-hosted: restart the Stacks node
2. If using Hiro API: check https://status.hiro.so
3. Switch to fallback API endpoint in environment config
4. Restart backend to pick up new config

### Block height drift
1. Verify the issue is not a slow epoch/Bitcoin block
2. If API is behind, wait for sync to catch up
3. If application state is stale, trigger re-sync:
   - Restart the blockchain monitor service
   - Events will be replayed from the last processed block

### Stuck transactions
1. Check transaction status:
```bash
curl -s "http://localhost:3999/extended/v1/tx/<txid>" | jq '.tx_status'
```
2. If stuck in mempool for >1 hour with normal fees:
   - Consider replacing with higher fee transaction
   - Check nonce ordering for the sender address
3. If contract call reverted: check post-conditions and contract state

### Event processing backlog
1. Check Redis queue depth:
```bash
docker compose exec redis redis-cli llen blockchain:events:pending
```
2. If backlog is large: scale event processing workers
3. Check for processing errors in logs

## Post-Recovery
1. Verify block height is current (within 2 blocks)
2. Confirm event processing is caught up
3. Check application state reflects latest blockchain data
4. Monitor for 30 minutes for recurring issues
