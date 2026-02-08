import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

class WebSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token?: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return this.socket;
    }

    this.token = token || null;

    this.socket = io(WS_URL, {
      auth: {
        token: this.token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
    });

    this.socket.on('connected', (data) => {
      console.log('Server welcome:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('WebSocket reconnected after', attempt, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  subscribe(contractId: string, eventTypes?: string[]) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe', { contractId, eventTypes });
  }

  unsubscribe(contractId: string) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('unsubscribe', { contractId });
  }

  getHistory(contractId: string, limit?: number) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('getHistory', { contractId, limit });
  }

  getStats(contractId: string) {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('getStats', { contractId });
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
