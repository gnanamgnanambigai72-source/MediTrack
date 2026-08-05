import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, User, Settings, HeartPulse, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDateTime } from '../../utils/helpers';

interface Props {
  onMenuClick: () => void;
  isAdmin?: boolean;
}

export default function Header({ onMenuClick, isAdmin = false }: Props) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <header className={`h-16 bg-white border-b px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 ${isAdmin ? 'border-purple-100' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700 p-1">
          <Menu className="w-5 h-5" />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 lg:hidden hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-purple-600' : 'bg-primary-600'}`}>
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">MediTrack</span>
          {isAdmin && <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">ADMIN</span>}
        </Link>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isAdmin ? "Search users, records..." : "Search medicines..."}
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 lg:w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          {isAdmin ? 'Administrator' : 'Patient'}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button onClick={() => { navigate('/notifications'); setShowNotifs(false); }} className="text-xs text-primary-600 hover:underline">View all</button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {recent.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                  recent.map((n) => (
                    <div key={n.id} onClick={() => markRead(n.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${!n.read ? 'bg-primary-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-primary-600'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-100' : 'bg-primary-100'}`}>
              <span className={`text-sm font-bold ${isAdmin ? 'text-purple-700' : 'text-primary-700'}`}>{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
              {user?.name}
            </span>
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button onClick={() => { navigate('/profile'); setShowUser(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User className="w-4 h-4" /> Profile Settings
              </button>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
