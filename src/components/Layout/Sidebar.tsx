import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  HeartPulse, LayoutDashboard, User, Pill, FolderOpen, Calendar,
  Bell, BarChart3, Shield, LogOut, X, Users, FileText, Settings,
  Activity, Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const userNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medicines', icon: Pill, label: 'My Medicines' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/records', icon: FolderOpen, label: 'Health Records' },
  { to: '/health-profile', icon: User, label: 'Health Profile' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: BarChart3, label: 'My Reports' },
];

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', exact: true },
  { to: '/admin/users', icon: Users, label: 'Manage Users' },
  { to: '/admin/medicines', icon: Pill, label: 'All Medicines' },
  { to: '/admin/appointments', icon: Calendar, label: 'All Appointments' },
  { to: '/admin/reports', icon: BarChart3, label: 'System Reports' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({ open, onClose, isAdmin = false }: Props) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isAdmin ? 'bg-purple-600' : 'bg-primary-600'}`}>
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">MediTrack</span>
            {isAdmin && (
              <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">ADMIN</span>
            )}
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge */}
      <div className={`mx-4 mt-4 p-3 rounded-xl ${isAdmin ? 'bg-purple-50 border border-purple-100' : 'bg-blue-50 border border-blue-100'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-purple-600' : 'bg-primary-600'}`}>
            {isAdmin ? <Shield className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className={`text-xs font-medium ${isAdmin ? 'text-purple-600' : 'text-primary-600'}`}>
              {isAdmin ? 'Administrator' : 'Patient'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {isAdmin ? 'Administration' : 'Personal Health'}
        </p>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? (isAdmin ? 'bg-purple-600 text-white shadow-sm' : 'sidebar-item-active') : 'sidebar-item-inactive'}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
          }
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-purple-100' : 'bg-primary-100'}`}>
            <span className={`text-xs font-bold ${isAdmin ? 'text-purple-700' : 'text-primary-700'}`}>{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs truncate opacity-60">{user?.email}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-item sidebar-item-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
