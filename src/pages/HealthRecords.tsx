import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Download, Trash2, Plus, Search, Filter,
  FileImage, Syringe, Shield, TestTube, File
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getRecords, saveRecords, generateId } from '../utils/storage';
import { HealthRecord } from '../types';
import { formatDateTime, fileToBase64, formatFileSize } from '../utils/helpers';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { motion } from 'framer-motion';

const recordTypes = [
  { value: 'prescription', label: 'Prescription', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { value: 'lab_report', label: 'Lab Report', icon: TestTube, color: 'text-purple-600 bg-purple-50' },
  { value: 'medical_image', label: 'Medical Image', icon: FileImage, color: 'text-pink-600 bg-pink-50' },
  { value: 'vaccination', label: 'Vaccination', icon: Syringe, color: 'text-green-600 bg-green-50' },
  { value: 'insurance', label: 'Insurance', icon: Shield, color: 'text-orange-600 bg-orange-50' },
] as const;

export default function HealthRecords() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    type: 'prescription' as HealthRecord['type'],
    title: '', description: '', doctorName: '', tags: '',
    fileName: '', fileSize: '', fileType: '', fileData: '',
  });

  const load = () => {
    if (user) setRecords(getRecords().filter((r) => r.userId === user.id));
  };

  useEffect(() => { load(); }, [user]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const data = await fileToBase64(file);
    setForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      fileData: data,
    }));
    setUploading(false);
  };

  const saveRecord = () => {
    if (!user || !form.title) return;
    const record: HealthRecord = {
      id: generateId(),
      userId: user.id,
      type: form.type,
      title: form.title,
      description: form.description,
      fileName: form.fileName || 'No file',
      fileSize: form.fileSize,
      fileType: form.fileType,
      uploadedAt: new Date().toISOString(),
      doctorName: form.doctorName,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (form.fileData) {
      localStorage.setItem(`mt_file_${record.id}`, form.fileData);
    }
    const all = getRecords();
    saveRecords([record, ...all]);
    load();
    setShowModal(false);
    setForm({ type: 'prescription', title: '', description: '', doctorName: '', tags: '', fileName: '', fileSize: '', fileType: '', fileData: '' });
    addNotification('system', 'Record Uploaded', `${form.title} has been saved to your health records.`);
  };

  const deleteRecord = (id: string) => {
    const all = getRecords();
    saveRecords(all.filter((r) => r.id !== id));
    localStorage.removeItem(`mt_file_${id}`);
    load();
    addNotification('system', 'Record Deleted', 'Health record has been removed.');
  };

  const downloadRecord = (record: HealthRecord) => {
    const data = localStorage.getItem(`mt_file_${record.id}`);
    if (!data) { alert('No file available for download.'); return; }
    const link = document.createElement('a');
    link.href = data;
    link.download = record.fileName;
    link.click();
  };

  const filtered = records.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.doctorName?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.type === filterType;
    return matchSearch && matchType;
  });

  const getTypeInfo = (type: string) => recordTypes.find((t) => t.value === type) || recordTypes[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-500 text-sm mt-0.5">{records.length} records stored</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Record
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'All' }, ...recordTypes.map((t) => ({ value: t.value, label: t.label }))].map((t) => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterType === t.value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {recordTypes.map(({ value, label, icon: Icon, color }) => {
          const count = records.filter((r) => r.type === value).length;
          return (
            <button key={value} onClick={() => setFilterType(filterType === value ? 'all' : value)}
              className={`card p-3 text-center transition-all hover:shadow-md ${filterType === value ? 'ring-2 ring-primary-500' : ''}`}>
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No records found</h3>
          <p className="text-sm text-gray-400 mb-4">Upload prescriptions, lab reports and other medical documents.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Record</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record, i) => {
            const { icon: Icon, color } = getTypeInfo(record.type);
            const hasFile = !!localStorage.getItem(`mt_file_${record.id}`);
            return (
              <motion.div key={record.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{record.title}</h3>
                      <span className="text-xs text-gray-500 capitalize">{record.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {hasFile && (
                      <button onClick={() => downloadRecord(record)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteId(record.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {record.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{record.description}</p>}
                {record.doctorName && <p className="text-xs text-gray-500 mb-2">Dr. {record.doctorName}</p>}
                <div className="flex flex-wrap gap-1 mb-2">
                  {record.tags.map((tag) => (
                    <span key={tag} className="badge bg-gray-100 text-gray-600 text-xs">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1"><File className="w-3 h-3" /> {record.fileName}</span>
                  <span>{formatDateTime(record.uploadedAt)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Upload Health Record" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Record Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recordTypes.map(({ value, label, icon: Icon, color }) => (
                <button key={value} onClick={() => setForm({ ...form, type: value as HealthRecord['type'] })}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${form.type === value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}><Icon className="w-3.5 h-3.5" /></div>
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title *</label>
            <input className="input-field" placeholder="e.g. Blood Test Report - Jan 2025" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Doctor Name</label>
              <input className="input-field" placeholder="Dr. Smith" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input-field" placeholder="blood, routine, 2025" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">File Upload</label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {form.fileName ? (
                <div>
                  <p className="text-sm font-medium text-primary-600">{form.fileName}</p>
                  <p className="text-xs text-gray-400">{form.fileSize}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX up to 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={handleFile} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveRecord} className="btn-primary" disabled={!form.title || uploading}>
              {uploading ? 'Uploading...' : 'Save Record'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteRecord(deleteId)}
        title="Delete Record"
        message="Are you sure you want to delete this health record? This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
