import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Gavel, TrendingUp, Clock, Award, Bell, BellOff } from 'lucide-react';

export interface Bid {
  id: string;
  campaignId: string;
  campaignName?: string;
  amount: number;
  bidder: string;
  timestamp: number;
  status: 'active' | 'won' | 'lost';
}

export interface LiveBiddingInterfaceProps {
  contractId: string;
  maxBids?: number;
  maxHistoryPoints?: number;
  showNotifications?: boolean;
  enableSound?: boolean;
}

interface BidTrendPoint {
  timestamp: number;
  time: string;
  amount: number;
}

export default function LiveBiddingInterface({
  contractId,
  maxBids = 50,
  maxHistoryPoints = 20,
  showNotifications = true,
  enableSound = false,
}: LiveBiddingInterfaceProps) {
  const { isConnected, events, error } = useWebSocket({
    contractId,
    autoConnect: true,
    eventTypes: ['bid', 'bid-placed', 'auction-bid'],
  });

  const [bids, setBids] = useState<Bid[]>([]);
  const [currentHighestBid, setCurrentHighestBid] = useState<Bid | null>(null);
  const [bidTrend, setBidTrend] = useState<BidTrendPoint[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(showNotifications);

  // Process incoming bid events
  useEffect(() => {
    if (!events.length) return;

    const latestEvent = events[0];
    const { data, timestamp } = latestEvent;

    // Check if it's a bid event
    if (data.type === 'bid' || data.bid || data.amount) {
      const newBid: Bid = {
        id: data.bidId || data.id || `${timestamp}-${Math.random()}`,
        campaignId: data.campaignId || contractId,
        campaignName: data.campaignName || data.name,
        amount: parseFloat(data.amount || data.bidAmount || data.value || 0),
        bidder: data.bidder || data.publisher || data.from || 'Unknown',
        timestamp: timestamp || Date.now(),
        status: data.status || 'active',
      };

      // Add to bids list
      setBids((prev) => {
        const updated = [newBid, ...prev].slice(0, maxBids);
        return updated;
      });

      // Update highest bid
      setCurrentHighestBid((prev) => {
        if (!prev || newBid.amount > prev.amount) {
          if (notificationsEnabled) {
            showBidNotification(newBid);
          }
          return newBid;
        }
        return prev;
      });

      // Update bid trend
      setBidTrend((prev) => {
        const newPoint: BidTrendPoint = {
          timestamp: newBid.timestamp,
          time: new Date(newBid.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          amount: newBid.amount,
        };

        const updated = [...prev, newPoint];
        return updated.slice(-maxHistoryPoints);
      });
    }
  }, [events, contractId, maxBids, maxHistoryPoints, notificationsEnabled]);

  const showBidNotification = useCallback((bid: Bid) => {
    // Create toast notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('New Highest Bid!', {
          body: `${bid.bidder} bid $${bid.amount.toFixed(2)}`,
          icon: '/notification-icon.png',
        });
      }
    }

    // Play sound if enabled
    if (enableSound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {
        // Ignore audio errors
      });
    }
  }, [enableSound]);

  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled((prev) => !prev);
    if (!notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled, requestNotificationPermission]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const averageBid = bids.length > 0
    ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length
    : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Live Bidding Activity</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? (
              <Bell className="h-5 w-5 text-blue-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Current Highest Bid */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current Highest Bid</p>
              {currentHighestBid ? (
                <>
                  <p className="text-4xl font-bold text-gray-900 mt-1">
                    {formatCurrency(currentHighestBid.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    by {currentHighestBid.bidder}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-semibold text-gray-500 mt-1">No bids yet</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Average Bid</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(averageBid)}
            </p>
            <p className="text-sm text-gray-600 mt-1">{bids.length} total bids</p>
          </div>
        </div>
      </div>

      {/* Bid Trend Chart */}
      {bidTrend.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bid Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bidTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Live Bid Stream */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Live Bid Stream
          </h3>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {bids.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Gavel className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Waiting for bids...</p>
            </div>
          ) : (
            bids.map((bid) => (
              <div
                key={bid.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(bid.amount)}
                      </p>
                      {bid.id === currentHighestBid?.id && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Highest
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        bid.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : bid.status === 'won'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {bid.bidder}
                      {bid.campaignName && ` • ${bid.campaignName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatRelativeTime(bid.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!isConnected && bids.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Connecting to bidding stream... Please wait.
          </p>
        </div>
      )}
    </div>
  );
}
