import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Bell, FileText, Calendar, Shield, BarChart3,
  ChevronRight, Star, Users, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: Bell, title: 'Smart Medicine Reminders', desc: 'Voice alerts, notification sounds, and push notifications for every dose.', color: 'bg-blue-50 text-blue-600' },
  { icon: FileText, title: 'Health Records', desc: 'Securely store prescriptions, lab reports, and medical images.', color: 'bg-green-50 text-green-600' },
  { icon: Calendar, title: 'Doctor Appointments', desc: 'Book, track, and get reminders for all your medical appointments.', color: 'bg-purple-50 text-purple-600' },
  { icon: Shield, title: 'Health Profile', desc: 'Keep your blood group, allergies, and emergency contacts safe.', color: 'bg-orange-50 text-orange-600' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Track medicine adherence and get detailed health analytics.', color: 'bg-pink-50 text-pink-600' },
  { icon: Activity, title: 'Missed Dose Alerts', desc: 'Automatic alerts for missed doses and daily medicine summaries.', color: 'bg-teal-50 text-teal-600' },
];

const stats = [
  { label: 'Active Users', value: '50K+', icon: Users },
  { label: 'Medicines Tracked', value: '1M+', icon: Bell },
  { label: 'Records Stored', value: '500K+', icon: FileText },
  { label: 'Appointments', value: '200K+', icon: Calendar },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MediTrack</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm py-2 px-4">
                Go to Dashboard
              </button>
            ) : (
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-medical-50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="badge bg-primary-100 text-primary-700 mb-4 inline-flex">
              <Star className="w-3 h-3 mr-1" /> Trusted by 50,000+ patients
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Your Personal<br />
              <span className="text-primary-600">Health Manager</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Never miss a dose again. MediTrack keeps your medicines, health records, and appointments organized — all in one secure place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <button onClick={() => navigate('/dashboard')} className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
                  Open Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link to="/login" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
                  Sign In to Account <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="card text-center p-4">
                <Icon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              A complete health management platform designed for patients who take their health seriously.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to take control of your health?</h2>
          <p className="text-primary-200 text-lg mb-8">Join thousands of users managing their health with MediTrack.</p>
          {isAuthenticated ? (
            <button onClick={() => navigate('/dashboard')} className="bg-white text-primary-600 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
              Go to Dashboard <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Link to="/login" className="bg-white text-primary-600 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
              Sign In to Account <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">MediTrack</span>
        </div>
        <p className="text-sm">© 2025 MediTrack. Your health, our priority.</p>
        <div className="flex justify-center gap-2 mt-2">
          {['Privacy Policy', 'Terms of Service', 'Contact'].map((item) => (
            <span key={item} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors px-2">
              {item}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
