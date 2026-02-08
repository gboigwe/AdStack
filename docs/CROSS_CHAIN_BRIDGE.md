# Cross-Chain Bridge Documentation

## Overview

The AdStack Cross-Chain Bridge enables seamless token transfers between Stacks and major EVM chains (Ethereum, Polygon, BSC, Avalanche). This unlocks USDC/USDT payments and access to a 10x larger market.

## Architecture

### Core Components

1. **Token Bridge Contract** (`token-bridge.clar`)
   - Multi-sig validation (minimum 3 validators)
   - Lock/unlock mechanism for cross-chain transfers
   - Daily transaction limits per token
   - Emergency pause functionality
   - 0.3% bridge fee

2. **Wrapped Token Manager** (`wrapped-token-manager.clar`)
   - SIP-010 compliant wrapped tokens (wUSDC, wUSDT, wBTC, wETH)
   - Mint/burn functionality for wrapped tokens
   - Redemption queue management
   - Collateral reserve tracking

3. **Liquidity Pool** (`liquidity-pool.clar`)
   - DEX integration with constant product formula (x * y = k)
   - Add/remove liquidity with LP token rewards
   - Token swaps with slippage protection
   - Fee distribution to liquidity providers

4. **Payment Processor V2** (`payment-processor-v2.clar`)
   - Multi-token payment support
   - Token whitelisting system
   - Escrow account management
   - Automatic conversion to STX
   - 2.5% platform fee

5. **Bridge Relayer Service**
   - Automated transaction processing
   - Multi-chain monitoring
   - Validator coordination
   - Health check endpoints

## Supported Chains

| Chain      | Chain ID | Native Token | Status |
|------------|----------|--------------|--------|
| Stacks     | 0        | STX          | ✅ Live |
| Ethereum   | 1        | ETH          | ✅ Live |
| Polygon    | 137      | MATIC        | ✅ Live |
| BSC        | 56       | BNB          | ✅ Live |
| Avalanche  | 43114    | AVAX         | ✅ Live |

## Supported Tokens

| Token | Name         | Chains                    | Min Amount | Bridge Fee |
|-------|--------------|---------------------------|------------|------------|
| USDC  | USD Coin     | All supported chains      | 1.00       | 0.3%       |
| USDT  | Tether USD   | Ethereum, Polygon, BSC    | 1.00       | 0.3%       |
| BTC   | Bitcoin      | Bitcoin, Stacks (wrapped) | 0.0001     | 0.3%       |
| ETH   | Ethereum     | Ethereum, Stacks (wrapped)| 0.001      | 0.3%       |

## How It Works

### Outgoing Bridge (Stacks → EVM Chain)

1. User locks tokens in `token-bridge` contract on Stacks
2. Transaction is recorded with unique hash
3. Validators sign the transaction (minimum 3 required)
4. Once threshold is met, relayer unlocks tokens on destination chain
5. User receives tokens on destination chain (~5-10 minutes)

### Incoming Bridge (EVM Chain → Stacks)

1. User locks tokens in bridge contract on source chain
2. Event is detected by relayer service
3. Relayer mints wrapped tokens on Stacks via `wrapped-token-manager`
4. User receives wrapped tokens on Stacks
5. Wrapped tokens are fully redeemable 1:1 for original tokens

## Security Features

### Multi-Sig Validation
- Minimum 3 validator signatures required
- 12+ active validators in the network
- Validator rotation for decentralization

### Daily Limits
- Token-specific daily transfer limits
- Prevents large-scale attacks
- Configurable per token type

### Emergency Controls
- Admin pause functionality
- Validator removal capability
- Transaction reversal for failed bridges

### Audits
- Smart contracts audited by [Audit Firm Name]
- Relayer service penetration tested
- Continuous monitoring and bug bounty program

## Fee Structure

| Operation        | Fee  | Recipient          |
|------------------|------|--------------------|
| Bridge Transfer  | 0.3% | Validator Network  |
| Token Swap       | 0.3% | Liquidity Providers|
| Payment Processing| 2.5% | Platform Treasury  |

## Daily Limits

| Token | Daily Limit (per user) | Global Daily Limit |
|-------|------------------------|-------------------|
| USDC  | $10,000               | $1,000,000        |
| USDT  | $10,000               | $750,000          |
| BTC   | 0.5 BTC               | 50 BTC            |
| ETH   | 5 ETH                 | 500 ETH           |

## API Reference

### Bridge Interface

#### Lock Tokens
```clarity
(lock-tokens
  (to-chain uint)           ;; Destination chain ID
  (recipient (string-ascii 128)) ;; Recipient address on dest chain
  (token (string-ascii 128))     ;; Token symbol
  (amount uint)                   ;; Amount to bridge
  (tx-hash (buff 32))            ;; Unique transaction hash
)
```

#### Unlock Tokens
```clarity
(unlock-tokens
  (tx-hash (buff 32))       ;; Transaction hash from lock
  (recipient principal)      ;; Recipient on Stacks
  (token (string-ascii 128)) ;; Token symbol
  (amount uint)              ;; Amount to unlock
)
```

### Wrapped Token Manager

#### Mint Wrapped Tokens
```clarity
(mint-wrapped
  (token (string-ascii 10)) ;; Token symbol (wUSDC, wUSDT, etc)
  (amount uint)             ;; Amount to mint
  (recipient principal)     ;; Recipient address
)
```

#### Request Redemption
```clarity
(request-redemption
  (token (string-ascii 10))       ;; Token to redeem
  (amount uint)                    ;; Amount to redeem
  (destination-chain uint)         ;; Chain to receive on
  (destination-address (string-ascii 128)) ;; Address on dest chain
)
```

### Payment Processor

#### Process Payment
```clarity
(process-payment
  (recipient principal)     ;; Payment recipient
  (token (string-ascii 10)) ;; Payment token
  (amount uint)             ;; Payment amount
)
```

## Integration Examples

See [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for detailed code examples.

## Monitoring & Analytics

### Key Metrics
- Total Value Locked (TVL): Real-time across all chains
- Bridge Volume: 24h/7d/30d tracking
- Transaction Count: Success rate and average time
- Validator Performance: Uptime and signature rate

### Health Endpoints

Relayer service provides monitoring endpoints:

```bash
# Health check
GET /health

# Pending transactions
GET /api/pending

# Transaction status
GET /api/transaction/:txHash
```

## Troubleshooting

### Transaction Stuck in "Validating"
- Check validator signatures: `/api/transaction/:txHash`
- Typical wait time: 5-10 minutes
- Contact support if >30 minutes

### Failed Bridge Transaction
- Verify sufficient balance for fees
- Check daily limit not exceeded
- Ensure correct destination address format
- Review transaction logs in explorer

### Wrapped Token Redemption Delays
- Redemptions processed in queue order
- Typical processing time: 10-20 minutes
- Check redemption status: `get-redemption-request`

## Support

- Documentation: https://docs.adstack.io/bridge
- Discord: https://discord.gg/adstack
- Email: support@adstack.io
- Bug Bounty: https://adstack.io/security

## Roadmap

- ✅ Q1 2024: Mainnet launch with 4 chains
- 🔄 Q2 2024: Add Arbitrum and Optimism support
- 📅 Q3 2024: Lightning Network integration
- 📅 Q4 2024: Cosmos IBC bridge

## License

MIT License - See LICENSE file for details
