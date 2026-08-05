import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill, Calendar, FileText, Bell, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Activity, Heart,
  Shield, Phone, Star, Zap, Target, Award, Sun, Moon, Sunset
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  getMedicines, getDoses, saveDoses, getAppointments, getHealthProfiles, getRecords
} from '../utils/storage';
import { Medicine, MedicineDose, Appointment, HealthProfile } from '../types';
import { formatDate, playNotificationSound, speakText } from '../utils/helpers';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const getGreetingIcon = (hour: number) => {
  if (hour < 12) return Sun;
  if (hour < 17) return Sunset;
  return Moon;
};

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayDoses, setTodayDoses] = useState<MedicineDose[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [recordsCount, setRecordsCount] = useState(0);
  const today = format(new Date(), 'yyyy-MM-dd');
  const hour = new Date().getHours();
  const GreetIcon = getGreetingIcon(hour);

  const load = useCallback(() => {
    if (!user) return;
    const allMeds = getMedicines().filter((m) => m.userId === user.id);
    const allDoses = getDoses().filter((d) => d.userId === user.id && d.scheduledDate === today);
    const allAppts = getAppointments().filter((a) => a.userId === user.id && a.status === 'upcoming');
    const profile = getHealthProfiles().find((p) => p.userId === user.id) || null;
    const recs = getRecords().filter((r) => r.userId === user.id);
    setMedicines(allMeds);
    setTodayDoses(allDoses);
    setAppointments(allAppts.sort((a, b) => a.date.localeCompare(b.date)));
    setHealthProfile(profile);
    setRecordsCount(recs.length);
  }, [user, today]);

  useEffect(() => { load(); }, [load]);

  const taken = todayDoses.filter((d) => d.status === 'taken').length;
  const pending = todayDoses.filter((d) => d.status === 'pending').length;
  const missed = todayDoses.filter((d) => d.status === 'missed').length;
  const adherenceRate = todayDoses.length > 0 ? Math.round((taken / todayDoses.length) * 100) : 0;

  const markTaken = (doseId: string) => {
    const all = getDoses();
    const updated = all.map((d: MedicineDose) =>
      d.id === doseId ? { ...d, status: 'taken' as const, takenAt: new Date().toISOString() } : d
    );
    saveDoses(updated);
    load();
    const dose = todayDoses.find((d) => d.id === doseId);
    if (dose) {
      playNotificationSound();
      addNotification('reminder', 'Dose Taken ✓', `${dose.medicineName} marked as taken. Great job!`);
    }
  };

  const handleVoiceAlert = (med: Medicine) => {
    playNotificationSound();
    speakText(`Time to take your medicine: ${med.name}, ${med.dosage} ${med.unit}`);
  };

  const adherenceColor =
    adherenceRate >= 80 ? 'text-green-600' :
    adherenceRate >= 50 ? 'text-yellow-500' : 'text-red-500';

  const adherenceBg =
    adherenceRate >= 80 ? 'from-green-500 to-emerald-600' :
    adherenceRate >= 50 ? 'from-yellow-400 to-orange-500' : 'from-red-400 to-rose-600';

  const adherenceMsg =
    adherenceRate >= 80 ? 'Excellent!' :
    adherenceRate >= 50 ? 'Keep going!' : 'Needs improvement';

  return (
    <div className="space-y-6 pb-6">
      {/* Hero Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 sm:p-8 text-white shadow-lg"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GreetIcon className="w-5 h-5 text-primary-200" />
                <span className="text-primary-200 text-sm font-medium">{getGreeting(hour)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-primary-200 mt-1 text-sm">
                {format(new Date(), 'EEEE, MMMM dd, yyyy')}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <Shield className="w-4 h-4 text-green-300" />
                  <span className="text-xs font-semibold text-white">Your health data is secure</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
              <div className={`text-4xl font-extrabold text-white`}>{adherenceRate}%</div>
              <div className="text-primary-200 text-xs font-medium mt-0.5">Today&apos;s Adherence</div>
              <div className="text-white text-xs font-semibold mt-1">{adherenceMsg}</div>
              <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-white transition-all duration-500"
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Health badges */}
          <div className="flex flex-wrap gap-2 mt-5">
            {healthProfile?.bloodGroup && (
              <div className="flex items-center gap-1.5 bg-red-500/30 border border-red-400/30 rounded-xl px-3 py-1.5">
                <Heart className="w-3.5 h-3.5 text-red-300" />
                <span className="text-xs font-bold text-white">Blood: {healthProfile.bloodGroup}</span>
              </div>
            )}
            {healthProfile?.allergies && healthProfile.allergies.length > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/30 border border-orange-400/30 rounded-xl px-3 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-xs font-bold text-white">{healthProfile.allergies.length} Allerg{healthProfile.allergies.length > 1 ? 'ies' : 'y'}</span>
              </div>
            )}
            {healthProfile?.emergencyContact?.phone && (
              <div className="flex items-center gap-1.5 bg-green-500/30 border border-green-400/30 rounded-xl px-3 py-1.5">
                <Phone className="w-3.5 h-3.5 text-green-300" />
                <span className="text-xs font-bold text-white">Emergency: {healthProfile.emergencyContact.phone}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Today's Medicines", value: todayDoses.length, sub: `${taken} taken · ${pending} pending`,
            icon: Pill, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100',
            accent: 'bg-blue-600', link: '/medicines'
          },
          {
            label: 'Adherence Rate', value: `${adherenceRate}%`, sub: adherenceMsg,
            icon: Target, bg: adherenceRate >= 80 ? 'bg-green-50' : adherenceRate >= 50 ? 'bg-yellow-50' : 'bg-red-50',
            iconColor: adherenceRate >= 80 ? 'text-green-600' : adherenceRate >= 50 ? 'text-yellow-600' : 'text-red-600',
            border: adherenceRate >= 80 ? 'border-green-100' : 'border-yellow-100',
            accent: adherenceRate >= 80 ? 'bg-green-600' : 'bg-yellow-500', link: '/reports'
          },
          {
            label: 'Appointments', value: appointments.length, sub: 'Upcoming scheduled',
            icon: Calendar, bg: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-100',
            accent: 'bg-purple-600', link: '/appointments'
          },
          {
            label: 'Health Records', value: recordsCount, sub: 'Documents stored',
            icon: FileText, bg: 'bg-teal-50', iconColor: 'text-teal-600', border: 'border-teal-100',
            accent: 'bg-teal-600', link: '/records'
          },
        ].map(({ label, value, sub, icon: Icon, bg, iconColor, border, accent, link }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={link} className={`card border ${border} p-4 sm:p-5 flex flex-col hover:shadow-md transition-all group block`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 ${bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{value}</div>
              <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              <div className={`mt-3 h-1 rounded-full ${accent} opacity-30`} />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Dose Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                Today&apos;s Doses
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 ml-10">{format(new Date(), 'MMM dd, yyyy')}</p>
            </div>
            <Link
              to="/medicines"
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 bg-primary-50 px-2.5 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {todayDoses.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Pill className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No medicines scheduled today</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">Add your medicines to get started</p>
              <Link to="/medicines" className="inline-flex items-center gap-1 text-xs bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors font-semibold">
                Add Medicine
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {todayDoses
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .map((dose) => {
                const med = medicines.find((m) => m.id === dose.medicineId);
                return (
                  <div
                    key={dose.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      dose.status === 'taken'
                        ? 'bg-green-50 border-green-200'
                        : dose.status === 'missed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 shadow-sm'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (med?.color || '#3b82f6') + '20' }}
                    >
                      <Pill className="w-4 h-4" style={{ color: med?.color || '#3b82f6' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{dose.medicineName}</p>
                      <p className="text-xs text-gray-500">
                        {dose.scheduledTime}
                        {med && ` · ${med.dosage} ${med.unit}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {dose.status === 'taken' ? (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                        </div>
                      ) : dose.status === 'missed' ? (
                        <div className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-xl">
                          <AlertCircle className="w-3.5 h-3.5" /> Missed
                        </div>
                      ) : (
                        <>
                          {med?.voiceAlert && (
                            <button
                              type="button"
                              onClick={() => med && handleVoiceAlert(med)}
                              className="p-2 text-purple-500 hover:bg-purple-100 rounded-xl transition-colors"
                              title="Voice Alert"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => markTaken(dose.id)}
                            className="text-xs bg-primary-600 text-white px-3.5 py-2 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors font-bold shadow-sm"
                          >
                            Take Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {todayDoses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
              {[
                { label: 'Taken', value: taken, color: 'bg-green-100 text-green-700', border: 'border-green-200' },
                { label: 'Pending', value: pending, color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
                { label: 'Missed', value: missed, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
              ].map(({ label, value, color, border }) => (
                <div key={label} className={`${color} border ${border} rounded-2xl p-3 text-center`}>
                  <div className="text-xl font-extrabold">{value}</div>
                  <div className="text-xs font-semibold mt-0.5 opacity-80">{label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                Upcoming Appointments
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 ml-10">{appointments.length} scheduled</p>
            </div>
            <Link
              to="/appointments"
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 bg-primary-50 px-2.5 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No upcoming appointments</p>
              <p className="text-xs text-gray-400 mt-1 mb-3">Book your doctor visit now</p>
              <Link to="/appointments" className="inline-flex items-center gap-1 text-xs bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-semibold">
                Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {appointments.slice(0, 4).map((appt) => (
                <div key={appt.id} className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl hover:shadow-sm transition-all">
                  <div className="w-12 h-12 bg-white border border-purple-200 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-extrabold text-purple-700 leading-none">
                      {format(new Date(appt.date), 'dd')}
                    </span>
                    <span className="text-xs font-semibold text-purple-400">
                      {format(new Date(appt.date), 'MMM')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{appt.doctorName}</p>
                    <p className="text-xs font-medium text-purple-600">{appt.specialty}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🕐 {appt.time} · 📍 {appt.hospital || 'Location TBD'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Trust & Safety Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            icon: Shield,
            title: 'Your Data is Safe',
            desc: 'All your health information is encrypted and stored securely on your device.',
            color: 'from-blue-50 to-indigo-50 border-blue-100',
            iconBg: 'bg-blue-600',
          },
          {
            icon: Heart,
            title: 'Health First',
            desc: 'Never miss a dose. Our reminders keep you on track with your treatment plan.',
            color: 'from-red-50 to-pink-50 border-red-100',
            iconBg: 'bg-red-500',
          },
          {
            icon: Phone,
            title: 'Emergency Ready',
            desc: 'Your emergency contacts and blood group are always one tap away.',
            color: 'from-green-50 to-emerald-50 border-green-100',
            iconBg: 'bg-green-600',
          },
        ].map(({ icon: Icon, title, desc, color, iconBg }) => (
          <div key={title} className={`bg-gradient-to-br ${color} border rounded-2xl p-4 flex items-start gap-3`}>
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              to: '/medicines',
              label: 'Add Medicine',
              sub: 'Track new dose',
              icon: Pill,
              bg: 'from-blue-500 to-blue-600',
              shadow: 'shadow-blue-200',
            },
            {
              to: '/appointments',
              label: 'Book Appointment',
              sub: 'Schedule visit',
              icon: Calendar,
              bg: 'from-purple-500 to-purple-600',
              shadow: 'shadow-purple-200',
            },
            {
              to: '/records',
              label: 'Upload Record',
              sub: 'Store documents',
              icon: FileText,
              bg: 'from-teal-500 to-teal-600',
              shadow: 'shadow-teal-200',
            },
            {
              to: '/reports',
              label: 'View Reports',
              sub: 'Health analytics',
              icon: Activity,
              bg: 'from-orange-500 to-orange-600',
              shadow: 'shadow-orange-200',
            },
          ].map(({ to, label, sub, icon: Icon, bg, shadow }) => (
            <Link
              key={to}
              to={to}
              className={`bg-gradient-to-br ${bg} shadow-lg ${shadow} rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all text-white`}
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold leading-tight">{label}</p>
                <p className="text-xs opacity-75 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Motivation / Health tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-medical-600 to-teal-600 p-5 sm:p-6 text-white"
      >
        <div className="absolute top-0 right-0 opacity-10">
          <Award className="w-32 h-32 -translate-y-4 translate-x-4" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <p className="text-sm font-bold mb-1">💡 Health Tip of the Day</p>
            <p className="text-sm text-white/90 leading-relaxed">
              Taking your medicines at the same time every day helps build a routine and improves treatment effectiveness.
              Consistency is the key to better health outcomes!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
