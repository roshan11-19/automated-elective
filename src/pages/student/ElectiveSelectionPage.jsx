import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Lock,
  Award,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import PrioritySelector from '../../components/student/PrioritySelector';
import Modal from '../../components/common/Modal';

export default function ElectiveSelectionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAuth();

  const currentType = searchParams.get('type') === 'OE' ? 'OE' : 'PE';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibleSubjects, setEligibleSubjects] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [allotmentRecord, setAllotmentRecord] = useState(null);

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        setLoading(true);

        // 1. Fetch eligible subjects
        const subjects = await studentService.getEligibleSubjects(currentUser, currentType);
        setEligibleSubjects(subjects);

        // 2. Check if already submitted and locked
        const existingAllotment = await studentService.getAllotment(currentUser.id, currentType);
        const existingPrefs = await studentService.getSubmittedPreferences(currentUser.id, currentType);

        if (existingAllotment || existingPrefs.length > 0) {
          setIsLocked(true);
          setAllotmentRecord(existingAllotment);
          if (existingPrefs.length > 0) {
            setPriorities(existingPrefs.map(p => ({ subject_id: p.subject_id, priority: p.priority })));
          }
        } else {
          setIsLocked(false);
          setAllotmentRecord(null);
          // Initial priority mapping
          const initial = subjects.map((s, idx) => ({
            subject_id: s.id,
            priority: idx + 1
          }));
          setPriorities(initial);
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, currentType]);

  const handleTypeChange = (type) => {
    setSearchParams({ type });
  };

  const handleOpenConfirm = () => {
    if (priorities.length === 0) {
      showToast('No subjects available to submit.', 'error');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const result = await studentService.submitPreferences(
        currentUser.id,
        currentType,
        priorities
      );

      setIsLocked(true);
      setConfirmModalOpen(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`Your ${currentType === 'PE' ? 'Professional' : 'Open'} Elective priorities are locked and allotted successfully!`);
      
      // Reload allotment record
      const freshAllotment = await studentService.getAllotment(currentUser.id, currentType);
      setAllotmentRecord(freshAllotment);
    } catch (err) {
      showToast(err.message || 'Failed to submit priorities.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-crimson-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-gray-400">
          Autonomous Elective Selection
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-6">
        
        {/* Type Toggle Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-crimson-700">
              Elective Preference Selection
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-0.5">
              {currentType === 'PE' ? 'Professional Elective (PE)' : 'Open Elective (OE)'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isLocked 
                ? 'Your preferences have been confirmed, timestamped, and locked.' 
                : 'Arrange your preferred subjects in order of priority (1 = highest preference).'}
            </p>
          </div>

          <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200">
            <button
              onClick={() => handleTypeChange('PE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentType === 'PE'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Professional (PE)</span>
            </button>
            <button
              onClick={() => handleTypeChange('OE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentType === 'OE'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Elective (OE)</span>
            </button>
          </div>
        </div>

        {/* Student Academic Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-50 border border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">College Email</span>
            <span className="font-bold text-gray-900 truncate block">{currentUser?.email}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Roll Number</span>
            <span className="font-extrabold text-gray-900 font-mono">{currentUser?.roll_number || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Branch</span>
            <span className="font-bold text-gray-900">{currentUser?.branch}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Semester</span>
            <span className="font-bold text-crimson-700">Semester {currentUser?.semester}</span>
          </div>
        </div>

        {/* Locked Banner Notification */}
        {isLocked && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-300 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 font-bold">
              <Lock className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <span className="text-amber-900 text-sm block">Selection Locked</span>
                <span className="font-normal text-amber-800 text-[11px]">
                  Your priority choices have been officially registered. To prevent race conditions, selections cannot be modified once submitted.
                </span>
              </div>
            </div>

            <Link
              to={`/student/allotment?type=${currentType}`}
              className="px-4 py-2 rounded-lg bg-white text-crimson-800 font-bold border border-amber-200 shadow-2xs hover:bg-amber-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <FileCheck className="w-4 h-4" />
              <span>View Allotment Memo</span>
            </Link>
          </div>
        )}

      </div>

      {/* Main Subject Priority List / Locked Display */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-crimson-200 border-t-crimson-700 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Loading eligible elective subjects...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-gray-900 font-display">
                {isLocked ? 'Submitted Priority Order' : 'Arrange Your Priorities'}
              </h3>
              <p className="text-xs text-gray-500">
                {isLocked 
                  ? 'These priorities were evaluated chronologically in First-In, First-Out order.' 
                  : 'Drag items or use the up/down arrows to position your top preferred subject first.'}
              </p>
            </div>

            {isLocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Allotment Processed</span>
              </span>
            )}
          </div>

          {/* If Locked, show locked list, otherwise show PrioritySelector */}
          {isLocked ? (
            <div className="space-y-3">
              {priorities.map((item, idx) => {
                const subj = eligibleSubjects.find(s => s.id === item.subject_id);
                if (!subj) return null;
                const isAllottedThis = allotmentRecord?.subject_id === subj.id;

                return (
                  <div
                    key={subj.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isAllottedThis 
                        ? 'border-emerald-400 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-400' 
                        : 'border-gray-200 bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase bg-white px-2 py-0.5 rounded border border-gray-200">
                            {subj.subject_code}
                          </span>
                          <span className="text-xs font-bold text-gray-700">Priority {idx + 1}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-0.5">{subj.subject_name}</h4>
                      </div>
                    </div>

                    {isAllottedThis && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                        <Award className="w-3.5 h-3.5" />
                        <span>Allotted Subject</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <PrioritySelector
                subjects={eligibleSubjects}
                priorities={priorities}
                onChange={(updated) => setPriorities(updated)}
              />

              {/* Submit Action Bar */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-crimson-600" />
                  <span>Real-time FIFO allotment allocates immediately upon confirmation.</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenConfirm}
                  disabled={priorities.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white crimson-gradient-btn flex items-center justify-center gap-2 shadow-md shadow-crimson-700/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Lock Priorities</span>
                </button>
              </div>
            </>
          )}

        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={`Lock Your ${currentType === 'PE' ? 'Professional' : 'Open'} Elective Preferences`}
        subtitle="Please review your final preference order carefully."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          
          <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
            {priorities.map((item, idx) => {
              const subj = eligibleSubjects.find(s => s.id === item.subject_id);
              if (!subj) return null;
              return (
                <div key={item.subject_id} className="flex items-center justify-between text-xs p-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-crimson-100 text-crimson-800 flex items-center justify-center font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-gray-900">{subj.subject_name}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                    {subj.subject_code}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">Locking Policy:</span>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Once confirmed, your choices will be permanently locked and instantly processed by the FIFO engine. You will not be able to re-order or edit subjects after submission.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Lock Preferences</span>
                </>
              )}
            </button>
          </div>

        </div>
      </Modal>

    </div>
  );
}
