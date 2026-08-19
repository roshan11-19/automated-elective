import React, { useState } from 'react';
import Modal from '../common/Modal';
import { UserPlus, Mail, AlertCircle } from 'lucide-react';

export default function AddStudentModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    branch: 'CSE',
    section: 'A',
    semester: 5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide student full name and valid college email address.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        semester: Number(formData.semester)
      });
      setFormData({
        name: '',
        email: '',
        roll_number: '',
        branch: 'CSE',
        section: 'A',
        semester: 5
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Student"
      subtitle="Register an eligible student with their official college email."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-crimson-50 text-crimson-700 border border-crimson-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Yaswanth"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              College Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. 24nu1a05j9@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Roll Number
            </label>
            <input
              type="text"
              placeholder="e.g. 24NU1A05J9"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Branch *
            </label>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Section *
            </label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 bg-white"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Current Semester *
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
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Adding...' : 'Enroll Student'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
