import { useEffect, useState, useCallback, useRef } from 'react';
import { wsClient } from '../lib/websocket';

export interface WebSocketEvent {
  id: string;
  type: string;
  contractId: string;
  txId: string;
  blockHeight: number;
  timestamp: number;
  data: any;
}

export interface UseWebSocketOptions {
  contractId?: string;
  eventTypes?: string[];
  autoConnect?: boolean;
  token?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { contractId, eventTypes, autoConnect = true, token } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<WebSocketEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  // Connect to WebSocket
  useEffect(() => {
    if (!autoConnect) return;

    const socket = wsClient.connect(token);

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);

      // Subscribe to contract if provided
      if (contractId && !subscribedRef.current) {
        wsClient.subscribe(contractId, eventTypes);
        subscribedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      subscribedRef.current = false;
    };

    const handleError = (err: any) => {
      setError(err.message || 'WebSocket error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    // Check if already connected
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);

      if (contractId && subscribedRef.current) {
        wsClient.unsubscribe(contractId);
        subscribedRef.current = false;
      }
    };
  }, [contractId, eventTypes, autoConnect, token]);

  // Listen for events
  useEffect(() => {
    if (!isConnected) return;

    const handleEvent = (event: WebSocketEvent) => {
      setLatestEvent(event);
      setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events
    };

    const handleHistory = (data: { events: WebSocketEvent[] }) => {
      setEvents(data.events);
    };

    wsClient.on('event', handleEvent);
    wsClient.on('history', handleHistory);

    return () => {
      wsClient.off('event', handleEvent);
      wsClient.off('history', handleHistory);
    };
  }, [isConnected]);

  const subscribe = useCallback((newContractId: string, newEventTypes?: string[]) => {
    wsClient.subscribe(newContractId, newEventTypes);
    subscribedRef.current = true;
  }, []);

  const unsubscribe = useCallback((unsubContractId: string) => {
    wsClient.unsubscribe(unsubContractId);
    subscribedRef.current = false;
  }, []);

  const getHistory = useCallback((historyContractId: string, limit?: number) => {
    wsClient.getHistory(historyContractId, limit);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  return {
    isConnected,
    events,
    latestEvent,
    error,
    subscribe,
    unsubscribe,
    getHistory,
    clearEvents,
  };
}

export default useWebSocket;
