import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';

export const formatDate = (dateStr: string, fmt = 'MMM dd, yyyy') => {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy hh:mm a');
  } catch {
    return dateStr;
  }
};

export const isDateToday = (dateStr: string) => {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
};

export const isDatePast = (dateStr: string) => {
  try {
    return isPast(parseISO(dateStr));
  } catch {
    return false;
  }
};

export const isDateFuture = (dateStr: string) => {
  try {
    return isFuture(parseISO(dateStr));
  } catch {
    return false;
  }
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const MEDICINE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];
export const MEDICINE_CATEGORIES = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Inhaler', 'Patch', 'Ointment',
];
export const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed',
];
export const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedist', 'Pediatrician', 'Psychiatrist', 'Gynecologist',
  'Ophthalmologist', 'ENT Specialist', 'Endocrinologist', 'Urologist',
];

export const SOUND_OPTIONS = [
  { id: 'bell-chime', name: 'Bell Chime', description: 'Classic bell sound' },
  { id: 'gentle-ping', name: 'Gentle Ping', description: 'Soft notification' },
  { id: 'alert-beep', name: 'Alert Beep', description: 'Attention-grabbing' },
  { id: 'happy-tune', name: 'Happy Tune', description: 'Cheerful melody' },
  { id: 'soft-ring', name: 'Soft Ring', description: 'Calm reminder' },
  { id: 'urgent-alert', name: 'Urgent Alert', description: 'High priority' },
];

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Play different notification sounds based on sound type
export const playNotificationSound = (soundType: string = 'bell-chime') => {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  
  const soundConfigs: Record<string, { frequencies: number[], duration: number, type: OscillatorType }> = {
    'bell-chime': { frequencies: [880, 1100, 880], duration: 0.5, type: 'sine' },
    'gentle-ping': { frequencies: [600, 800], duration: 0.3, type: 'sine' },
    'alert-beep': { frequencies: [1000, 1200, 1000, 1200], duration: 0.6, type: 'square' },
    'happy-tune': { frequencies: [523, 659, 784, 659], duration: 0.8, type: 'sine' },
    'soft-ring': { frequencies: [440, 550, 440], duration: 0.4, type: 'triangle' },
    'urgent-alert': { frequencies: [1200, 1400, 1200, 1400, 1200], duration: 0.7, type: 'sawtooth' },
  };

  const config = soundConfigs[soundType] || soundConfigs['bell-chime'];
  const { frequencies, duration, type } = config;
  const timePerFreq = duration / frequencies.length;

  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * timePerFreq);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + index * timePerFreq);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (index + 1) * timePerFreq);
    
    oscillator.start(ctx.currentTime + index * timePerFreq);
    oscillator.stop(ctx.currentTime + (index + 1) * timePerFreq);
  });
};

// Preview a specific sound
export const previewSound = (soundType: string) => {
  playNotificationSound(soundType);
};

export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};
