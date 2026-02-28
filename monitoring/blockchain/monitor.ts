import axios from 'axios';
import { createLogger } from '../logging/logger';
import { blockchainTxTotal } from '../prometheus/metrics';

const logger = createLogger({ service: 'blockchain-monitor' });

interface MonitorConfig {
  stacksApiUrl: string;
  contractAddresses: string[];
  pollInterval: number;
  onEvent?: (event: ContractEvent) => void;
  onBlockHeight?: (height: number) => void;
  onFailedTx?: (tx: FailedTransaction) => void;
}

interface ContractEvent {
  txId: string;
  contractId: string;
  eventType: string;
  data: Record<string, any>;
  blockHeight: number;
  timestamp: number;
}

interface FailedTransaction {
  txId: string;
  contractId: string;
  error: string;
  sender: string;
  blockHeight: number;
}

interface BlockInfo {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
}

export class BlockchainMonitor {
  private config: MonitorConfig;
  private lastBlockHeight: number = 0;
  private lastProcessedTx: Map<string, string> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: MonitorConfig) {
    this.config = {
      pollInterval: 30000,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('Starting blockchain monitor', {
      apiUrl: this.config.stacksApiUrl,
      contracts: this.config.contractAddresses.length,
      pollInterval: this.config.pollInterval,
    });

    try {
      await this.fetchCurrentBlockHeight();
    } catch (err) {
      logger.error('Failed to fetch initial block height', { error: (err as Error).message });
    }

    this.intervalId = setInterval(() => this.poll(), this.config.pollInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Blockchain monitor stopped');
  }

  private async poll(): Promise<void> {
    try {
      await this.fetchCurrentBlockHeight();
      await this.checkContractEvents();
      await this.checkPendingTransactions();
    } catch (err) {
      logger.error('Polling error', { error: (err as Error).message });
    }
  }

  private async fetchCurrentBlockHeight(): Promise<void> {
    const response = await axios.get(`${this.config.stacksApiUrl}/v2/info`, { timeout: 10000 });
    const newHeight = response.data.stacks_tip_height;

    if (newHeight !== this.lastBlockHeight) {
      const drift = newHeight - this.lastBlockHeight;
      if (this.lastBlockHeight > 0 && drift > 5) {
        logger.warn('Large block height jump detected', {
          previous: this.lastBlockHeight,
          current: newHeight,
          drift,
        });
      }

      this.lastBlockHeight = newHeight;

      if (this.config.onBlockHeight) {
        this.config.onBlockHeight(newHeight);
      }

      logger.debug('Block height updated', { height: newHeight });
    }
  }

  private async checkContractEvents(): Promise<void> {
    for (const contractId of this.config.contractAddresses) {
      try {
        const response = await axios.get(
          `${this.config.stacksApiUrl}/extended/v1/contract/${contractId}/events`,
          {
            params: { limit: 20, offset: 0 },
            timeout: 10000,
          }
        );

        const events = response.data.results || [];
        const lastTxId = this.lastProcessedTx.get(contractId);
        const newEvents: ContractEvent[] = [];

        for (const event of events) {
          if (event.tx_id === lastTxId) break;

          const contractEvent: ContractEvent = {
            txId: event.tx_id,
            contractId,
            eventType: event.event_type,
            data: event.contract_log?.value || event.asset || {},
            blockHeight: event.block_height,
            timestamp: Date.now(),
          };

          newEvents.push(contractEvent);
          blockchainTxTotal.inc({ type: event.event_type, status: 'confirmed' });
        }

        if (newEvents.length > 0) {
          this.lastProcessedTx.set(contractId, events[0].tx_id);

          logger.info('New contract events detected', {
            contractId,
            count: newEvents.length,
          });

          if (this.config.onEvent) {
            for (const event of newEvents.reverse()) {
              this.config.onEvent(event);
            }
          }
        }
      } catch (err) {
        logger.error('Failed to fetch contract events', {
          contractId,
          error: (err as Error).message,
        });
      }
    }
  }

  private async checkPendingTransactions(): Promise<void> {
    try {
      const response = await axios.get(
        `${this.config.stacksApiUrl}/extended/v1/tx/mempool`,
        {
          params: { limit: 50 },
          timeout: 10000,
        }
      );

      const pendingTxs = response.data.results || [];
      const relevantTxs = pendingTxs.filter((tx: any) =>
        this.config.contractAddresses.some(
          (addr) =>
            tx.contract_call?.contract_id === addr ||
            tx.smart_contract?.contract_id === addr
        )
      );

      if (relevantTxs.length > 0) {
        logger.info('Pending transactions for monitored contracts', {
          count: relevantTxs.length,
        });
      }
    } catch (err) {
      logger.error('Failed to check pending transactions', {
        error: (err as Error).message,
      });
    }
  }

  async getContractState(contractId: string, functionName: string, args: string[] = []): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.stacksApiUrl}/v2/contracts/call-read/${contractId}/${functionName}`,
        {
          sender: contractId.split('.')[0],
          arguments: args,
        },
        { timeout: 10000 }
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to read contract state', {
        contractId,
        functionName,
        error: (err as Error).message,
      });
      return null;
    }
  }

  getStatus(): { running: boolean; lastBlockHeight: number; monitoredContracts: number } {
    return {
      running: this.isRunning,
      lastBlockHeight: this.lastBlockHeight,
      monitoredContracts: this.config.contractAddresses.length,
    };
  }
}
