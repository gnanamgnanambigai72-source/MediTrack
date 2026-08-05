import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const icons = {
  success: { Icon: CheckCircle, bg: 'bg-green-50 border-green-200', icon: 'text-green-600', text: 'text-green-800' },
  error: { Icon: AlertCircle, bg: 'bg-red-50 border-red-200', icon: 'text-red-600', text: 'text-red-800' },
  warning: { Icon: AlertTriangle, bg: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-600', text: 'text-yellow-800' },
  info: { Icon: Info, bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon, bg, icon, text } = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              className={`${bg} border rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto`}
            >
              <Icon className={`w-5 h-5 ${icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${text}`}>{toast.title}</p>
                <p className={`text-xs mt-0.5 ${text} opacity-80`}>{toast.message}</p>
              </div>
              <button onClick={() => dismissToast(toast.id)} className={`${icon} hover:opacity-70`}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
