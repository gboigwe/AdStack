'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Scale, FileText, X, Filter } from 'lucide-react';

interface DisputeNotification {
  id: number;
  type: 'filing' | 'escalation' | 'evidence' | 'judgment' | 'appeal' | 'sla' | 'assignment';
  title: string;
  message: string;
  caseId: number;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationSystemProps {
  notifications?: DisputeNotification[];
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: number) => void;
  onNavigate?: (caseId: number) => void;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  filing: { icon: FileText, color: 'blue' },
  escalation: { icon: AlertTriangle, color: 'orange' },
  evidence: { icon: FileText, color: 'indigo' },
  judgment: { icon: Scale, color: 'purple' },
  appeal: { icon: Scale, color: 'amber' },
  sla: { icon: Clock, color: 'red' },
  assignment: { icon: CheckCircle, color: 'green' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function NotificationSystem({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onNavigate,
}: NotificationSystemProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (showUnreadOnly && n.read) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.timestamp - a.timestamp;
  });

  const typeOptions = ['all', 'filing', 'escalation', 'evidence', 'judgment', 'appeal', 'sla', 'assignment'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg relative">
            <Bell className="w-5 h-5 text-red-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1 overflow-x-auto">
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`ml-auto px-2 py-1 text-xs rounded-full transition-colors ${
            showUnreadOnly
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Unread
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sorted.map((n) => {
            const config = typeConfig[n.type] || typeConfig.filing;
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  n.read
                    ? 'border-gray-100 bg-white hover:bg-gray-50'
                    : 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/50'
                }`}
                onClick={() => {
                  if (onMarkRead && !n.read) onMarkRead(n.id);
                  if (onNavigate) onNavigate(n.caseId);
                }}
              >
                <div className={`p-1.5 rounded-lg bg-${config.color}-50 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 text-${config.color}-600`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.read ? 'text-gray-700' : 'font-medium text-gray-900'}`}>
                      {n.title}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${priorityColors[n.priority]}`}>
                      {n.priority}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Case #{n.caseId}</span>
                    <span className="text-xs text-gray-300">Block {n.timestamp}</span>
                  </div>
                </div>

                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
