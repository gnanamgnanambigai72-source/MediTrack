import React from 'react';
import {
  Bell, CheckCheck, Trash2, BellRing, AlertTriangle, Calendar, Info, Mail
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../types';
import { formatDateTime } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  reminder: { icon: BellRing, color: 'text-blue-600', bg: 'bg-blue-50' },
  missed: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  appointment: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  system: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
  summary: { icon: Mail, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();

  const grouped = notifications.reduce((acc, n) => {
    const date = n.createdAt.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No notifications</h3>
          <p className="text-sm text-gray-400">Notifications about medicines, appointments, and more will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {date === new Date().toISOString().split('T')[0] ? 'Today' : date}
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((n) => {
                    const { icon: Icon, color, bg } = typeConfig[n.type] || typeConfig.system;
                    return (
                      <motion.div key={n.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => !n.read && markRead(n.id)}
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
                          n.read ? 'bg-white border-gray-100' : 'bg-primary-50/50 border-primary-100'
                        } hover:shadow-sm`}
                      >
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4.5 h-4.5 ${color} w-5 h-5`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!n.read && <div className="w-2 h-2 bg-primary-600 rounded-full" />}
                              <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
