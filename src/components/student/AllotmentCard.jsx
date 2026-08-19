import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  Award, 
  Building2, 
  Calendar,
  FileCheck
} from 'lucide-react';

export default function AllotmentCard({ allotment, profile, electiveType = 'PE' }) {
  const handlePrint = () => {
    window.print();
  };

  const isAllotted = allotment?.status === 'ALLOTTED';
  const isWaitlisted = allotment?.status === 'WAITLISTED';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      
      {/* College Official Letterhead for Print & Screen */}
      <div className="bg-gradient-to-r from-crimson-800 via-crimson-700 to-crimson-900 text-white p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-crimson-200 font-bold">
                College Autonomous Academic Office
              </span>
              <h2 className="text-2xl font-black font-display tracking-tight text-white">
                Official Elective Allotment Memo
              </h2>
              <p className="text-xs text-crimson-100 mt-0.5">
                Academic Year 2024–2025 • {allotment?.elective_type || electiveType === 'PE' ? 'Professional Elective (PE)' : 'Open Elective (OE)'}
              </p>
            </div>
          </div>

          <div className="no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-crimson-800 hover:bg-crimson-50 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Allotment Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-gray-50/70">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Allotment Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isAllotted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SEAT ALLOTTED SUCCESSFULLY
                </span>
              )}
              {isWaitlisted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  WAITLISTED / INSUFFICIENT VACANCY
                </span>
              )}
              {!allotment && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  <Clock className="w-4 h-4 text-blue-600" />
                  SELECTION PENDING / IN PROCESS
                </span>
              )}
            </div>
          </div>

          {isAllotted && allotment.priority_selected && (
            <div className="sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Preference Met
              </span>
              <div className="text-base font-extrabold text-crimson-700 flex items-center sm:justify-end gap-1 mt-0.5">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Priority {allotment.priority_selected} Allotted</span>
              </div>
            </div>
          )}
        </div>

        {/* Student Academic Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-50 border border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 font-medium block">Roll Number</span>
            <span className="font-bold text-gray-900 font-mono text-sm mt-0.5 block">
              {profile?.roll_number || allotment?.roll_number}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">Student Name</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">
              {profile?.name}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">Branch & Section</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">
              {profile?.branch} - Section {profile?.section}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">Regulation / Sem</span>
            <span className="font-bold text-gray-900 text-sm mt-0.5 block">
              {profile?.regulation} • Semester {profile?.semester}
            </span>
          </div>
        </div>

        {/* Allotted Subject Highlight */}
        {isAllotted && allotment.subject && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-crimson-50/50 via-white to-coral/10 border-2 border-crimson-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold tracking-wider text-crimson-700 uppercase">
                  Allotted Elective Subject
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 font-display">
                  {allotment.subject.subject_name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600 font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 font-mono font-bold text-gray-800 shadow-xs">
                    Code: {allotment.subject.subject_code}
                  </span>
                  <span>Elective Type: <strong>{allotment.elective_type}</strong></span>
                  <span>Branch: <strong>{allotment.subject.branch}</strong></span>
                </div>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {isWaitlisted && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2">
            <h4 className="font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Waitlist Notice</span>
            </h4>
            <p className="text-xs leading-relaxed text-amber-800">
              All prioritized subjects in your submission reached maximum seat capacity before your submission timestamp was reached in the FIFO processing queue.
              Please contact the Academic Coordinator office for manual vacancy resolution.
            </p>
          </div>
        )}

        {/* Verification & Timestamps */}
        <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
          <div>
            <span>FIFO Submission Timestamp: </span>
            <strong className="text-gray-700 font-mono">
              {allotment?.submitted_at ? new Date(allotment.submitted_at).toLocaleString() : 'N/A'}
            </strong>
          </div>
          <div className="sm:text-right">
            <span>Allotment Processed At: </span>
            <strong className="text-gray-700 font-mono">
              {allotment?.allotted_at ? new Date(allotment.allotted_at).toLocaleString() : 'Pending Execution'}
            </strong>
          </div>
        </div>

        {/* Print Only Signatures */}
        <div className="hidden print-only pt-16 mt-12 border-t border-gray-400">
          <div className="flex justify-between items-end text-xs text-black">
            <div className="text-center">
              <div className="w-40 border-b border-black mb-1"></div>
              <span>Student Signature</span>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-black mb-1"></div>
              <span>Department Coordinator</span>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-black mb-1"></div>
              <span>Dean (Academics)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
