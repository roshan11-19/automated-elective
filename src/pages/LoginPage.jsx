import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, loginStudent, loginCoordinator, loginWithGoogle, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('role') === 'coordinator' ? 'coordinator' : 'student');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  useEffect(() => {
    if (searchParams.get('role') === 'coordinator') {
      setActiveTab('coordinator');
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'coordinator') {
        navigate('/coordinator');
      } else {
        navigate('/student');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(activeTab === 'student' ? 'Please enter your registered College Email ID.' : 'Please enter your official Coordinator Email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'student') {
        await loginStudent(email, password);
        navigate('/student');
      } else {
        await loginCoordinator(email, password);
        navigate('/coordinator');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle(activeTab);
      if (activeTab === 'coordinator') navigate('/coordinator');
      else navigate('/student');
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-50">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-crimson-800 via-crimson-600 to-coral items-center justify-center shadow-lg shadow-crimson-700/20 text-white p-3">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="2" fill="#F8B1B3" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight font-display">
            Elective Portal Sign In
          </h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Log in using your registered college email address.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-6">
          
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError('');
                setEmail('');
                setPassword('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('coordinator');
                setError('');
                setEmail('');
                setPassword('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'coordinator'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Coordinator</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-crimson-50 border border-crimson-200 text-xs text-crimson-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {activeTab === 'student' ? 'College Email Address *' : 'Official Coordinator Email *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder={activeTab === 'student' ? 'student@college.edu' : 'coordinator@college.edu'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent font-medium"
                />
              </div>
              {activeTab === 'student' && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5">
                  <Info className="w-3.5 h-3.5 text-crimson-600 flex-shrink-0" />
                  <span>Only student emails registered by the Academic Coordinator can log in.</span>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSubmitted(false);
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-crimson-700 hover:text-crimson-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600 focus:border-transparent font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white crimson-gradient-btn flex items-center justify-center gap-2 shadow-md shadow-crimson-700/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to {activeTab === 'student' ? 'Student Portal' : 'Coordinator Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Or
              </span>
              <div className="border-t border-gray-200 w-full"></div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Login with Google Account</span>
            </button>

          </form>

        </div>

      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="We will dispatch a secure reset link to your registered college email."
      >
        {resetSubmitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Password Reset Email Dispatched</h4>
            <p className="text-xs text-gray-600">
              Please check your inbox at <strong>{resetEmail}</strong> for instructions to reset your elective portal access.
            </p>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white bg-crimson-700"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setResetSubmitted(true);
              showToast(`Password reset link dispatched to ${resetEmail}`, 'info');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Registered College Email Address *
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-crimson-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white crimson-gradient-btn"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
