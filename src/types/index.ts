export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface HealthProfile {
  userId: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  weight: string;
  height: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceNumber: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  instructions: string;
  color: string;
  category: string;
  reminderEnabled: boolean;
  voiceAlert: boolean;
  notificationSound: boolean;
  soundType: string;
  createdAt: string;
}

export interface MedicineDose {
  id: string;
  userId: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  scheduledDate: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
}

export interface HealthRecord {
  id: string;
  userId: string;
  type: 'prescription' | 'lab_report' | 'medical_image' | 'vaccination' | 'insurance';
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  doctorName?: string;
  tags: string[];
}

export interface Appointment {
  id: string;
  userId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  notes: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reminderSet: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'missed' | 'appointment' | 'system' | 'summary';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role?: 'user' | 'admin') => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}
