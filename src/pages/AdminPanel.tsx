import React, { useState, useEffect } from 'react';
import {
  Users, Pill, Calendar, Bell, BarChart3, Database,
  Shield, Trash2, UserCheck, UserX, Search, Download, RefreshCw
} from 'lucide-react';
import { getUsers, saveUsers, getMedicines, getAppointments, getDoses, getNotifications } from '../utils/storage';
import { User, Medicine, Appointment, MedicineDose } from '../types';
import { formatDateTime } from '../utils/helpers';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { motion } from 'framer-motion';

type TabType = 'users' | 'medicines' | 'appointments' | 'notifications' | 'reports';

export default function AdminPanel() {
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doses, setDoses] = useState<MedicineDose[]>([]);
  const [search, setSearch] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const loadAll = () => {
    setUsers(getUsers());
    setMedicines(getMedicines());
    setAppointments(getAppointments());
    setDoses(getDoses());
  };

  useEffect(() => { loadAll(); }, []);

  const deleteUser = (id: string) => {
    saveUsers(getUsers().filter((u) => u.id !== id));
    loadAll();
    addNotification('system', 'User Removed', 'User account has been deleted.');
  };

  const toggleRole = (id: string) => {
    const all = getUsers();
    saveUsers(all.map((u) => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    loadAll();
  };

  const exportData = () => {
    const data = { users: getUsers(), medicines: getMedicines(), appointments: getAppointments(), doses: getDoses() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `meditrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addNotification('system', 'Backup Downloaded', 'Database backup has been exported.');
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'medicines', label: 'Medicines', icon: Pill, count: medicines.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: getNotifications().length },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Medicines', value: medicines.length, icon: Pill, color: 'bg-green-50 text-green-600' },
    { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Dose Logs', value: doses.length, icon: BarChart3, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-500 text-sm">System management and oversight</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportData} className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card p-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto w-fit">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${tab === id ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count !== undefined && <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5">{count}</span>}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input-field pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">User</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium hidden sm:table-cell">Phone</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium hidden md:table-cell">Joined</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 text-xs font-bold">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500 hidden sm:table-cell">{u.phone || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs hidden md:table-cell">{formatDateTime(u.createdAt)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleRole(u.id)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Toggle role">
                          {u.role === 'admin' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setDeleteUserId(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No users found.</p>}
          </div>
        </div>
      )}

      {/* Medicines Tab */}
      {tab === 'medicines' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Medicine', 'User', 'Dosage', 'Frequency', 'Category', 'Added'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => {
                const owner = users.find((u) => u.id === m.userId);
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="font-medium text-gray-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{owner?.name || 'Unknown'}</td>
                    <td className="py-3 px-3 text-gray-500">{m.dosage} {m.unit}</td>
                    <td className="py-3 px-3 text-gray-500">{m.frequency}</td>
                    <td className="py-3 px-3"><span className="badge bg-gray-100 text-gray-600">{m.category}</span></td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{formatDateTime(m.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {medicines.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No medicines recorded.</p>}
        </div>
      )}

      {/* Appointments Tab */}
      {tab === 'appointments' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Patient', 'Doctor', 'Specialty', 'Date & Time', 'Hospital', 'Status'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const patient = users.find((u) => u.id === a.userId);
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{patient?.name || 'Unknown'}</td>
                    <td className="py-3 px-3 text-gray-700">{a.doctorName}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{a.specialty}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{a.date} {a.time}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs">{a.hospital || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`badge text-xs ${a.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {appointments.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No appointments recorded.</p>}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {getNotifications().length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications recorded.</p>
            ) : getNotifications().slice(0, 50).map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${n.read ? 'bg-gray-50' : 'bg-primary-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-primary-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <span className="badge bg-gray-100 text-gray-500 text-xs">{n.type}</span>
                  </div>
                  <p className="text-xs text-gray-500">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Registered Users', value: users.length },
                { label: 'Total Medicines', value: medicines.length },
                { label: 'Total Appointments', value: appointments.length },
                { label: 'Total Dose Logs', value: doses.length },
                { label: 'Doses Taken', value: doses.filter(d => d.status === 'taken').length },
                { label: 'Doses Missed', value: doses.filter(d => d.status === 'missed').length },
                { label: 'Notifications Sent', value: getNotifications().length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">User Activity</h3>
            <div className="space-y-3">
              {users.map((u) => {
                const userMeds = medicines.filter(m => m.userId === u.id).length;
                const userAppts = appointments.filter(a => a.userId === u.id).length;
                const userDoses = doses.filter(d => d.userId === u.id).length;
                return (
                  <div key={u.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                      <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} text-xs`}>{u.role}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{userMeds} medicines</span>
                      <span>{userAppts} appointments</span>
                      <span>{userDoses} doses</span>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No users registered.</p>}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && deleteUser(deleteUserId)}
        title="Delete User"
        message="Are you sure you want to delete this user account? All their data will be permanently removed."
        confirmLabel="Delete User"
        danger
      />
    </div>
  );
}
