import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getUsers, saveUsers } from '../utils/storage';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotifications();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const saveProfile = () => {
    if (!name.trim()) return;
    setSaving(true);
    updateUser({ name: name.trim(), phone: phone.trim() });
    setTimeout(() => {
      setSaving(false);
      setSavedMsg('Profile updated successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
      addNotification('system', 'Profile Updated', 'Your profile has been updated.');
    }, 500);
  };

  const changePassword = () => {
    setPassError('');
    setPassSuccess('');
    if (!user) return;
    const users = getUsers();
    const found = users.find((u) => u.id === user.id);
    if (!found || found.password !== btoa(passwordForm.current)) {
      setPassError('Current password is incorrect.');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPassError('New passwords do not match.');
      return;
    }
    saveUsers(users.map((u) => u.id === user.id ? { ...u, password: btoa(passwordForm.newPass) } : u));
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setPassSuccess('Password changed successfully!');
    setTimeout(() => setPassSuccess(''), 3000);
    addNotification('system', 'Password Changed', 'Your password has been changed successfully.');
  };

  const toggleShow = (key: 'current' | 'newPass' | 'confirm') => {
    setShowPass((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and security settings</p>
      </div>

      {savedMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" /> {savedMsg}
        </motion.div>
      )}

      {/* Avatar Card */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-extrabold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <Shield className="w-3 h-3" />
                {user?.role === 'admin' ? 'Administrator' : 'Patient'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" /> Personal Information
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="profile-name"
                type="text"
                className="input-field pl-10"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="profile-email" className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="profile-email"
                type="email"
                className="input-field pl-10 opacity-60 cursor-not-allowed"
                value={user?.email || ''}
                readOnly
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email address cannot be changed for security reasons.</p>
          </div>
          <div>
            <label htmlFor="profile-phone" className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="profile-phone"
                type="tel"
                className="input-field pl-10"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || !name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-600" /> Change Password
        </h2>
        {passError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            {passError}
          </div>
        )}
        {passSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {passSuccess}
          </div>
        )}
        <div className="space-y-4">
          {(
            [
              { label: 'Current Password', key: 'current' as const, placeholder: 'Enter your current password' },
              { label: 'New Password', key: 'newPass' as const, placeholder: 'At least 6 characters' },
              { label: 'Confirm New Password', key: 'confirm' as const, placeholder: 'Re-enter new password' },
            ] as const
          ).map(({ label, key, placeholder }) => (
            <div key={key}>
              <label htmlFor={`pass-${key}`} className="label">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id={`pass-${key}`}
                  type={showPass[key] ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder={placeholder}
                  value={passwordForm[key]}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleShow(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={changePassword}
            disabled={!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm}
            className="btn-primary flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Change Password
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-1">
          {[
            { label: 'Account ID', value: user?.id, mono: true },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First session' },
            { label: 'Account Role', value: user?.role === 'admin' ? 'Administrator' : 'Patient' },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-lg' : ''}`}>
                {value || '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
