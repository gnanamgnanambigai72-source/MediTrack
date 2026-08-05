import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Clock, MapPin, User, Stethoscope,
  Trash2, Edit2, CheckCircle2, XCircle, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getAppointments, saveAppointments, generateId } from '../utils/storage';
import { Appointment } from '../types';
import { SPECIALTIES, formatDate } from '../utils/helpers';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const defaultAppt: Omit<Appointment, 'id' | 'userId' | 'createdAt'> = {
  doctorName: '', specialty: 'General Physician', hospital: '', date: format(new Date(), 'yyyy-MM-dd'),
  time: '10:00', notes: '', status: 'upcoming', reminderSet: true,
};

export default function Appointments() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ ...defaultAppt });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'all'>('upcoming');

  const load = () => {
    if (user) setAppointments(getAppointments().filter((a) => a.userId === user.id));
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = () => { setForm({ ...defaultAppt }); setEditAppt(null); setShowModal(true); };
  const openEdit = (appt: Appointment) => {
    setForm({ doctorName: appt.doctorName, specialty: appt.specialty, hospital: appt.hospital,
      date: appt.date, time: appt.time, notes: appt.notes, status: appt.status, reminderSet: appt.reminderSet });
    setEditAppt(appt); setShowModal(true);
  };

  const saveAppt = () => {
    if (!user || !form.doctorName) return;
    const all = getAppointments();
    if (editAppt) {
      saveAppointments(all.map((a) => a.id === editAppt.id ? { ...a, ...form } : a));
    } else {
      const newAppt: Appointment = { ...form, id: generateId(), userId: user.id, createdAt: new Date().toISOString() };
      saveAppointments([...all, newAppt]);
      addNotification('appointment', 'Appointment Booked', `Appointment with ${form.doctorName} on ${formatDate(form.date)} has been scheduled.`);
    }
    load(); setShowModal(false);
  };

  const updateStatus = (id: string, status: Appointment['status']) => {
    const all = getAppointments();
    saveAppointments(all.map((a) => a.id === id ? { ...a, status } : a));
    load();
  };

  const deleteAppt = (id: string) => {
    saveAppointments(getAppointments().filter((a) => a.id !== id));
    load();
  };

  const filtered = appointments.filter((a) => activeTab === 'all' || a.status === activeTab);

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const tabCounts = {
    upcoming: appointments.filter((a) => a.status === 'upcoming').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    all: appointments.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tabCounts.upcoming} upcoming appointments</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {(['upcoming', 'completed', 'cancelled', 'all'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No appointments</h3>
          <p className="text-sm text-gray-400 mb-4">Book your first doctor appointment.</p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Book Appointment</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map((appt, i) => (
            <motion.div key={appt.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-700 leading-none">{format(parseISO(appt.date), 'dd')}</span>
                    <span className="text-xs text-purple-500">{format(parseISO(appt.date), 'MMM')}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{appt.doctorName}</h3>
                    <p className="text-sm text-gray-500">{appt.specialty}</p>
                    <span className={`badge mt-1 ${statusColors[appt.status]}`}>{appt.status}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(appt)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(appt.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> {appt.time} · {formatDate(appt.date)}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {appt.hospital || 'Hospital not specified'}</div>
                {appt.notes && <div className="flex items-start gap-2"><Stethoscope className="w-4 h-4 text-gray-400 mt-0.5" /> {appt.notes}</div>}
                {appt.reminderSet && <div className="flex items-center gap-2 text-blue-600"><Bell className="w-4 h-4" /> Reminder enabled</div>}
              </div>

              {appt.status === 'upcoming' && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => updateStatus(appt.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 py-2 px-3 rounded-xl text-xs font-semibold transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                  </button>
                  <button onClick={() => updateStatus(appt.id, 'cancelled')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 py-2 px-3 rounded-xl text-xs font-semibold transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editAppt ? 'Edit Appointment' : 'Book Appointment'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Doctor Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9" placeholder="Dr. Smith" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Specialty</label>
              <select className="input-field" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hospital / Clinic</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9" placeholder="City Medical Center" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input-field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Appointment['status'] })}>
                {(['upcoming', 'completed', 'cancelled'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Reason for visit, symptoms, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.reminderSet ? 'bg-primary-600' : 'bg-gray-200'}`}
              onClick={() => setForm({ ...form, reminderSet: !form.reminderSet })}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.reminderSet ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Set reminder notification</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveAppt} className="btn-primary" disabled={!form.doctorName}>
              {editAppt ? 'Update Appointment' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteAppt(deleteId)}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment?"
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
