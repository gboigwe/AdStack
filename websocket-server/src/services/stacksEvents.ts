import { EventEmitter } from 'events';
import axios from 'axios';
import WebSocket from 'ws';
import logger from '../utils/logger';

export interface StacksContractEvent {
  event_index: number;
  event_type: string;
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: {
      hex: string;
      repr: string;
    };
  };
}

export interface ParsedEvent {
  id: string;
  type: string;
  contractId: string;
  txId: string;
  blockHeight: number;
  timestamp: number;
  data: any;
}

export class StacksEventsService extends EventEmitter {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 5000;
  private maxReconnectDelay: number = 60000;
  private currentReconnectDelay: number = 5000;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  private contractAddresses: {
    campaigns: string;
    auctions: string;
    bridge: string;
    payments: string;
    governance: string;
  };

  constructor() {
    super();
    this.wsUrl = process.env.STACKS_WS_URL || 'wss://stacks-node-api.mainnet.stacks.co';

    this.contractAddresses = {
      campaigns: process.env.CAMPAIGN_CONTRACT || '',
      auctions: process.env.AUCTION_CONTRACT || '',
      bridge: process.env.BRIDGE_CONTRACT || '',
      payments: process.env.PAYMENT_CONTRACT || '',
      governance: process.env.GOVERNANCE_CONTRACT || '',
    };
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      logger.warn('Already connected or connecting to Stacks WebSocket');
      return;
    }

    this.isConnecting = true;

