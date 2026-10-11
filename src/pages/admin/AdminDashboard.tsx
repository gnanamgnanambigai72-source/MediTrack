import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Pill, Calendar, Activity, TrendingUp, Shield,
  Database, Clock, ChevronRight, UserCheck, BarChart3
} from 'lucide-react';
import { getUsers, getMedicines, getAppointments, getDoses, getNotifications, getRecords } from '../../utils/storage';
import { User } from '../../types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMedicines: 0,
    totalAppointments: 0,
    totalDoses: 0,
    dosesTaken: 0,
    dosesMissed: 0,
    totalRecords: 0,
    totalNotifications: 0,
  });

  useEffect(() => {
    const allUsers = getUsers();
    const medicines = getMedicines();
    const appointments = getAppointments();
    const doses = getDoses();
    const records = getRecords();
    const notifications = getNotifications();

    setUsers(allUsers);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    setStats({
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => {
        const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date(u.createdAt);
        return lastLogin >= weekAgo;
      }).length,
      totalMedicines: medicines.length,
      totalAppointments: appointments.length,
      totalDoses: doses.length,
      dosesTaken: doses.filter(d => d.status === 'taken').length,
      dosesMissed: doses.filter(d => d.status === 'missed').length,
      totalRecords: records.length,
      totalNotifications: notifications.length,
    });
  }, []);

  const adherenceRate = stats.totalDoses > 0 ? Math.round((stats.dosesTaken / stats.totalDoses) * 100) : 0;

  const recentUsers = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50', link: '/admin/users' },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: 'text-green-600 bg-green-50', subtext: 'Last 7 days', link: undefined },
    { label: 'Total Medicines', value: stats.totalMedicines, icon: Pill, color: 'text-purple-600 bg-purple-50', link: '/admin/medicines' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'text-orange-600 bg-orange-50', link: '/admin/appointments' },
    { label: 'Dose Logs', value: stats.totalDoses, icon: Activity, color: 'text-teal-600 bg-teal-50', link: undefined },
    { label: 'Health Records', value: stats.totalRecords, icon: Database, color: 'text-pink-600 bg-pink-50', link: undefined },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">System overview and management</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Stats Grid - 6 cards in one row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const inner = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-4 hover:shadow-md transition-all ${stat.link ? 'cursor-pointer group' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.link && (
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              {stat.subtext && <div className="text-xs text-gray-400">{stat.subtext}</div>}
            </motion.div>
          );
          return stat.link ? (
            <Link key={stat.label} to={stat.link}>{inner}</Link>
          ) : (
            <React.Fragment key={stat.label}>{inner}</React.Fragment>
          );
        })}
      </div>

      {/* System Health Overview + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Overview */}
        <div className="lg:col-span-2 card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            System Health Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">{adherenceRate}%</div>
              <div className="text-xs text-gray-500 mt-1">Overall Adherence</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{stats.dosesTaken}</div>
              <div className="text-xs text-gray-500 mt-1">Doses Taken</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">{stats.dosesMissed}</div>
              <div className="text-xs text-gray-500 mt-1">Doses Missed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">{stats.totalNotifications}</div>
              <div className="text-xs text-gray-500 mt-1">Notifications</div>
            </div>
          </div>

          {/* System-wide Adherence Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">System-wide Adherence</span>
              <span className="text-sm font-bold text-gray-900">{adherenceRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  adherenceRate >= 80
                    ? 'bg-green-500'
                    : adherenceRate >= 50
                    ? 'bg-yellow-500'
                    : adherenceRate > 0
                    ? 'bg-red-500'
                    : 'bg-gray-200'
                }`}
                style={{ width: `${Math.max(adherenceRate, 1)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No users registered yet</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        user.role === 'admin' ? 'text-purple-700' : 'text-blue-700'
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Manage Users</span>
          </Link>
          <Link
            to="/admin/medicines"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <Pill className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">View Medicines</span>
          </Link>
          <Link
            to="/admin/reports"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">System Reports</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <Database className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Backup Data</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
