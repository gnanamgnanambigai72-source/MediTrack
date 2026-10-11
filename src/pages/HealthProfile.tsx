import React, { useState, useEffect } from 'react';
import { Heart, User, Shield, Phone, Plus, X, Save, Edit2, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getHealthProfiles, saveHealthProfiles } from '../utils/storage';
import { HealthProfile as HP } from '../types';
import { BLOOD_GROUPS } from '../utils/helpers';
import { motion } from 'framer-motion';
import DateOfBirthPicker from '../components/UI/DateOfBirthPicker';

const defaultProfile: HP = {
  userId: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  weight: '',
  height: '',
  allergies: [],
  chronicDiseases: [],
  emergencyContact: { name: '', phone: '', relationship: '' },
  insuranceNumber: '',
};

const GENDERS = [
  { value: 'male', label: 'Male', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', activeColor: 'bg-blue-600 border-blue-600 text-white' },
  { value: 'female', label: 'Female', color: 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300', activeColor: 'bg-pink-500 border-pink-500 text-white' },
  { value: 'others', label: 'Others', color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', activeColor: 'bg-purple-600 border-purple-600 text-white' },
];

function formatDOB(dob: string) {
  if (!dob) return null;
  const [year, month, day] = dob.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const [year, month, day] = dob.split('-').map(Number);
  if (!year || !month || !day) return null;
  
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
}

export default function HealthProfile() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState<HP>({ ...defaultProfile });
  const [editing, setEditing] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const profiles = getHealthProfiles();
      const found = profiles.find((p) => p.userId === user.id);
      if (found) setProfile(found);
      else setProfile({ ...defaultProfile, userId: user.id });
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    const profiles = getHealthProfiles();
    const exists = profiles.find((p) => p.userId === user.id);
    const updated = exists
      ? profiles.map((p) => (p.userId === user.id ? { ...profile, userId: user.id } : p))
      : [...profiles, { ...profile, userId: user.id }];
    saveHealthProfiles(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    addNotification('system', 'Health Profile Updated', 'Your health profile has been saved successfully.');
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile((prev) => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (a: string) =>
    setProfile((prev) => ({ ...prev, allergies: prev.allergies.filter((x) => x !== a) }));

  const addDisease = () => {
    if (newDisease.trim() && !profile.chronicDiseases.includes(newDisease.trim())) {
      setProfile((prev) => ({ ...prev, chronicDiseases: [...prev.chronicDiseases, newDisease.trim()] }));
      setNewDisease('');
    }
  };

  const removeDisease = (d: string) =>
    setProfile((prev) => ({ ...prev, chronicDiseases: prev.chronicDiseases.filter((x) => x !== d) }));

  const updateField = (key: keyof HP, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const updateEmergency = (key: 'name' | 'phone' | 'relationship', value: string) =>
    setProfile((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [key]: value },
    }));

  const age = calculateAge(profile.dateOfBirth);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Health Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Your personal health information - always safe with us</p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className={`flex items-center gap-2 ${editing ? 'btn-primary' : 'btn-secondary'}`}
          >
            {editing ? <><Save className="w-4 h-4" /> Save Profile</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl px-4 py-3 text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Health profile saved successfully!
        </motion.div>
      )}

      {!editing && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">Your health data is protected</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">All information is stored securely on your device. Click &quot;Edit Profile&quot; to update your details.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            Personal Details
          </h2>
          <div className="space-y-4">
            {/* Date of Birth and Age */}
            <div>
              <label className="label">Date of Birth</label>
              {editing ? (
                <DateOfBirthPicker
                  value={profile.dateOfBirth}
                  onChange={(v) => updateField('dateOfBirth', v)}
                />
              ) : (
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDOB(profile.dateOfBirth) || <span className="text-gray-400">Not set</span>}
                  </p>
                  {age !== null && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{age} years old</span>
                    </div>
                  )}
                </div>
              )}
              {editing && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                  Select day, month, and year from the dropdowns above
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="label">Gender</label>
              {editing ? (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {GENDERS.map(({ value, label, color, activeColor }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField('gender', value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 ${
                        profile.gender === value
                          ? `${activeColor} scale-105 shadow-md`
                          : `${color} hover:scale-102 border-2`
                      }`}
                    >
                      <span className={`text-sm font-bold ${profile.gender === value ? 'text-white' : ''}`}>{label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px] capitalize flex items-center gap-2">
                  {profile.gender ? (
                    <span>{GENDERS.find(g => g.value === profile.gender)?.label || profile.gender}</span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Weight (kg)</label>
                {editing ? (
                  <input type="number" className="input-field" placeholder="e.g. 65" value={profile.weight}
                    onChange={(e) => updateField('weight', e.target.value)} />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px]">
                    {profile.weight ? `${profile.weight} kg` : <span className="text-gray-400">Not set</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Height (cm)</label>
                {editing ? (
                  <input type="number" className="input-field" placeholder="e.g. 170" value={profile.height}
                    onChange={(e) => updateField('height', e.target.value)} />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px]">
                    {profile.height ? `${profile.height} cm` : <span className="text-gray-400">Not set</span>}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Insurance Number</label>
              {editing ? (
                <input type="text" className="input-field" placeholder="e.g. INS-12345" value={profile.insuranceNumber}
                  onChange={(e) => updateField('insuranceNumber', e.target.value)} />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px]">
                  {profile.insuranceNumber || <span className="text-gray-400">Not set</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            Medical Information
          </h2>
          <div className="space-y-4">
            {/* Blood Group */}
            <div>
              <label className="label">Blood Group</label>
              {editing ? (
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {BLOOD_GROUPS.map((bg) => (
                    <button key={bg} type="button" onClick={() => updateField('bloodGroup', bg)}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        profile.bloodGroup === bg
                          ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-red-400 hover:text-red-600'
                      }`}>{bg}</button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  {profile.bloodGroup ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-xl font-extrabold text-red-600 dark:text-red-400">{profile.bloodGroup}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 py-2">Not set</span>
                  )}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div>
              <label className="label">Known Allergies</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                {profile.allergies.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {a}
                    {editing && (
                      <button type="button" onClick={() => removeAllergy(a)} className="ml-0.5 hover:text-red-900 dark:hover:text-red-100">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {profile.allergies.length === 0 && <span className="text-xs text-gray-400">None recorded</span>}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input className="input-field text-sm flex-1" placeholder="e.g. Penicillin, Peanuts" value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }} />
                  <button type="button" onClick={addAllergy} className="btn-primary py-2 px-3 text-sm"><Plus className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            {/* Chronic Diseases */}
            <div>
              <label className="label">Chronic Conditions</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                {profile.chronicDiseases.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {d}
                    {editing && (
                      <button type="button" onClick={() => removeDisease(d)} className="ml-0.5 hover:text-orange-900 dark:hover:text-orange-100">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {profile.chronicDiseases.length === 0 && <span className="text-xs text-gray-400">None recorded</span>}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input className="input-field text-sm flex-1" placeholder="e.g. Diabetes, Hypertension" value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDisease(); } }} />
                  <button type="button" onClick={addDisease} className="btn-primary py-2 px-3 text-sm"><Plus className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            Emergency Contact
            <span className="badge bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs">Important</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                { label: 'Contact Name', key: 'name' as const, placeholder: 'Full name', type: 'text' },
                { label: 'Phone Number', key: 'phone' as const, placeholder: '+1 234 567 8900', type: 'tel' },
                { label: 'Relationship', key: 'relationship' as const, placeholder: 'e.g. Spouse, Parent', type: 'text' },
              ] as const
            ).map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="label">{label}</label>
                {editing ? (
                  <input type={type} className="input-field" placeholder={placeholder}
                    value={profile.emergencyContact[key] || ''}
                    onChange={(e) => updateEmergency(key, e.target.value)} />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[42px]">
                    {profile.emergencyContact[key] || <span className="text-gray-400">Not set</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
          {!editing && profile.emergencyContact.phone && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                In emergency, contact <strong>{profile.emergencyContact.name}</strong>
                {profile.emergencyContact.relationship && ` (${profile.emergencyContact.relationship})`} at{' '}
                <strong>{profile.emergencyContact.phone}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSave} className="btn-primary flex items-center gap-2 px-8">
            <Save className="w-4 h-4" /> Save Health Profile
          </button>
        </div>
      )}
    </div>
  );
}
