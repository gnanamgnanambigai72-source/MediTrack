import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Pill, Calendar, Activity, Download, TrendingUp } from 'lucide-react';
import { getUsers, getMedicines, getAppointments, getDoses, getNotifications, getRecords } from '../../utils/storage';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#14b8a6'];

export default function AdminReports() {
  const [stats, setStats] = useState({
    users: 0,
    medicines: 0,
    appointments: 0,
    doses: 0,
    dosesTaken: 0,
    dosesMissed: 0,
    records: 0,
    notifications: 0,
  });
  const [userGrowth, setUserGrowth] = useState<{ date: string; users: number }[]>([]);
  const [doseData, setDoseData] = useState<{ date: string; taken: number; missed: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const users = getUsers();
    const medicines = getMedicines();
    const appointments = getAppointments();
    const doses = getDoses();
    const records = getRecords();
    const notifications = getNotifications();

    setStats({
      users: users.length,
      medicines: medicines.length,
      appointments: appointments.length,
      doses: doses.length,
      dosesTaken: doses.filter(d => d.status === 'taken').length,
      dosesMissed: doses.filter(d => d.status === 'missed').length,
      records: records.length,
      notifications: notifications.length,
    });

    // User growth (last 7 days)
    const growth = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const count = users.filter(u => u.createdAt.startsWith(date)).length;
      return { date: format(subDays(new Date(), 6 - i), 'EEE'), users: count };
    });
    setUserGrowth(growth);

    // Dose data (last 7 days)
    const doseChart = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayDoses = doses.filter(d => d.scheduledDate === date);
      return {
        date: format(subDays(new Date(), 6 - i), 'EEE'),
        taken: dayDoses.filter(d => d.status === 'taken').length,
        missed: dayDoses.filter(d => d.status === 'missed').length,
      };
    });
    setDoseData(doseChart);

    // Category distribution
    const categories = medicines.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    setCategoryData(Object.entries(categories).map(([name, value]) => ({ name, value })));
  }, []);

  const adherenceRate = stats.doses > 0 ? Math.round((stats.dosesTaken / stats.doses) * 100) : 0;

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      adherenceRate,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meditrack_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            System Reports
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Analytics and insights across all users</p>
        </div>
        <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Medicines', value: stats.medicines, icon: Pill, color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Appointments', value: stats.appointments, icon: Calendar, color: 'bg-orange-50 text-orange-600' },
          { label: 'Overall Adherence', value: `${adherenceRate}%`, icon: TrendingUp, color: adherenceRate >= 80 ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-4">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dose Adherence Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">7-Day Dose Adherence</h3>
          {stats.doses === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No dose data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={doseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="taken" fill="#22c55e" name="Taken" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">User Registrations (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Medicine Categories */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Medicine Categories Distribution</h3>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No medicine data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary Table */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">System Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'Total Registered Users', value: stats.users },
              { label: 'Total Medicines Tracked', value: stats.medicines },
              { label: 'Total Appointments', value: stats.appointments },
              { label: 'Total Dose Logs', value: stats.doses },
              { label: 'Doses Taken', value: stats.dosesTaken },
              { label: 'Doses Missed', value: stats.dosesMissed },
              { label: 'Health Records Stored', value: stats.records },
              { label: 'Notifications Sent', value: stats.notifications },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
