import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award,
  Sparkles,
  Lock,
  Radio,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [pePrefs, setPePrefs] = useState([]);
  const [oePrefs, setOePrefs] = useState([]);
  const [peAllotment, setPeAllotment] = useState(null);
  const [oeAllotment, setOeAllotment] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      try {
        setLoading(true);

        const [peA, oeA, peP, oeP] = await Promise.all([
          studentService.getAllotment(currentUser.id, 'PE'),
          studentService.getAllotment(currentUser.id, 'OE'),
          studentService.getSubmittedPreferences(currentUser.id, 'PE'),
          studentService.getSubmittedPreferences(currentUser.id, 'OE')
        ]);

        setPeAllotment(peA);
        setOeAllotment(oeA);
        setPePrefs(peP);
        setOePrefs(oeP);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crimson-200 border-t-crimson-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPeLocked = Boolean(peAllotment || pePrefs.length > 0);
  const isOeLocked = Boolean(oeAllotment || oePrefs.length > 0);

  return (
    <div className="space-y-6">
      
      {/* 1. LIVE SCROLLING TICKER / MARQUEE BAR */}
      <div className="bg-gradient-to-r from-crimson-900 via-crimson-700 to-crimson-900 text-white overflow-hidden py-2.5 px-4 shadow-sm border-b border-crimson-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white text-crimson-800 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-crimson-600 animate-ping"></span>
            <span>LIVE ALLOTMENT</span>
          </div>

          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-marquee text-xs font-semibold tracking-wide space-x-12">
              <span>📢 Professional Elective (PE) & Open Elective (OE) subject selection is ACTIVE.</span>
              <span>⚡ Allotments are calculated INSTANTLY in real-time using First-In, First-Out (FIFO) timestamp order.</span>
              <span>🔒 Once preferences are submitted, choices are permanently locked to guarantee allotment integrity.</span>
              <span>🎓 Welcome {currentUser?.name} ({currentUser?.email}) • Semester {currentUser?.semester} {currentUser?.branch}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
        
        {/* 2. WELCOME & ACADEMIC PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-crimson-100/40 via-coral-light/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-50 border border-crimson-200 text-xs font-bold text-crimson-700 uppercase tracking-wider">
                <span>Verified Student Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display tracking-tight">
                Welcome, {currentUser?.name}
              </h1>
              <p className="text-xs text-gray-500 max-w-xl">
                Select and prioritize your Professional Electives and Open Electives. Allotments are calculated atomically in real-time upon your submission.
              </p>
            </div>

            {/* Key Identifiers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-50 p-4 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">College Email</span>
                <span className="font-bold text-gray-900 truncate block text-xs">{currentUser?.email}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Roll Number</span>
                <span className="font-extrabold text-gray-900 font-mono text-sm">{currentUser?.roll_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Branch & Sec</span>
                <span className="font-bold text-gray-900 text-sm">{currentUser?.branch} - {currentUser?.section || 'A'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Semester</span>
                <span className="font-bold text-crimson-700 text-sm">Sem {currentUser?.semester}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN TWO ELECTIVE MODULES (PE & OE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Module 1: Professional Elective (PE) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card hover:border-crimson-300 hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden group">
            <div className="p-6 sm:p-8 space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-crimson-50 text-crimson-700 border border-crimson-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-7 h-7" />
                </div>
                
                {isPeLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Submitted & Locked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selection Active</span>
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Department Elective</div>
                <h2 className="text-2xl font-bold text-gray-900 font-display mt-0.5">
                  Professional Elective (PE)
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Specialized domain courses exclusive to <strong>{currentUser?.branch}</strong> students in Semester {currentUser?.semester}.
                </p>
              </div>

              {/* Allotment Status Card */}
              {peAllotment ? (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  peAllotment.status === 'ALLOTTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{peAllotment.status === 'ALLOTTED' ? `Allotted (Priority ${peAllotment.priority_selected})` : 'WAITLISTED (No Vacancy)'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {new Date(peAllotment.allotted_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {peAllotment.subject && (
                    <div className="text-sm font-extrabold text-gray-900">
                      {peAllotment.subject.subject_name} ({peAllotment.subject.subject_code})
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-crimson-600 flex-shrink-0" />
                  <span>Prioritize your subjects now. First-In, First-Out rule applies.</span>
                </div>
              )}

            </div>

            {/* Action Bar */}
            <div className="p-6 sm:px-8 sm:py-5 bg-surface-50 border-t border-gray-100 flex items-center justify-between">
              {isPeLocked ? (
                <Link
                  to="/student/allotment?type=PE"
                  className="text-xs font-bold text-crimson-700 hover:text-crimson-800 flex items-center gap-1"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>View Official Allotment Memo</span>
                </Link>
              ) : (
                <span className="text-xs text-gray-500 font-medium">Ready to Submit</span>
              )}

              <Link
                to="/student/select?type=PE"
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  isPeLocked
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    : 'text-white crimson-gradient-btn'
                }`}
              >
                {isPeLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>View Locked Priorities</span>
                  </>
                ) : (
                  <>
                    <span>Select & Submit Priorities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Link>
            </div>
          </div>

          {/* Module 2: Open Elective (OE) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card hover:border-crimson-300 hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden group">
            <div className="p-6 sm:p-8 space-y-5">
              
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-coral/10 text-crimson-700 border border-coral/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Globe className="w-7 h-7" />
                </div>

                {isOeLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Submitted & Locked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selection Active</span>
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Interdisciplinary Elective</div>
                <h2 className="text-2xl font-bold text-gray-900 font-display mt-0.5">
                  Open Elective (OE)
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Interdisciplinary subjects open across multiple departments for broad academic enrichment.
                </p>
              </div>

              {/* Allotment Status Card */}
              {oeAllotment ? (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  oeAllotment.status === 'ALLOTTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{oeAllotment.status === 'ALLOTTED' ? `Allotted (Priority ${oeAllotment.priority_selected})` : 'WAITLISTED (No Vacancy)'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {new Date(oeAllotment.allotted_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {oeAllotment.subject && (
                    <div className="text-sm font-extrabold text-gray-900">
                      {oeAllotment.subject.subject_name} ({oeAllotment.subject.subject_code})
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-crimson-600 flex-shrink-0" />
                  <span>Prioritize your subjects now. First-In, First-Out rule applies.</span>
                </div>
              )}

            </div>

            {/* Action Bar */}
            <div className="p-6 sm:px-8 sm:py-5 bg-surface-50 border-t border-gray-100 flex items-center justify-between">
              {isOeLocked ? (
                <Link
                  to="/student/allotment?type=OE"
                  className="text-xs font-bold text-crimson-700 hover:text-crimson-800 flex items-center gap-1"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>View Official Allotment Memo</span>
                </Link>
              ) : (
                <span className="text-xs text-gray-500 font-medium">Ready to Submit</span>
              )}

              <Link
                to="/student/select?type=OE"
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  isOeLocked
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    : 'text-white crimson-gradient-btn'
                }`}
              >
                {isOeLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>View Locked Priorities</span>
                  </>
                ) : (
                  <>
                    <span>Select & Submit Priorities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
