import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '@/store/notification-store';

const sampleNotification = {
  type: 'tx_confirmed' as const,
  title: 'Transaction Confirmed',
  message: 'Your transfer was successful',
};

describe('notification-store', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('starts with empty notifications', () => {
    const { notifications, unreadCount } = useNotificationStore.getState();
    expect(notifications).toEqual([]);
    expect(unreadCount).toBe(0);
  });

  it('addNotification adds a notification with generated id and timestamp', () => {
    useNotificationStore.getState().addNotification(sampleNotification);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toMatch(/^notif-/);
    expect(notifications[0].timestamp).toBeGreaterThan(0);
    expect(notifications[0].read).toBe(false);
    expect(notifications[0].title).toBe('Transaction Confirmed');
  });

  it('addNotification increments unread count', () => {
    useNotificationStore.getState().addNotification(sampleNotification);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    useNotificationStore.getState().addNotification({
      ...sampleNotification,
      title: 'Second',
    });
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it('newer notifications appear first', () => {
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'First' });
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'Second' });

    const titles = useNotificationStore.getState().notifications.map((n) => n.title);
    expect(titles[0]).toBe('Second');
    expect(titles[1]).toBe('First');
  });

  it('enforces MAX_NOTIFICATIONS limit of 50', () => {
    for (let i = 0; i < 55; i++) {
      useNotificationStore.getState().addNotification({
        ...sampleNotification,
        title: `Notification ${i}`,
      });
    }

    expect(useNotificationStore.getState().notifications).toHaveLength(50);
  });

  it('markAsRead marks a single notification as read', () => {
    useNotificationStore.getState().addNotification(sampleNotification);
    const id = useNotificationStore.getState().notifications[0].id;

    useNotificationStore.getState().markAsRead(id);

    const notif = useNotificationStore.getState().notifications[0];
    expect(notif.read).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markAllAsRead marks all notifications as read', () => {
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'A' });
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'B' });
    expect(useNotificationStore.getState().unreadCount).toBe(2);

    useNotificationStore.getState().markAllAsRead();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
    const allRead = useNotificationStore.getState().notifications.every((n) => n.read);
    expect(allRead).toBe(true);
  });

  it('removeNotification removes by id and updates unread count', () => {
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'Keep' });
    useNotificationStore.getState().addNotification({ ...sampleNotification, title: 'Remove' });

    const toRemove = useNotificationStore.getState().notifications.find((n) => n.title === 'Remove')!;
    useNotificationStore.getState().removeNotification(toRemove.id);

    const remaining = useNotificationStore.getState().notifications;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('Keep');
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('clearAll removes all notifications', () => {
    useNotificationStore.getState().addNotification(sampleNotification);
    useNotificationStore.getState().addNotification(sampleNotification);

    useNotificationStore.getState().clearAll();

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('persists notifications to localStorage', () => {
    useNotificationStore.getState().addNotification(sampleNotification);

    const stored = JSON.parse(localStorage.getItem('adstack_notifications') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Transaction Confirmed');
  });
});
