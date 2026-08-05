import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Pill, Activity, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMedicines, getDoses, getAppointments } from '../utils/storage';
import { Medicine, MedicineDose, Appointment } from '../types';
import { format, subDays, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#14b8a6'];

export default function Reports() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doses, setDoses] = useState<MedicineDose[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'adherence' | 'medicines' | 'appointments' | 'activity'>('adherence');

  useEffect(() => {
    if (!user) return;
    setMedicines(getMedicines().filter((m) => m.userId === user.id));
    setDoses(getDoses().filter((d) => d.userId === user.id));
    setAppointments(getAppointments().filter((a) => a.userId === user.id));
  }, [user]);

  // Adherence chart (last 7 days)
  const adherenceData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayDoses = doses.filter((d) => d.scheduledDate === date);
    const taken = dayDoses.filter((d) => d.status === 'taken').length;
    const missed = dayDoses.filter((d) => d.status === 'missed').length;
    const total = dayDoses.length;
    return {
      date: format(subDays(new Date(), 6 - i), 'EEE'),
      taken,
      missed,
      rate: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  });

  // Medicine distribution
  const medData = medicines.map((m) => ({
    name: m.name.length > 10 ? m.name.slice(0, 10) + '...' : m.name,
    doses: doses.filter((d) => d.medicineId === m.id).length,
    taken: doses.filter((d) => d.medicineId === m.id && d.status === 'taken').length,
  }));

  // Appointment stats
  const apptData = [
    { name: 'Upcoming', value: appointments.filter((a) => a.status === 'upcoming').length },
    { name: 'Completed', value: appointments.filter((a) => a.status === 'completed').length },
    { name: 'Cancelled', value: appointments.filter((a) => a.status === 'cancelled').length },
  ].filter((d) => d.value > 0);

  // Summary stats
  const totalDoses = doses.length;
  const takenDoses = doses.filter((d) => d.status === 'taken').length;
  const missedDoses = doses.filter((d) => d.status === 'missed').length;
  const overallRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const summaryStats = [
    { label: 'Overall Adherence', value: `${overallRate}%`, icon: TrendingUp, color: overallRate >= 80 ? 'text-green-600 bg-green-50' : overallRate >= 50 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50' },
    { label: 'Total Doses', value: totalDoses, icon: Pill, color: 'text-blue-600 bg-blue-50' },
    { label: 'Doses Taken', value: takenDoses, icon: Activity, color: 'text-green-600 bg-green-50' },
    { label: 'Missed Doses', value: missedDoses, icon: BarChart3, color: 'text-red-600 bg-red-50' },
  ];

  const tabs = [
    { id: 'adherence', label: 'Adherence' },
    { id: 'medicines', label: 'Medicines' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'activity', label: 'Activity' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your health progress and medicine adherence</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map(({ label, value, icon: Icon, color }, i) => (
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {activeTab === 'adherence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">7-Day Adherence (Taken vs Missed)</h3>
            {doses.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No dose data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={adherenceData}>
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
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Daily Adherence Rate (%)</h3>
            {doses.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No dose data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Adherence Rate']} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="Rate %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Adherence by medicine */}
          <div className="card lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Medicine Adherence Report</h3>
            <div className="space-y-3">
              {medicines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No medicines tracked yet.</p>
              ) : medicines.map((med) => {
                const medDoses = doses.filter((d) => d.medicineId === med.id);
                const taken = medDoses.filter((d) => d.status === 'taken').length;
                const total = medDoses.length;
                const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
                return (
                  <div key={med.id} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: med.color }} />
                    <span className="text-sm text-gray-700 w-32 truncate flex-shrink-0">{med.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">{rate}%</span>
                    <span className="text-xs text-gray-400">{taken}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'medicines' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Total Doses by Medicine</h3>
            {medData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No medicine data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={medData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="taken" fill="#3b82f6" name="Doses Taken" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Medicine Categories</h3>
            {medicines.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No medicine data</div>
            ) : (() => {
              const catData = Object.entries(
                medicines.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; }, {} as Record<string, number>)
              ).map(([name, value]) => ({ name, value }));
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {catData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </div>

          <div className="card lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Missed Dose Report</h3>
            <div className="space-y-3">
              {medicines.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data available</p>
                : medicines.map((med) => {
                  const medDoses = doses.filter((d) => d.medicineId === med.id);
                  const missed = medDoses.filter((d) => d.status === 'missed').length;
                  return (
                    <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: med.color }} />
                        <span className="text-sm font-medium text-gray-900">{med.name}</span>
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{med.category}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Total: {medDoses.length}</span>
                        <span className={missed > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          Missed: {missed}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Appointment Status Distribution</h3>
            {apptData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No appointment data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={apptData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {apptData.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#22c55e', '#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Appointment History</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {appointments.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No appointments recorded</p>
                : appointments.sort((a, b) => b.date.localeCompare(a.date)).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appt.doctorName}</p>
                      <p className="text-xs text-gray-500">{appt.specialty} · {format(parseISO(appt.date), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className={`badge text-xs ${appt.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : appt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">User Activity Report</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Medicines', value: medicines.length, color: 'bg-blue-100 text-blue-700' },
              { label: 'Total Appointments', value: appointments.length, color: 'bg-purple-100 text-purple-700' },
              { label: 'Total Dose Logs', value: doses.length, color: 'bg-green-100 text-green-700' },
              { label: 'Completed Appts', value: appointments.filter(a => a.status === 'completed').length, color: 'bg-teal-100 text-teal-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-2xl p-4 text-center`}>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {doses.slice(-10).reverse().map((dose) => (
              <div key={dose.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dose.status === 'taken' ? 'bg-green-500' : dose.status === 'missed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-900 flex-1">{dose.medicineName}</span>
                <span className="text-xs text-gray-500">{dose.scheduledDate} {dose.scheduledTime}</span>
                <span className={`badge text-xs ${dose.status === 'taken' ? 'bg-green-100 text-green-700' : dose.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {dose.status}
                </span>
              </div>
            ))}
            {doses.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet. Start tracking medicines!</p>}
          </div>
        </div>
      )}
    </div>
  );
}
