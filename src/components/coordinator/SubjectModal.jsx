import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function SubjectModal({ isOpen, onClose, onSave, editingSubject = null, defaultType = 'PE' }) {
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    elective_type: defaultType,
    branch: defaultType === 'OE' ? 'ALL' : 'CSE',
    semester: 5,
    seats: 10,
    active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        subject_code: editingSubject.subject_code || '',
        subject_name: editingSubject.subject_name || '',
        elective_type: editingSubject.elective_type || defaultType,
        branch: editingSubject.branch || (defaultType === 'OE' ? 'ALL' : 'CSE'),
        semester: editingSubject.semester || 5,
        seats: editingSubject.seats || 10,
        active: editingSubject.active ?? true
      });
    } else {
      setFormData({
        subject_code: '',
        subject_name: '',
        elective_type: defaultType,
        branch: defaultType === 'OE' ? 'ALL' : 'CSE',
        semester: 5,
        seats: 10,
        active: true
      });
    }
    setError('');
  }, [editingSubject, isOpen, defaultType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.subject_code.trim() || !formData.subject_name.trim()) {
      setError('Please fill in both Subject Code and Subject Name.');
      return;
    }

    if (Number(formData.seats) <= 0) {
      setError('Seat capacity must be greater than 0.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        ...formData,
        seats: Number(formData.seats),
        semester: Number(formData.semester)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save subject.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubject ? `Edit ${formData.elective_type === 'PE' ? 'Professional' : 'Open'} Elective` : `Add ${formData.elective_type === 'PE' ? 'Professional' : 'Open'} Elective Subject`}
      subtitle="Configure subject title, department, and maximum seat capacity."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-crimson-50 text-crimson-700 border border-crimson-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Subject Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS501PE"
              value={formData.subject_code}
              onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Elective Type *
            </label>
            <select
              value={formData.elective_type}
              onChange={(e) => setFormData({ 
                ...formData, 
                elective_type: e.target.value,
                branch: e.target.value === 'OE' ? 'ALL' : (formData.branch === 'ALL' ? 'CSE' : formData.branch)
              })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 bg-white font-semibold"
            >
              <option value="PE">Professional Elective (PE)</option>
              <option value="OE">Open Elective (OE)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Subject Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Artificial Intelligence & Machine Learning"
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Branch *
            </label>
            {formData.elective_type === 'OE' ? (
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 bg-white"
              >
                <option value="ALL">ALL Branches (Open Elective)</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            ) : (
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 bg-white"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Semester *
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Seat Capacity *
            </label>
            <input
              type="number"
              min="1"
              max="500"
              required
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white crimson-gradient-btn disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Save Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
