import { User, HealthProfile, Medicine, MedicineDose, HealthRecord, Appointment, Notification } from '../types';

export const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const KEYS = {
  users: 'mt_users',
  healthProfiles: 'mt_health_profiles',
  medicines: 'mt_medicines',
  doses: 'mt_doses',
  records: 'mt_records',
  appointments: 'mt_appointments',
  notifications: 'mt_notifications',
};

const get = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const save = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getUsers = () => get<User>(KEYS.users);
export const saveUsers = (data: User[]) => save(KEYS.users, data);

export const getHealthProfiles = () => get<HealthProfile>(KEYS.healthProfiles);
export const saveHealthProfiles = (data: HealthProfile[]) => save(KEYS.healthProfiles, data);

export const getMedicines = () => get<Medicine>(KEYS.medicines);
export const saveMedicines = (data: Medicine[]) => save(KEYS.medicines, data);

export const getDoses = () => get<MedicineDose>(KEYS.doses);
export const saveDoses = (data: MedicineDose[]) => save(KEYS.doses, data);

export const getRecords = () => get<HealthRecord>(KEYS.records);
export const saveRecords = (data: HealthRecord[]) => save(KEYS.records, data);

export const getAppointments = () => get<Appointment>(KEYS.appointments);
export const saveAppointments = (data: Appointment[]) => save(KEYS.appointments, data);

export const getNotifications = () => get<Notification>(KEYS.notifications);
export const saveNotifications = (data: Notification[]) => save(KEYS.notifications, data);
