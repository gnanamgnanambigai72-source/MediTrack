import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Pill, Plus, Bell, Volume2, Mic, Trash2, Edit2, Clock, CheckCircle2, X, Search, Play, Music, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getMedicines, saveMedicines, getDoses, saveDoses, generateId } from '../utils/storage';
import { Medicine, MedicineDose } from '../types';
import { MEDICINE_COLORS, MEDICINE_CATEGORIES, FREQUENCIES, playNotificationSound, speakText, SOUND_OPTIONS } from '../utils/helpers';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const defaultMed: Omit<Medicine, 'id' | 'userId' | 'createdAt'> = {
  name: '', dosage: '', unit: 'mg', frequency: 'Once daily', times: ['08:00'],
  startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', instructions: '',
  color: MEDICINE_COLORS[Math.floor(Math.random() * MEDICINE_COLORS.length)], category: 'Tablet', reminderEnabled: true,
  voiceAlert: false, notificationSound: true, soundType: 'bell-chime',
};

export default function Medicines() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayDoses, setTodayDoses] = useState<MedicineDose[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ ...defaultMed });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'medicines' | 'schedule'>('medicines');
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const load = useCallback(() => {
    if (!user) return;
    setMedicines(getMedicines().filter((m) => m.userId === user.id));
    setTodayDoses(getDoses().filter((d) => d.userId === user.id && d.scheduledDate === today));
  }, [user, today]);

  useEffect(() => { load(); }, [load]);

  // Auto-alert system - check every minute for due medicines
  useEffect(() => {
    const checkAndAlert = () => {
      if (!user) return;
      
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      const allDoses = getDoses().filter((d) => d.userId === user.id && d.scheduledDate === today && d.status === 'pending');
      const allMeds = getMedicines().filter((m) => m.userId === user.id);
      
      allDoses.forEach((dose) => {
        const doseTime = dose.scheduledTime;
        const [doseHour, doseMin] = doseTime.split(':').map(Number);
        const nowHour = now.getHours();
        const nowMin = now.getMinutes();
        
        if (doseHour === nowHour && doseMin === nowMin) {
          const med = allMeds.find((m) => m.id === dose.medicineId);
          if (med) {
            if (med.notificationSound) {
              playNotificationSound(med.soundType || 'bell-chime');
            }
            
            if (med.voiceAlert) {
              speakText(`Reminder: Time to take your medicine ${med.name}. Dosage: ${med.dosage} ${med.unit}. ${med.instructions || ''}`);
            }
            
            addNotification('reminder', 'Medicine Reminder', `Time to take ${med.name} - ${med.dosage} ${med.unit}`);
          }
        }
      });
    };

    checkAndAlert();
    alertIntervalRef.current = setInterval(checkAndAlert, 60000);
    
    return () => {
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [user, today, addNotification]);

  // Calculate doses left to take today
  const pendingDoses = todayDoses.filter((d) => d.status === 'pending');
  const takenDoses = todayDoses.filter((d) => d.status === 'taken');
  const missedDoses = todayDoses.filter((d) => d.status === 'missed');
  const dosesLeft = pendingDoses.length;

  const openAdd = () => { setForm({ ...defaultMed }); setEditMed(null); setShowModal(true); };
  const openEdit = (med: Medicine) => {
    setForm({
      name: med.name, dosage: med.dosage, unit: med.unit, frequency: med.frequency, times: med.times,
      startDate: med.startDate, endDate: med.endDate, instructions: med.instructions, color: med.color,
      category: med.category, reminderEnabled: med.reminderEnabled, voiceAlert: med.voiceAlert, 
      notificationSound: med.notificationSound, soundType: med.soundType || 'bell-chime'
    });
    setEditMed(med); setShowModal(true);
  };

  const saveMed = () => {
    if (!user || !form.name) return;
    const all = getMedicines();
    if (editMed) {
      const updated = all.map((m) => m.id === editMed.id ? { ...m, ...form } : m);
      saveMedicines(updated);
    } else {
      const newMed: Medicine = { ...form, id: generateId(), userId: user.id, createdAt: new Date().toISOString() };
      saveMedicines([...all, newMed]);
      generateTodayDoses(newMed);
    }
    load();
    setShowModal(false);
    addNotification('reminder', editMed ? 'Medicine Updated' : 'Medicine Added', `${form.name} has been ${editMed ? 'updated' : 'added'} to your schedule.`);
  };

  const generateTodayDoses = (med: Medicine) => {
    if (!user) return;
    const allDoses = getDoses();
    const newDoses: MedicineDose[] = med.times.map((time) => ({
      id: generateId(), userId: user.id, medicineId: med.id, medicineName: med.name,
      scheduledTime: time, scheduledDate: today, status: 'pending',
    }));
    saveDoses([...allDoses, ...newDoses]);
  };

  const deleteMed = (id: string) => {
    const all = getMedicines();
    saveMedicines(all.filter((m) => m.id !== id));
    load();
    addNotification('system', 'Medicine Removed', 'Medicine has been removed from your schedule.');
  };

  const markDose = (doseId: string, status: 'taken' | 'skipped') => {
    const all = getDoses();
    const updated = all.map((d) => d.id === doseId ? { ...d, status, takenAt: status === 'taken' ? new Date().toISOString() : undefined } : d);
    saveDoses(updated);
    load();
    const dose = todayDoses.find((d) => d.id === doseId);
    if (dose && status === 'taken') {
      const med = medicines.find(m => m.id === dose.medicineId);
      if (med?.notificationSound) playNotificationSound(med.soundType || 'bell-chime');
      addNotification('reminder', 'Dose Taken ✓', `${dose.medicineName} marked as taken.`);
    }
  };

  const handleVoiceAlert = (med: Medicine) => {
    playNotificationSound(med.soundType || 'bell-chime');
    speakText(`Reminder: Time to take ${med.name}. ${med.dosage} ${med.unit}. ${med.instructions || ''}`);
  };

  const updateTimes = (count: number) => {
    const defaultTimes = ['08:00', '12:00', '16:00', '20:00'];
    setForm({ ...form, times: defaultTimes.slice(0, count) });
  };

  const toggleSetting = (key: 'reminderEnabled' | 'voiceAlert' | 'notificationSound') => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreviewSound = (soundType: string) => {
    playNotificationSound(soundType);
  };

  const filtered = medicines.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <p className="text-gray-500 text-sm mt-0.5">{medicines.length} medicines tracked</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {/* Doses Left to Take Banner */}
      {todayDoses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 sm:p-5 ${
            dosesLeft > 0 
              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' 
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                dosesLeft > 0 ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {dosesLeft > 0 ? (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <p className={`text-lg font-bold ${dosesLeft > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                  {dosesLeft > 0 ? `${dosesLeft} dose${dosesLeft > 1 ? 's' : ''} left to take today` : 'All doses taken for today! 🎉'}
                </p>
                <p className={`text-sm ${dosesLeft > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {dosesLeft > 0 
                    ? `You've taken ${takenDoses.length} of ${todayDoses.length} scheduled doses`
                    : 'Great job staying on track with your medicines!'
                  }
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-green-600">{takenDoses.length}</div>
                <div className="text-xs text-gray-500">Taken</div>
              </div>
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-orange-600">{pendingDoses.length}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-red-600">{missedDoses.length}</div>
                <div className="text-xs text-gray-500">Missed</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['medicines', 'schedule'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'schedule' ? "Today's Schedule" : 'All Medicines'}
          </button>
        ))}
      </div>

      {activeTab === 'medicines' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No medicines yet</h3>
              <p className="text-sm text-gray-400 mb-4">Add your medicines to track and get reminders.</p>
              <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Medicine</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((med, i) => {
                // Calculate doses left for this specific medicine
                const medDoses = todayDoses.filter(d => d.medicineId === med.id);
                const medPending = medDoses.filter(d => d.status === 'pending').length;
                const medTaken = medDoses.filter(d => d.status === 'taken').length;
                
                return (
                  <motion.div key={med.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: med.color + '20' }}>
                          <Pill className="w-5 h-5" style={{ color: med.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{med.name}</h3>
                          <span className="text-xs text-gray-500">{med.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(med)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(med.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1"><Pill className="w-3 h-3 text-gray-400" /> {med.dosage} {med.unit} · {med.frequency}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {med.times.join(', ')}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">From {med.startDate}{med.endDate ? ` to ${med.endDate}` : ' (ongoing)'}</div>
                    </div>
                    
                    {/* Doses left indicator for this medicine */}
                    {medDoses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Today's progress:</span>
                          <span className={`text-xs font-bold ${medPending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {medPending > 0 ? `${medPending} left` : '✓ Done'}
                          </span>
                        </div>
                        <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${medPending > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${medDoses.length > 0 ? (medTaken / medDoses.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {med.reminderEnabled && <span className="badge bg-blue-100 text-blue-700 text-xs gap-1"><Bell className="w-2.5 h-2.5" /> Reminder</span>}
                      {med.voiceAlert && (
                        <button onClick={() => handleVoiceAlert(med)} className="badge bg-purple-100 text-purple-700 text-xs gap-1 cursor-pointer hover:bg-purple-200">
                          <Mic className="w-2.5 h-2.5" /> Voice
                        </button>
                      )}
                      {med.notificationSound && <span className="badge bg-green-100 text-green-700 text-xs gap-1"><Volume2 className="w-2.5 h-2.5" /> Sound</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'schedule' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" /> Today's Dose Schedule · {format(new Date(), 'MMM dd, yyyy')}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                <CheckCircle2 className="w-3 h-3" /> {takenDoses.length} Taken
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">
                <Clock className="w-3 h-3" /> {pendingDoses.length} Pending
              </span>
              {missedDoses.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg font-medium">
                  <AlertCircle className="w-3 h-3" /> {missedDoses.length} Missed
                </span>
              )}
            </div>
          </div>
          
          {todayDoses.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No doses scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((dose) => {
                const med = medicines.find((m) => m.id === dose.medicineId);
                return (
                  <div key={dose.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                    dose.status === 'taken' ? 'bg-green-50 border-green-100' :
                    dose.status === 'skipped' ? 'bg-gray-50 border-gray-100' :
                    dose.status === 'missed' ? 'bg-red-50 border-red-100' : 'border-gray-100 hover:bg-gray-50'
                  }`}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: med?.color || '#94a3b8' }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{dose.medicineName}</span>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-500">{dose.scheduledTime}</span>
                      </div>
                      {med && <span className="text-xs text-gray-400">{med.dosage} {med.unit}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {dose.status === 'taken' && <span className="badge bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Taken</span>}
                      {dose.status === 'skipped' && <span className="badge bg-gray-100 text-gray-600">Skipped</span>}
                      {dose.status === 'missed' && <span className="badge bg-red-100 text-red-700">Missed</span>}
                      {dose.status === 'pending' && (
                        <>
                          <button onClick={() => markDose(dose.id, 'taken')} className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 font-medium">Take</button>
                          <button onClick={() => markDose(dose.id, 'skipped')} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium">Skip</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal with Sound Selection */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editMed ? 'Edit Medicine' : 'Add New Medicine'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Medicine Name *</label>
              <input className="input-field" placeholder="e.g. Metformin" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {MEDICINE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dosage</label>
              <input className="input-field" placeholder="e.g. 500" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['mg', 'ml', 'mcg', 'g', 'units', 'drops', 'puffs'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input-field" value={form.frequency}
                onChange={(e) => {
                  const f = e.target.value;
                  setForm({ ...form, frequency: f });
                  if (f === 'Once daily') updateTimes(1);
                  else if (f === 'Twice daily' || f === 'Every 12 hours') updateTimes(2);
                  else if (f === 'Three times daily' || f === 'Every 8 hours') updateTimes(3);
                  else if (f === 'Four times daily' || f === 'Every 6 hours') updateTimes(4);
                }}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          {/* Times */}
          <div>
            <label className="label">Reminder Times</label>
            <div className="flex flex-wrap gap-2">
              {form.times.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input type="time" className="input-field w-auto text-sm py-1.5" value={t}
                    onChange={(e) => {
                      const times = [...form.times];
                      times[i] = e.target.value;
                      setForm({ ...form, times });
                    }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Instructions</label>
            <textarea className="input-field resize-none" rows={2} placeholder="e.g. Take after meals"
              value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Reminder Settings</p>
            
            {/* Push Reminder Toggle */}
            <div 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSetting('reminderEnabled')}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Push Reminder</span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.reminderEnabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${form.reminderEnabled ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {/* Voice Alert Toggle */}
            <div 
              className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSetting('voiceAlert')}
            >
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Voice Alert</span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.voiceAlert ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${form.voiceAlert ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {/* Sound Alert Toggle with Sound Selection */}
            <div className="p-3 border border-gray-200 rounded-xl">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSetting('notificationSound')}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Sound Alert</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.notificationSound ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${form.notificationSound ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                </div>
              </div>
              
              {/* Sound Selection - Shows when sound alert is enabled */}
              {form.notificationSound && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <Music className="w-3.5 h-3.5" /> Choose Notification Sound
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOUND_OPTIONS.map((sound) => (
                      <div
                        key={sound.id}
                        onClick={() => setForm({ ...form, soundType: sound.id })}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.soundType === sound.id
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">{sound.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewSound(sound.id);
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="Preview Sound"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">{sound.description}</p>
                        {form.soundType === sound.id && (
                          <div className="absolute top-1.5 right-1.5">
                            <CheckCircle2 className="w-4 h-4 text-primary-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveMed} className="btn-primary" disabled={!form.name}>
              {editMed ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMed(deleteId)}
        title="Delete Medicine"
        message="Are you sure you want to delete this medicine? All associated dose records will be removed."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
