# Bridge Integration Examples

## Table of Contents
1. [Basic Bridge Transfer](#basic-bridge-transfer)
2. [Frontend Integration](#frontend-integration)
3. [Payment Processing](#payment-processing)
4. [Liquidity Pool Operations](#liquidity-pool-operations)
5. [Monitoring & Events](#monitoring--events)

## Basic Bridge Transfer

### Bridging from Stacks to Ethereum

```typescript
import { makeContractCall, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { stringAsciiCV, uintCV, bufferCV } from '@stacks/transactions';

async function bridgeToEthereum(
  amount: number,
  ethereumAddress: string,
  token: string = 'USDC'
) {
  const network = new StacksTestnet();

  // Generate unique transaction hash
  const txHash = Buffer.from(crypto.randomUUID().replace(/-/g, ''), 'hex');

  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'token-bridge',
    functionName: 'lock-tokens',
    functionArgs: [
      uintCV(1), // Ethereum chain ID
      stringAsciiCV(ethereumAddress),
      stringAsciiCV(token),
      uintCV(amount * 1000000), // Convert to microunits
      bufferCV(txHash)
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network,
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);

  console.log('Bridge transaction submitted:', broadcastResponse.txid);
  return broadcastResponse.txid;
}

// Usage
await bridgeToEthereum(100, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
```

### Bridging from Ethereum to Stacks

```typescript
import { ethers } from 'ethers';

const BRIDGE_ABI = [
  "function lockTokens(address token, uint256 amount, string memory recipient) external",
  "event TokensLocked(address indexed token, uint256 amount, string recipient, bytes32 txHash)"
];

async function bridgeToStacks(
  amount: ethers.BigNumber,
  stacksAddress: string,
  tokenAddress: string
) {
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const bridgeContract = new ethers.Contract(
    '0xBRIDGE_CONTRACT_ADDRESS',
    BRIDGE_ABI,
    wallet
  );

  // Approve token spending first
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount) external'],
    wallet
  );

  const approveTx = await tokenContract.approve(
    bridgeContract.address,
    amount
  );
  await approveTx.wait();

  // Lock tokens
  const lockTx = await bridgeContract.lockTokens(
    tokenAddress,
    amount,
    stacksAddress
  );
  const receipt = await lockTx.wait();

  console.log('Tokens locked on Ethereum:', receipt.transactionHash);
  return receipt.transactionHash;
}

// Usage
await bridgeToStacks(
  ethers.parseUnits('100', 6), // 100 USDC (6 decimals)
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC on Ethereum
);
```

## Frontend Integration

### React Bridge Component

```tsx
import { useConnect } from '@stacks/connect-react';
import { useState } from 'react';
import { BridgeInterface } from '@/components/bridge';

function BridgePage() {
  const { doContractCall } = useConnect();
  const [txId, setTxId] = useState<string>();

  const handleBridge = async (
    toChain: number,
    recipient: string,
    token: string,
    amount: number
  ) => {
    try {
      const txHash = Buffer.from(crypto.randomUUID().replace(/-/g, ''), 'hex');

      await doContractCall({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'token-bridge',
        functionName: 'lock-tokens',
        functionArgs: [
          uintCV(toChain),
          stringAsciiCV(recipient),
          stringAsciiCV(token),
          uintCV(amount * 1000000),
          bufferCV(txHash)
        ],
        onFinish: (data) => {
          setTxId(data.txId);
          console.log('Bridge transaction:', data.txId);
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        }
      });
    } catch (error) {
      console.error('Bridge error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <BridgeInterface onBridge={handleBridge} />
      {txId && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <p>Transaction submitted: {txId}</p>
          <a
            href={`https://explorer.stacks.co/txid/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View in Explorer
          </a>
        </div>
      )}
    </div>
  );
}
```

### Monitoring Bridge Status

```typescript
import { StacksApiWebSocketClient } from '@stacks/blockchain-api-client';

async function monitorBridgeTransaction(txId: string) {
  const client = new StacksApiWebSocketClient({
    url: 'wss://stacks-node-api.testnet.stacks.co/'
  });

  await client.connect();

  const subscription = await client.subscribeAddressTransactions(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-bridge',
    (event) => {
      console.log('Bridge event:', event);

      if (event.tx_id === txId) {
        if (event.tx_status === 'success') {
          console.log('Bridge transaction confirmed!');
          // Check validator signatures
          checkValidatorSignatures(txId);
        } else if (event.tx_status === 'abort_by_response') {
          console.error('Bridge transaction failed');
        }
      }
    }
  );

  return subscription;
}

async function checkValidatorSignatures(txHash: string) {
  // Query contract for signature count
  const response = await fetch(
    `https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/` +
    `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/token-bridge/get-transaction-info`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        arguments: [`0x${Buffer.from(txHash).toString('hex')}`]
      })
    }
  );

  const result = await response.json();
  console.log('Validator signatures:', result.result);
}
```

## Payment Processing

### Multi-Token Payment

```typescript
import { makeContractCall } from '@stacks/transactions';

