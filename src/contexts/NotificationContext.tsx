import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { getNotifications, saveNotifications, generateId } from '../utils/storage';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: Notification['type'], title: string, message: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (user) {
      const all = getNotifications();
      setNotifications(all.filter((n) => n.userId === user.id));
    } else {
      setNotifications([]);
    }
  }, [user]);

  const addNotification = useCallback(
    (type: Notification['type'], title: string, message: string) => {
      if (!user) return;
      const notif: Notification = {
        id: generateId(),
        userId: user.id,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const all = getNotifications();
      const updated = [notif, ...all];
      saveNotifications(updated);
      setNotifications(updated.filter((n) => n.userId === user.id));
      const toast: Toast = {
        id: generateId(),
        type: type === 'missed' ? 'warning' : type === 'system' ? 'info' : 'success',
        title,
        message,
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    },
    [user]
  );

  const markRead = (id: string) => {
    const all = getNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
    if (user) setNotifications(updated.filter((n) => n.userId === user.id));
  };

  const markAllRead = () => {
    if (!user) return;
    const all = getNotifications();
    const updated = all.map((n) => (n.userId === user.id ? { ...n, read: true } : n));
    saveNotifications(updated);
    setNotifications(updated.filter((n) => n.userId === user.id));
  };

  const deleteNotification = (id: string) => {
    const all = getNotifications();
    const updated = all.filter((n) => n.id !== id);
    saveNotifications(updated);
    if (user) setNotifications(updated.filter((n) => n.userId === user.id));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        addNotification,
        markRead,
        markAllRead,
        deleteNotification,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
