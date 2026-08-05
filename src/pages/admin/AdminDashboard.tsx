import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Pill, Calendar, Bell, Activity, TrendingUp, Shield,
  Database, AlertTriangle, CheckCircle, Clock, ChevronRight, UserCheck
} from 'lucide-react';
import { getUsers, getMedicines, getAppointments, getDoses, getNotifications, getHealthProfiles, getRecords } from '../../utils/storage';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMedicines: 0,
    totalAppointments: 0,
    totalDoses: 0,
    dosesTaken: 0,
    dosesMissed: 0,
    totalRecords: 0,
    totalNotifications: 0,
    activeUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const users = getUsers();
    const medicines = getMedicines();
    const appointments = getAppointments();
    const doses = getDoses();
    const records = getRecords();
    const notifications = getNotifications();

    setStats({
      totalUsers: users.length,
      totalMedicines: medicines.length,
      totalAppointments: appointments.length,
      totalDoses: doses.length,
      dosesTaken: doses.filter(d => d.status === 'taken').length,
      dosesMissed: doses.filter(d => d.status === 'missed').length,
      totalRecords: records.length,
      totalNotifications: notifications.length,
      activeUsers: users.filter(u => {
        const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastLogin >= weekAgo;
      }).length,
    });

    setRecentUsers(users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));

    // User growth by day (last 7 days)
    const growth = Array.from({ length: 7 }, (_, i) => {
      const date = format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const count = users.filter(u => u.createdAt.startsWith(date)).length;
      return { date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'EEE'), count };
    });
    setUserGrowth(growth);
  }, []);

  const adherenceRate = stats.totalDoses > 0 ? Math.round((stats.dosesTaken / stats.totalDoses) * 100) : 0;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600', link: '/admin/users' },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: 'bg-green-50 text-green-600', subtext: 'Last 7 days' },
    { label: 'Total Medicines', value: stats.totalMedicines, icon: Pill, color: 'bg-purple-50 text-purple-600', link: '/admin/medicines' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-orange-50 text-orange-600', link: '/admin/appointments' },
    { label: 'Dose Logs', value: stats.totalDoses, icon: Activity, color: 'bg-teal-50 text-teal-600' },
    { label: 'Health Records', value: stats.totalRecords, icon: Database, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">System overview and management</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Alert Banner */}
      {stats.dosesMissed > 10 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">High Missed Dose Alert</p>
            <p className="text-xs text-yellow-600">{stats.dosesMissed} doses have been missed across all users.</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const content = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-4 hover:shadow-md transition-all ${stat.link ? 'cursor-pointer group' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.link && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              {stat.subtext && <div className="text-xs text-gray-400">{stat.subtext}</div>}
            </motion.div>
          );
          return stat.link ? (
            <Link key={stat.label} to={stat.link}>{content}</Link>
          ) : content;
        })}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            System Health Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

          {/* Adherence Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">System-wide Adherence</span>
              <span className="text-sm font-bold text-gray-900">{adherenceRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${adherenceRate >= 80 ? 'bg-green-500' : adherenceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-purple-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
            ) : recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  <span className={`text-xs font-bold ${user.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/users" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Manage Users</span>
          </Link>
          <Link to="/admin/medicines" className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
            <Pill className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">View Medicines</span>
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">System Reports</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
            <Database className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Backup Data</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
