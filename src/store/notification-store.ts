'use client';

import { create } from 'zustand';

export type NotificationType = 'tx_confirmed' | 'tx_failed' | 'campaign_update' | 'governance' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  /** Optional link to navigate to when clicked */
  href?: string;
}

/** Maximum number of notifications kept in memory */
const MAX_NOTIFICATIONS = 50;

const STORAGE_KEY = 'adstack_notifications';

function loadFromStorage(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // storage full — silently drop
  }
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

let counter = 0;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: loadFromStorage(),
  unreadCount: loadFromStorage().filter((n) => !n.read).length,

  addNotification: (notification) => {
    const id = `notif-${++counter}-${Date.now()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    };

    set((state) => {
      const updated = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      saveToStorage(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return { notifications: updated, unreadCount: 0 };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      saveToStorage(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  clearAll: () => {
    saveToStorage([]);
    set({ notifications: [], unreadCount: 0 });
  },
}));
