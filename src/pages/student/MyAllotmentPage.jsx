import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowLeft, 
  BookOpen, 
  Globe, 
  Clock, 
  AlertCircle,
  FileCheck,
  Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import AllotmentCard from '../../components/student/AllotmentCard';

export default function MyAllotmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const currentType = searchParams.get('type') === 'OE' ? 'OE' : 'PE';

  const [loading, setLoading] = useState(true);
  const [allotment, setAllotment] = useState(null);

  useEffect(() => {
    async function loadAllotment() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = await studentService.getAllotment(currentUser.id, currentType);
        setAllotment(data);
      } catch (err) {
        console.error('Error fetching allotment:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllotment();
  }, [currentUser, currentType]);

  const handleTypeChange = (type) => {
    setSearchParams({ type });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-crimson-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-gray-400">
          Official Academic Allotment Memo
        </span>
      </div>

      {/* Type Toggle Tabs */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">
            My Elective Allotment Result
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View your verified seat allotment result for Semester {currentUser?.semester}.
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

      {/* Main Allotment Letter / Status */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-4 border-crimson-200 border-t-crimson-700 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Retrieving allotment status...</p>
        </div>
      ) : allotment ? (
        <AllotmentCard allotment={allotment} profile={currentUser} electiveType={currentType} />
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-display">
              Allotment In Progress
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
              The automated FIFO allotment process for {currentType === 'PE' ? 'Professional Elective' : 'Open Elective'} has not been executed yet by the Academic Coordinator office.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to={`/student/select?type=${currentType}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white crimson-gradient-btn shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>Verify / Update Submitted Priorities</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
