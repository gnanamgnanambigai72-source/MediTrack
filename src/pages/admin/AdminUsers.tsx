import React, { useState, useEffect } from 'react';
import {
  Users, Search, Shield, Trash2, UserCheck, UserX, Mail, Phone,
  Calendar, Pill, Activity, ChevronDown, Filter
} from 'lucide-react';
import { getUsers, saveUsers, getMedicines, getAppointments, getDoses, getHealthProfiles } from '../../utils/storage';
import { User } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { useNotifications } from '../../contexts/NotificationContext';
import Modal from '../../components/UI/Modal';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { motion } from 'framer-motion';

export default function AdminUsers() {
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => { loadUsers(); }, []);

  const deleteUser = (id: string) => {
    saveUsers(getUsers().filter((u) => u.id !== id));
    loadUsers();
    addNotification('system', 'User Deleted', 'User account has been permanently removed.');
  };

  const toggleRole = (id: string) => {
    const all = getUsers();
    const user = all.find(u => u.id === id);
    saveUsers(all.map((u) => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    loadUsers();
    addNotification('system', 'Role Updated', `${user?.name}'s role has been changed.`);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getUserStats = (userId: string) => {
    const medicines = getMedicines().filter(m => m.userId === userId);
    const appointments = getAppointments().filter(a => a.userId === userId);
    const doses = getDoses().filter(d => d.userId === userId);
    const healthProfile = getHealthProfiles().find(p => p.userId === userId);
    return {
      medicines: medicines.length,
      appointments: appointments.length,
      doses: doses.length,
      dosesTaken: doses.filter(d => d.status === 'taken').length,
      hasProfile: !!healthProfile,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Manage Users
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Admins: {users.filter(u => u.role === 'admin').length}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">Patients: {users.filter(u => u.role === 'user').length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'user', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                roleFilter === role
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {role === 'all' ? 'All' : role === 'admin' ? 'Admins' : 'Patients'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Contact</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden lg:table-cell">Activity</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden sm:table-cell">Joined</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => {
                const stats = getUserStats(user.id);
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                          <span className={`text-sm font-bold ${user.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">{user.phone || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleRole(user.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Admin' : 'Patient'}
                      </button>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1" title="Medicines">
                          <Pill className="w-3 h-3" /> {stats.medicines}
                        </span>
                        <span className="flex items-center gap-1" title="Appointments">
                          <Calendar className="w-3 h-3" /> {stats.appointments}
                        </span>
                        <span className="flex items-center gap-1" title="Doses">
                          <Activity className="w-3 h-3" /> {stats.doses}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 hidden sm:table-cell">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedUser(user); setShowDetails(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUserId(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Modal open={showDetails} onClose={() => setShowDetails(false)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedUser.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                <span className={`text-xl font-bold ${selectedUser.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedUser.role === 'admin' ? 'Administrator' : 'Patient'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{getUserStats(selectedUser.id).medicines}</div>
                <div className="text-xs text-gray-500">Medicines</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{getUserStats(selectedUser.id).appointments}</div>
                <div className="text-xs text-gray-500">Appointments</div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{getUserStats(selectedUser.id).dosesTaken}</div>
                <div className="text-xs text-gray-500">Doses Taken</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">{getUserStats(selectedUser.id).doses}</div>
                <div className="text-xs text-gray-500">Total Doses</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{selectedUser.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-900">{formatDateTime(selectedUser.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Last Login</span>
                <span className="text-gray-900">{selectedUser.lastLogin ? formatDateTime(selectedUser.lastLogin) : 'Never'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && deleteUser(deleteUserId)}
        title="Delete User"
        message="This will permanently delete the user account and all associated data. This action cannot be undone."
        confirmLabel="Delete User"
        danger
      />
    </div>
  );
}
