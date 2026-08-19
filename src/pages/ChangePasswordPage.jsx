import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const { currentUser, changePassword } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentUser?.roll_number) {
      setError('New password cannot be identical to your default Roll Number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please retype carefully.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(newPassword);
      navigate('/student');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Alert */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 items-center justify-center shadow-md">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
            First Login Password Update
          </h2>
          <p className="text-xs text-amber-800 font-medium bg-amber-50 border border-amber-200 p-2.5 rounded-xl max-w-sm mx-auto">
            Please change your password before continuing to your student dashboard.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-5">
          
          {/* Student Profile Pill */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 block">Logged in as</span>
              <span className="font-bold text-gray-900">{currentUser?.name}</span>
            </div>
            <span className="px-2 py-1 bg-crimson-100 text-crimson-800 rounded font-mono font-bold">
              {currentUser?.roll_number}
            </span>
          </div>

          {error && (
            <div className="p-3 text-xs bg-crimson-50 text-crimson-700 border border-crimson-200 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Secure Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white crimson-gradient-btn flex items-center justify-center gap-2 shadow-md shadow-crimson-700/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Save Password & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