async function processPayment(
  recipientAddress: string,
  token: 'USDC' | 'USDT' | 'wUSDC' | 'STX',
  amount: number
) {
  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'payment-processor-v2',
    functionName: 'process-payment',
    functionArgs: [
      principalCV(recipientAddress),
      stringAsciiCV(token),
      uintCV(amount * 1000000)
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network: new StacksTestnet(),
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);

  return broadcastResponse.txid;
}

// Usage
const paymentTxId = await processPayment(
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  'USDC',
  50.00
);
```

### Escrow Payment

```typescript
// Deposit to escrow
async function depositToEscrow(token: string, amount: number) {
  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'payment-processor-v2',
    functionName: 'deposit-to-escrow',
    functionArgs: [
      stringAsciiCV(token),
      uintCV(amount * 1000000)
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network: new StacksTestnet(),
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Pay from escrow
async function payFromEscrow(
  recipient: string,
  token: string,
  amount: number
) {
  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'payment-processor-v2',
    functionName: 'pay-from-escrow',
    functionArgs: [
      principalCV(recipient),
      stringAsciiCV(token),
      uintCV(amount * 1000000)
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network: new StacksTestnet(),
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}
```

## Liquidity Pool Operations

### Add Liquidity

```typescript
async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: number,
  amountB: number
) {
  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'liquidity-pool',
    functionName: 'add-liquidity',
    functionArgs: [
      stringAsciiCV(tokenA),
      stringAsciiCV(tokenB),
      uintCV(amountA * 1000000),
      uintCV(amountB * 1000000)
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network: new StacksTestnet(),
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

// Usage
await addLiquidity('USDC', 'STX', 1000, 500);
```

### Swap Tokens

```typescript
async function swapTokens(
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  minAmountOut: number
) {
  // First, get swap estimate
  const estimate = await getSwapEstimate(tokenIn, tokenOut, amountIn);
  console.log('Estimated output:', estimate);

  const txOptions = {
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'liquidity-pool',
    functionName: 'swap',
    functionArgs: [
      stringAsciiCV(tokenIn),
      stringAsciiCV(tokenOut),
      uintCV(amountIn * 1000000),
      uintCV(minAmountOut * 1000000) // Slippage protection
    ],
    senderKey: process.env.PRIVATE_KEY!,
    network: new StacksTestnet(),
    anchorMode: AnchorMode.Any,
  };

  const transaction = await makeContractCall(txOptions);
  return await broadcastTransaction(transaction, network);
}

async function getSwapEstimate(
  tokenIn: string,
  tokenOut: string,
  amountIn: number
) {
  const response = await fetch(
    `https://stacks-node-api.testnet.stacks.co/v2/contracts/call-read/` +
    `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/liquidity-pool/get-swap-estimate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        arguments: [
          `"${tokenIn}"`,
          `"${tokenOut}"`,
          `u${amountIn * 1000000}`
        ]
      })
    }
  );

  const result = await response.json();
  return result.result;
}

// Usage with 1% slippage tolerance
const amountIn = 100;
const estimate = await getSwapEstimate('USDC', 'STX', amountIn);
const minAmountOut = estimate.amountOut * 0.99; // 1% slippage

await swapTokens('USDC', 'STX', amountIn, minAmountOut);
```

## Monitoring & Events

### Relayer API Integration

```typescript
const RELAYER_API_URL = 'http://localhost:3001';

// Get pending transactions
async function getPendingBridgeTransactions() {
  const response = await fetch(`${RELAYER_API_URL}/api/pending`);
  const data = await response.json();
  return data.pending;
}

// Get transaction status
async function getBridgeTransactionStatus(txHash: string) {
  const response = await fetch(`${RELAYER_API_URL}/api/transaction/${txHash}`);
  const data = await response.json();
  return data.status;
}

// Monitor transaction until completion
async function waitForBridgeCompletion(
  txHash: string,
  timeout: number = 600000 // 10 minutes
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getBridgeTransactionStatus(txHash);

    if (status?.status === 'completed') {
      console.log('Bridge transaction completed!');
      return true;
    } else if (status?.status === 'failed') {
      console.error('Bridge transaction failed');
      return false;
    }

    console.log(`Status: ${status?.status}, Validators: ${status?.signatures}/3`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s
  }

  throw new Error('Bridge transaction timeout');
}

// Usage
const txHash = 'your-tx-hash';
const completed = await waitForBridgeCompletion(txHash);
```

### Event Listeners

```typescript
import { io } from 'socket.io-client';

function setupBridgeEventListeners() {
  const socket = io('ws://relayer-service.adstack.io');

  socket.on('connect', () => {
    console.log('Connected to bridge event stream');
  });

  socket.on('bridge:locked', (event) => {
    console.log('Tokens locked:', event);
    // { txHash, fromChain, toChain, token, amount, recipient }
  });

  socket.on('bridge:validated', (event) => {
    console.log('Transaction validated:', event);
    // { txHash, signatures, requiredSignatures }
  });

  socket.on('bridge:completed', (event) => {
    console.log('Bridge completed:', event);
    // { txHash, status, completedAt }
  });

  socket.on('bridge:failed', (event) => {
    console.error('Bridge failed:', event);
    // { txHash, error, failedAt }
  });

  return socket;
}

// Usage
const socket = setupBridgeEventListeners();

// Cleanup on unmount
socket.disconnect();
```

## Error Handling

```typescript
async function safeBridgeTransfer(
  toChain: number,
  recipient: string,
  token: string,
  amount: number
) {
  try {
    // Check balance first
    const balance = await getTokenBalance(token);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Check daily limit
    const dailyLimit = await getDailyLimit(token);
    const dailyUsage = await getDailyUsage(token);
    if (dailyUsage + amount > dailyLimit) {
      throw new Error('Daily limit exceeded');
    }

    // Execute bridge
    const txId = await bridgeToEthereum(amount, recipient, token);

    // Monitor status
    const completed = await waitForBridgeCompletion(txId);

    if (!completed) {
      throw new Error('Bridge transaction failed');
    }

    return { success: true, txId };
  } catch (error) {
    console.error('Bridge error:', error);
    return { success: false, error: error.message };
  }
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Bridge Integration', () => {
  it('should bridge USDC from Stacks to Ethereum', async () => {
    const txId = await bridgeToEthereum(
      100,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'USDC'
    );

    expect(txId).toBeDefined();

    // Wait for completion
    const completed = await waitForBridgeCompletion(txId);
    expect(completed).toBe(true);
  });

  it('should handle insufficient balance', async () => {
    const result = await safeBridgeTransfer(
      1,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'USDC',
      1000000 // Unrealistic amount
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });
});
```

## Best Practices

1. **Always validate addresses** before bridging
2. **Use slippage protection** for swaps
3. **Monitor transaction status** actively
4. **Handle errors gracefully** with user feedback
5. **Test on testnet** before mainnet deployment
6. **Implement rate limiting** for API calls
7. **Cache validator signatures** to reduce queries
8. **Use WebSocket** for real-time updates
9. **Set reasonable timeouts** for bridge transactions
10. **Log all transactions** for audit purposes

## Additional Resources

- [Stacks.js Documentation](https://docs.stacks.co/docs/clarity/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Bridge Architecture](./CROSS_CHAIN_BRIDGE.md)
- [API Reference](https://api.adstack.io/docs)
