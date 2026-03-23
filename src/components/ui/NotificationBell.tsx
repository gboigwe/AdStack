'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store';
import type { Notification } from '@/store';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks';
import { formatRelativeTime } from '@/lib/display-utils';

const TYPE_COLORS: Record<string, string> = {
  tx_confirmed: 'bg-green-500',
  tx_failed: 'bg-red-500',
  campaign_update: 'bg-blue-500',
  governance: 'bg-purple-500',
  system: 'bg-gray-500',
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, removeNotification } = useNotificationStore();
  const dot = TYPE_COLORS[notification.type] ?? 'bg-gray-500';

  const handleClick = () => {
    if (!notification.read) markAsRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex gap-3 px-4 py-3 cursor-pointer transition-colors',
        notification.read
          ? 'bg-white dark:bg-gray-800'
          : 'bg-blue-50 dark:bg-blue-950/20',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
      )}
    >
      <span className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatRelativeTime(Math.floor(notification.timestamp / 1000))}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNotification(notification.id);
        }}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex-shrink-0"
        aria-label={`Remove notification: ${notification.title}`}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Notification bell icon with dropdown panel.
 *
 * Shows unread count badge and lists recent notifications from
 * the notification store with mark-as-read and clear actions.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, clearAll } =
    useNotificationStore();

  useClickOutside(panelRef, () => setIsOpen(false));

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72 divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