    try {
      logger.info(`Connecting to Stacks WebSocket: ${this.wsUrl}`);

      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        logger.info('Connected to Stacks blockchain WebSocket');
        this.isConnecting = false;
        this.currentReconnectDelay = this.reconnectDelay;
        this.subscribeToContracts();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          logger.error(`Failed to parse WebSocket message: ${error}`);
        }
      });

      this.ws.on('error', (error) => {
        logger.error(`Stacks WebSocket error: ${error.message}`);
        this.isConnecting = false;
      });

      this.ws.on('close', (code, reason) => {
        logger.warn(`Stacks WebSocket closed: ${code} - ${reason}`);
        this.isConnecting = false;
        this.ws = null;

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });

    } catch (error) {
      logger.error(`Failed to connect to Stacks WebSocket: ${error}`);
      this.isConnecting = false;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    logger.info(`Scheduling reconnect in ${this.currentReconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.currentReconnectDelay);

    // Exponential backoff
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  private subscribeToContracts(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot subscribe: WebSocket not open');
      return;
    }

    // Subscribe to contract events
    Object.entries(this.contractAddresses).forEach(([name, address]) => {
      if (address) {
        const subscribeMessage = {
          action: 'subscribe',
          event: 'contract_event',
          contract_id: address,
        };

        this.ws!.send(JSON.stringify(subscribeMessage));
        logger.info(`Subscribed to ${name} contract: ${address}`);
      }
    });

    // Also subscribe to transaction events for these contracts
    const txSubscribeMessage = {
      action: 'subscribe',
      event: 'mempool',
    };
    this.ws.send(JSON.stringify(txSubscribeMessage));
    logger.info('Subscribed to mempool events');
  }

  private handleMessage(message: any): void {
    try {
      if (message.event === 'contract_event') {
        this.handleContractEvent(message);
      } else if (message.event === 'transaction') {
        this.handleTransaction(message);
      } else if (message.event === 'block') {
        this.handleBlock(message);
      }
    } catch (error) {
      logger.error(`Error handling message: ${error}`);
    }
  }

  private handleContractEvent(message: any): void {
    try {
      const event = message.data as StacksContractEvent;

      if (!event.contract_log) {
        return;
      }

      const parsedEvent = this.parseEvent(event);

      if (parsedEvent) {
        logger.info(`Contract event: ${parsedEvent.type} from ${parsedEvent.contractId}`);
        this.emit('event', parsedEvent);
        this.emit(parsedEvent.type, parsedEvent);
      }
    } catch (error) {
      logger.error(`Error handling contract event: ${error}`);
    }
  }

  private handleTransaction(message: any): void {
    try {
      const tx = message.data;

      // Check if transaction is for one of our contracts
      const contractId = tx.contract_call?.contract_id;
      if (contractId && Object.values(this.contractAddresses).includes(contractId)) {
        logger.info(`Transaction for contract ${contractId}: ${tx.tx_id}`);
        this.emit('transaction', {
          txId: tx.tx_id,
          contractId,
          functionName: tx.contract_call?.function_name,
          sender: tx.sender_address,
          status: tx.tx_status,
        });
      }
    } catch (error) {
      logger.error(`Error handling transaction: ${error}`);
    }
  }

  private handleBlock(message: any): void {
    try {
      const block = message.data;
      logger.info(`New block: ${block.height}`);
      this.emit('block', {
        height: block.height,
        hash: block.hash,
        timestamp: block.burn_block_time,
      });
    } catch (error) {
      logger.error(`Error handling block: ${error}`);
    }
  }

  private parseEvent(event: StacksContractEvent): ParsedEvent | null {
    try {
      if (!event.contract_log) {
        return null;
      }

      const { contract_id, topic, value } = event.contract_log;

      // Parse the event value representation
      let eventData: any = {};
      try {
        // The repr field contains a Clarity value representation
        // For now, we'll store it as-is and parse specific fields as needed
        eventData = this.parseClarityValue(value.repr);
      } catch (parseError) {
        logger.warn(`Failed to parse event data: ${parseError}`);
        eventData = { raw: value.repr };
      }

      const parsedEvent: ParsedEvent = {
        id: `${event.tx_id}-${event.event_index}`,
        type: this.normalizeEventType(topic),
        contractId: contract_id,
        txId: event.tx_id,
        blockHeight: 0, // Will be updated when we have block info
        timestamp: Date.now(),
        data: eventData,
      };

      return parsedEvent;
    } catch (error) {
      logger.error(`Error parsing event: ${error}`);
      return null;
    }
  }

  private parseClarityValue(repr: string): any {
    // Basic Clarity value parser
    // This is a simplified version - in production, use a proper Clarity parser
    try {
      // Remove outer parentheses if present
      const cleaned = repr.trim().replace(/^\(|\)$/g, '');

      // Try to extract key-value pairs
      const pairs: Record<string, any> = {};
      const regex = /\((\w+)\s+([^)]+)\)/g;
      let match;

      while ((match = regex.exec(cleaned)) !== null) {
        const [, key, value] = match;
        pairs[key] = this.parseClaritySimpleValue(value);
      }

      return Object.keys(pairs).length > 0 ? pairs : { raw: repr };
    } catch (error) {
      return { raw: repr };
    }
  }

  private parseClaritySimpleValue(value: string): any {
    value = value.trim();

    // Handle u (uint)
    if (value.startsWith('u')) {
      return parseInt(value.substring(1), 10);
    }

    // Handle true/false
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1);
    }

    // Handle principal addresses
    if (value.startsWith("'")) {
      return value.substring(1);
    }

    return value;
  }

  private normalizeEventType(topic: string): string {
    // Convert print event topics to normalized event types
    const topicMap: Record<string, string> = {
      'campaign-created': 'campaign_created',
      'campaign-updated': 'campaign_updated',
      'campaign-paused': 'campaign_paused',
      'campaign-resumed': 'campaign_resumed',
      'auction-created': 'auction_created',
      'auction-bid-placed': 'auction_bid_placed',
      'auction-finalized': 'auction_finalized',
      'bridge-deposit': 'bridge_deposit',
      'bridge-withdrawal': 'bridge_withdrawal',
      'payment-processed': 'payment_processed',
      'payment-claimed': 'payment_claimed',
      'governance-proposal-created': 'governance_proposal_created',
      'governance-vote-cast': 'governance_vote_cast',
    };

    return topicMap[topic] || topic.replace(/-/g, '_');
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    logger.info('Disconnected from Stacks WebSocket');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Fetch historical events via REST API
  async fetchHistoricalEvents(contractId: string, limit: number = 50): Promise<ParsedEvent[]> {
    try {
      const apiUrl = this.wsUrl.replace('wss://', 'https://').replace('/extended/v1/ws', '');
      const response = await axios.get(
        `${apiUrl}/extended/v1/contract/${contractId}/events`,
        { params: { limit } }
      );

      const events: ParsedEvent[] = [];

      if (response.data.results) {
        for (const event of response.data.results) {
          const parsed = this.parseEvent(event);
          if (parsed) {
            events.push(parsed);
          }
        }
      }

      return events;
    } catch (error) {
      logger.error(`Failed to fetch historical events: ${error}`);
      return [];
    }
  }
}

export default new StacksEventsService();
