import React, { useState, useEffect } from 'react';
import { Pill, Search, Users, Calendar, Activity, Filter } from 'lucide-react';
import { getMedicines, getUsers, getDoses } from '../../utils/storage';
import { Medicine, MedicineDose } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [doses, setDoses] = useState<MedicineDose[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    setMedicines(getMedicines());
    setUsers(getUsers());
    setDoses(getDoses());
  }, []);

  const categories = ['all', ...new Set(medicines.map(m => m.category))];

  const filteredMedicines = medicines.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getMedicineStats = (medicineId: string) => {
    const medDoses = doses.filter(d => d.medicineId === medicineId);
    return {
      total: medDoses.length,
      taken: medDoses.filter(d => d.status === 'taken').length,
      missed: medDoses.filter(d => d.status === 'missed').length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-600" />
            All Medicines
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{medicines.length} medicines tracked across all users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{medicines.length}</div>
          <div className="text-xs text-gray-500">Total Medicines</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">{doses.filter(d => d.status === 'taken').length}</div>
          <div className="text-xs text-gray-500">Doses Taken</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-600">{doses.filter(d => d.status === 'missed').length}</div>
          <div className="text-xs text-gray-500">Doses Missed</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-purple-600">{new Set(medicines.map(m => m.userId)).size}</div>
          <div className="text-xs text-gray-500">Users with Medicines</div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Medicine</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Dosage</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden sm:table-cell">Category</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Adherence</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden lg:table-cell">Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((med, i) => {
                const stats = getMedicineStats(med.id);
                const adherence = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;
                return (
                  <motion.tr
                    key={med.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: med.color }} />
                        <span className="font-medium text-gray-900">{med.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{getUserName(med.userId)}</td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{med.dosage} {med.unit}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="badge bg-gray-100 text-gray-600">{med.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${adherence >= 80 ? 'bg-green-500' : adherence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${adherence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{adherence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400 hidden lg:table-cell">{formatDateTime(med.createdAt)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No medicines found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
