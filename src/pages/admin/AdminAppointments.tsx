import React, { useState, useEffect } from 'react';
import { Calendar, Search, Users, Clock, MapPin, Filter } from 'lucide-react';
import { getAppointments, getUsers } from '../../utils/storage';
import { Appointment } from '../../types';
import { formatDateTime, formatDate } from '../../utils/helpers';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setAppointments(getAppointments());
    setUsers(getUsers());
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch = a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      a.hospital?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const statusCounts = {
    total: appointments.length,
    upcoming: appointments.filter(a => a.status === 'upcoming').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            All Appointments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{appointments.length} appointments across all users</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
          <div className="text-xs text-gray-500">Total Appointments</div>
        </div>
        <div className="card p-4 bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.upcoming}</div>
          <div className="text-xs text-gray-500">Upcoming</div>
        </div>
        <div className="card p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="card p-4 bg-red-50">
          <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</div>
          <div className="text-xs text-gray-500">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by doctor or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="card text-center py-12 lg:col-span-2">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No appointments found</p>
          </div>
        ) : (
          filteredAppointments
            .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
            .map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-700 leading-none">{format(parseISO(appt.date), 'dd')}</span>
                      <span className="text-xs text-purple-500">{format(parseISO(appt.date), 'MMM')}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{appt.doctorName}</h3>
                      <p className="text-sm text-gray-500">{appt.specialty}</p>
                    </div>
                  </div>
                  <span className={`badge ${statusColors[appt.status]}`}>{appt.status}</span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>Patient: <strong>{getUserName(appt.userId)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{appt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{appt.hospital || 'Not specified'}</span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">{appt.notes}</p>
                )}
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
