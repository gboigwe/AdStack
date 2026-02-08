import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWebSocket, WebSocketEvent } from '@/hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import {
  Activity,
  Eye,
  MousePointer,
  DollarSign,
  Gavel,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Filter,
  ChevronDown,
} from 'lucide-react';

export interface ActivityFeedProps {
  contractId: string;
  maxEvents?: number;
  autoScroll?: boolean;
  showFilters?: boolean;
  enableGrouping?: boolean;
  height?: number;
}

type EventType = 'all' | 'impression' | 'click' | 'bid' | 'transaction' | 'error' | 'info';

interface EventTypeConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const EVENT_TYPE_CONFIG: Record<string, EventTypeConfig> = {
  impression: {
    label: 'Impression',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  click: {
    label: 'Click',
    icon: <MousePointer className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  bid: {
    label: 'Bid',
    icon: <Gavel className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  transaction: {
    label: 'Transaction',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  contract: {
    label: 'Contract',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  error: {
    label: 'Error',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  warning: {
    label: 'Warning',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  success: {
    label: 'Success',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  info: {
    label: 'Info',
    icon: <Info className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  default: {
    label: 'Event',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

export default function ActivityFeed({
  contractId,
  maxEvents = 100,
  autoScroll = true,
  showFilters = true,
  enableGrouping = false,
  height = 600,
}: ActivityFeedProps) {
  const { isConnected, events, error } = useWebSocket({
    contractId,
    autoConnect: true,
  });

  const [filteredEvents, setFilteredEvents] = useState<WebSocketEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EventType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Filter events
  useEffect(() => {
    let filtered = events.slice(0, maxEvents);

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((event) => {
        const eventType = getEventType(event);
        return eventType === selectedFilter;
      });
    }

    setFilteredEvents(filtered);
  }, [events, selectedFilter, maxEvents]);

  // Auto-scroll to latest
  useEffect(() => {
    if (autoScroll && feedRef.current && filteredEvents.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [filteredEvents, autoScroll]);

  // Close filter menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      const type = getEventType(event);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [events]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getEventTypeConfig = (event: WebSocketEvent): EventTypeConfig => {
    const type = getEventType(event);
    return EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.default;
  };

  const getEventDescription = (event: WebSocketEvent): string => {
    const { type, data } = event;

    if (data.description) return data.description;

    switch (type) {
      case 'impression':
        return data.campaignName
          ? `Impression recorded for ${data.campaignName}`
          : 'New impression recorded';
      case 'click':
        return data.campaignName
          ? `Click on ${data.campaignName}`
          : 'New click recorded';
      case 'bid':
        return data.amount
          ? `Bid placed: $${data.amount}`
          : 'New bid placed';
      case 'transaction':
        return data.amount
          ? `Transaction completed: $${data.amount}`
          : 'Transaction completed';
      default:
        return data.message || 'Event received';
    }
  };

  const getEventDetails = (event: WebSocketEvent): string[] => {
    const details: string[] = [];
    const { data } = event;

    if (data.campaignId) details.push(`Campaign: ${data.campaignId}`);
    if (data.publisher) details.push(`Publisher: ${data.publisher}`);
    if (data.bidder) details.push(`Bidder: ${data.bidder}`);
    if (data.amount) details.push(`Amount: $${data.amount}`);
    if (data.txId) details.push(`TX: ${data.txId.slice(0, 8)}...`);

    return details;
  };

  const filterOptions: { value: EventType; label: string }[] = [
    { value: 'all', label: 'All Events' },
    { value: 'impression', label: 'Impressions' },
    { value: 'click', label: 'Clicks' },
    { value: 'bid', label: 'Bids' },
    { value: 'transaction', label: 'Transactions' },
    { value: 'error', label: 'Errors' },
    { value: 'info', label: 'Info' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Feed</h2>
            <p className="text-sm text-gray-600">
              {filteredEvents.length} of {events.length} events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showFilters && (
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {filterOptions.find((f) => f.value === selectedFilter)?.label}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                          selectedFilter === option.value
                            ? 'bg-blue-50 text-blue-600'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {option.label}
                        {option.value !== 'all' && eventCounts[option.value] > 0 && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {eventCounts[option.value]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div
        ref={feedRef}
        className="bg-white rounded-lg border border-gray-200 overflow-y-auto"
        style={{ height: `${height}px` }}
      >
        <div className="divide-y divide-gray-200">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No events yet</p>
              {!isConnected ? (
                <p className="text-sm mt-2">Waiting for connection...</p>
              ) : selectedFilter !== 'all' ? (
                <p className="text-sm mt-2">
                  No {filterOptions.find((f) => f.value === selectedFilter)?.label.toLowerCase()} found
                </p>
              ) : (
                <p className="text-sm mt-2">Events will appear here as they occur</p>
              )}
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const config = getEventTypeConfig(event);
              const description = getEventDescription(event);
              const details = getEventDetails(event);
              const isNew = index === 0;

              return (
                <div
                  key={event.id}
                  className={`p-4 hover:bg-gray-50 transition-all ${
                    isNew ? 'animate-slideIn' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor} ${config.color} shrink-0`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {description}
                          </p>

                          {details.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {details.map((detail, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="text-xs text-gray-500 shrink-0">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>

                      {event.blockHeight && (
                        <p className="text-xs text-gray-500 mt-1">
                          Block #{event.blockHeight}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 300ms ease-out;
        }
      `}</style>
    </div>
  );
}

function getEventType(event: WebSocketEvent): string {
  const { type, data } = event;

  // Check event type
  if (type) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('impression')) return 'impression';
    if (lowerType.includes('click')) return 'click';
    if (lowerType.includes('bid')) return 'bid';
    if (lowerType.includes('transaction') || lowerType.includes('tx')) return 'transaction';
    if (lowerType.includes('error')) return 'error';
    if (lowerType.includes('warning')) return 'warning';
    if (lowerType.includes('success')) return 'success';
    if (lowerType.includes('contract')) return 'contract';
  }

  // Check data type
  if (data.type) {
    const dataType = data.type.toLowerCase();
    if (dataType.includes('impression')) return 'impression';
    if (dataType.includes('click')) return 'click';
    if (dataType.includes('bid')) return 'bid';
    if (dataType.includes('transaction')) return 'transaction';
    if (dataType.includes('error')) return 'error';
  }

  // Check for specific data fields
  if (data.impressions !== undefined) return 'impression';
  if (data.clicks !== undefined) return 'click';
  if (data.bid !== undefined || data.bidAmount !== undefined) return 'bid';
  if (data.amount !== undefined && data.txId) return 'transaction';
  if (data.error !== undefined) return 'error';

  return 'info';
}
