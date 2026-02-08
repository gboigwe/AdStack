import express from 'express';
import { config } from 'dotenv';
import { BridgeRelayer } from './relayer';
import { logger } from './utils/logger';

config();

const app = express();
app.use(express.json());

const relayer = new BridgeRelayer({
  stacksNetwork: process.env.STACKS_NETWORK || 'testnet',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
  polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
  bscRpcUrl: process.env.BSC_RPC_URL || '',
  avalancheRpcUrl: process.env.AVALANCHE_RPC_URL || '',
  privateKey: process.env.RELAYER_PRIVATE_KEY || '',
  minValidators: parseInt(process.env.MIN_VALIDATORS || '3'),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30000'),
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    validators: relayer.getActiveValidators(),
  });
});

// Get pending transactions
app.get('/api/pending', async (req, res) => {
  try {
    const pending = await relayer.getPendingTransactions();
    res.json({ pending });
  } catch (error) {
    logger.error('Error fetching pending transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction status
app.get('/api/transaction/:txHash', async (req, res) => {
  try {
    const status = await relayer.getTransactionStatus(req.params.txHash);
    res.json({ status });
  } catch (error) {
    logger.error('Error fetching transaction status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual trigger for stuck transactions
app.post('/api/process/:txHash', async (req, res) => {
  try {
    await relayer.processTransaction(req.params.txHash);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Bridge relayer service started on port ${PORT}`);
  relayer.start();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down relayer service...');
  await relayer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down relayer service...');
  await relayer.stop();
  process.exit(0);
});
