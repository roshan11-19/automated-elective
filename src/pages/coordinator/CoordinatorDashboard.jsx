import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2, 
  BarChart3, 
  Users, 
  BookOpen, 
  Globe,
  Layers, 
  ShieldCheck, 
  Sliders, 
  UserPlus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { coordinatorService } from '../../services/coordinatorService';
import SubjectModal from '../../components/coordinator/SubjectModal';
import AddStudentModal from '../../components/coordinator/AddStudentModal';
import ManualOverrideModal from '../../components/coordinator/ManualOverrideModal';
import PrintAllotmentView from '../../components/coordinator/PrintAllotmentView';

const COLORS = ['#C8191E', '#D62026', '#F57F82', '#F8B1B3', '#1F2937', '#4B5563', '#9CA3AF'];

export default function CoordinatorDashboard() {
  const { currentUser, showToast } = useAuth();
  
  // 3 Major Workflow Tabs
  const [activeTab, setActiveTab] = useState('ANALYZE'); // 'ADD_DETAILS', 'ANALYZE', 'CHANGE_PRINT'

  // Sub-tabs for Section 1 (Configuration & Students)
  const [configSubTab, setConfigSubTab] = useState('PE_SUBJECTS'); // 'PE_SUBJECTS', 'OE_SUBJECTS', 'STUDENTS'

  // Active Elective Filter for Analytics
  const [analyticsElectiveType, setAnalyticsElectiveType] = useState('PE');

  const [loading, setLoading] = useState(true);

  // Data states
  const [peSubjects, setPeSubjects] = useState([]);
  const [oeSubjects, setOeSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allotments, setAllotments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectModalType, setSubjectModalType] = useState('PE');
  const [editingSubject, setEditingSubject] = useState(null);

  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedAllotmentForOverride, setSelectedAllotmentForOverride] = useState(null);

  // Filters for Allotment table
  const [filters, setFilters] = useState({
    elective_type: 'ALL',
    branch: 'ALL',
    section: 'ALL',
    status: 'ALL',
    search: ''
  });

  // Print state
  const [printConfig, setPrintConfig] = useState({
    reportType: 'PE',
    title: 'Professional Elective (PE) Allotment Sheet',
    subtitle: 'Academic Year 2024–2025'
  });

  // Load all data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [peList, oeList, studentList, logsList] = await Promise.all([
        coordinatorService.getSubjects('PE'),
        coordinatorService.getSubjects('OE'),
        coordinatorService.getStudents(),
        coordinatorService.getAuditLogs()
      ]);

      setPeSubjects(peList);
      setOeSubjects(oeList);
      setStudents(studentList);
      setAuditLogs(logsList);

      const [analyticsData, allotmentList] = await Promise.all([
        coordinatorService.getAnalyticsSummary(analyticsElectiveType),
        coordinatorService.getAllotmentRecords(filters)
      ]);

      setAnalytics(analyticsData);
      setAllotments(allotmentList);
    } catch (err) {
      console.error('Error loading coordinator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [analyticsElectiveType]);

  useEffect(() => {
    async function filterAllotments() {
      const records = await coordinatorService.getAllotmentRecords(filters);
      setAllotments(records);
    }
    filterAllotments();
  }, [filters]);

  // Subject Handlers
  const handleSaveSubject = async (subjectData) => {
    if (editingSubject) {
      await coordinatorService.updateSubject(editingSubject.id, subjectData);
      showToast('Subject updated successfully.');
    } else {
      await coordinatorService.addSubject(subjectData);
      showToast(`New ${subjectData.elective_type} subject added.`);
    }
    loadAllData();
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Are you sure you want to delete this elective subject?')) {
      await coordinatorService.deleteSubject(id);
      showToast('Subject removed.');
      loadAllData();
    }
  };

  // Student Handlers
  const handleSaveStudent = async (studentData) => {
    await coordinatorService.addStudent(studentData);
    showToast(`Student ${studentData.name} enrolled with email ${studentData.email}.`);
    loadAllData();
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to remove this student account?')) {
      await coordinatorService.deleteStudent(id);
      showToast('Student removed.');
      loadAllData();
    }
  };

  // Manual Override Handler
  const handleSaveOverride = async ({ allotmentId, newSubjectId, reason }) => {
    await coordinatorService.manualUpdateAllotment({
      allotmentId,
      newSubjectId,
      reason,
      coordinatorId: currentUser?.id
    });
    showToast('Allotment override recorded with official audit log.');
    loadAllData();
  };

  // Printing Trigger
  const triggerPrint = (type, customTitle, customSubtitle) => {
    setPrintConfig({
      reportType: type,
      title: customTitle,
      subtitle: customSubtitle
    });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const currentSubjectList = configSubTab === 'PE_SUBJECTS' ? peSubjects : oeSubjects;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. PORTAL HEADER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Academic Office • Coordinator Control Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
              Elective System Management & Allotment
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Enroll students by email, configure PE & OE subjects, and monitor real-time automatic FIFO allotments.
            </p>
          </div>

          {/* 3 Major Workflow Tabs */}
          <div className="flex p-1.5 rounded-xl bg-gray-100 border border-gray-200">
            <button
              onClick={() => setActiveTab('ADD_DETAILS')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ADD_DETAILS'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>1. Curriculum & Students</span>
            </button>
            <button
              onClick={() => setActiveTab('ANALYZE')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ANALYZE'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>2. Live Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('CHANGE_PRINT')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'CHANGE_PRINT'
                  ? 'bg-white text-crimson-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>3. Allotments & Printing</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CONFIGURATION & STUDENT REGISTRATION */}
      {/* ========================================================================= */}
      {activeTab === 'ADD_DETAILS' && (
        <div className="space-y-6 no-print">
          
          {/* Sub Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setConfigSubTab('PE_SUBJECTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  configSubTab === 'PE_SUBJECTS' ? 'bg-crimson-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Professional Electives (PE) ({peSubjects.length})</span>
              </button>

              <button
                onClick={() => setConfigSubTab('OE_SUBJECTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  configSubTab === 'OE_SUBJECTS' ? 'bg-crimson-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Open Electives (OE) ({oeSubjects.length})</span>
              </button>

              <button
                onClick={() => setConfigSubTab('STUDENTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  configSubTab === 'STUDENTS' ? 'bg-crimson-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Enrolled Students ({students.length})</span>
              </button>
            </div>

            {configSubTab === 'PE_SUBJECTS' && (
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModalType('PE');
                  setSubjectModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add PE Subject</span>
              </button>
            )}

            {configSubTab === 'OE_SUBJECTS' && (
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModalType('OE');
                  setSubjectModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add OE Subject</span>
              </button>
            )}

            {configSubTab === 'STUDENTS' && (
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enroll New Student</span>
              </button>
            )}
          </div>

          {/* 1.1 ELECTIVE SUBJECTS TABLE (PE / OE) */}
          {(configSubTab === 'PE_SUBJECTS' || configSubTab === 'OE_SUBJECTS') && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">
                    {configSubTab === 'PE_SUBJECTS' ? 'Professional Elective (PE) Offerings' : 'Open Elective (OE) Offerings'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {configSubTab === 'PE_SUBJECTS' 
                      ? 'Department-specific courses with dedicated branch quotas.' 
                      : 'Interdisciplinary courses open across all departments.'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Subject Title</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Semester</th>
                      <th className="px-4 py-3 text-center">Seat Capacity</th>
                      <th className="px-4 py-3 text-center">Vacancies Remaining</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentSubjectList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-crimson-700">{s.subject_code}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{s.subject_name}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{s.branch}</td>
                        <td className="px-4 py-3 text-gray-600">Semester {s.semester}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{s.seats}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            s.available_seats === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.available_seats} of {s.seats} available
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingSubject(s);
                              setSubjectModalType(s.elective_type);
                              setSubjectModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-crimson-700 hover:bg-crimson-50 rounded-lg transition-colors"
                            title="Edit Subject"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(s.id)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentSubjectList.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-400">
                          No {configSubTab === 'PE_SUBJECTS' ? 'Professional' : 'Open'} Elective subjects added yet. Click Add above to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1.2 STUDENTS DIRECTORY */}
          {configSubTab === 'STUDENTS' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">
                    Enrolled Student Accounts
                  </h3>
                  <p className="text-xs text-gray-500">
                    Only students registered below with their college email can sign in to the portal.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">College Email (Login ID)</th>
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Branch & Sec</th>
                      <th className="px-4 py-3">Semester</th>
                      <th className="px-4 py-3 text-center">PE Status</th>
                      <th className="px-4 py-3 text-center">OE Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-crimson-800">{st.email}</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{st.roll_number || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{st.name}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{st.branch} - Sec {st.section || 'A'}</td>
                        <td className="px-4 py-3 text-gray-600">Semester {st.semester}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.hasSubmittedPE ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {st.hasSubmittedPE ? 'Locked' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.hasSubmittedOE ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {st.hasSubmittedOE ? 'Locked' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteStudent(st.id)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-gray-400">
                          No students enrolled yet. Click "Enroll New Student" to add student email IDs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE ANALYTICS (REAL-TIME FIFO SEAT DEMAND) */}
      {/* ========================================================================= */}
      {activeTab === 'ANALYZE' && analytics && (
        <div className="space-y-8 no-print">
          
          {/* Elective Type Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Viewing Analytics For:
              </span>
              <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200">
                <button
                  onClick={() => setAnalyticsElectiveType('PE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    analyticsElectiveType === 'PE'
                      ? 'bg-white text-crimson-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Professional Elective (PE)</span>
                </button>
                <button
                  onClick={() => setAnalyticsElectiveType('OE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    analyticsElectiveType === 'OE'
                      ? 'bg-white text-crimson-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Elective (OE)</span>
                </button>
              </div>
            </div>

            <button
              onClick={loadAllData}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-crimson-700" />
              <span>Live Refresh</span>
            </button>
          </div>

          {/* Overview Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Students</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block font-display">{analytics.totalStudents}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">{analyticsElectiveType} Submitted</span>
              <span className="text-2xl font-black text-crimson-700 mt-1 block font-display">{analytics.submittedStudents}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Seats</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block font-display">{analytics.totalSeats}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Seats Filled</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block font-display">{analytics.filledSeats}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Vacancies</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block font-display">{analytics.availableSeats}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Allotted</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block font-display">{analytics.allottedCount}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Waitlisted</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block font-display">{analytics.waitlistedCount}</span>
            </div>
          </div>

          {/* Recharts Analytics Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Subject Demand vs Capacity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  {analyticsElectiveType === 'PE' ? 'Professional' : 'Open'} Elective Demand vs Seats
                </h3>
                <p className="text-xs text-gray-500">
                  Priority 1 Requests vs Configured Capacity vs Allotted Students
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.subjectWiseStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="seats" name="Seat Capacity" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="priority1" name="Priority 1 Demand" fill="#C8191E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="allotted" name="Allotted Count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Branch Enrollment */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Enrolled Students by Branch
                </h3>
                <p className="text-xs text-gray-500">
                  Distribution of registered student candidate pool
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.branchDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.branchDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Subject-Wise Demand Breakdown Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  {analyticsElectiveType === 'PE' ? 'Professional' : 'Open'} Elective Subject Quota & Demand
                </h3>
                <p className="text-xs text-gray-500">
                  Real-time seat count and FIFO priority choices.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Subject Code & Title</th>
                    <th className="px-4 py-3 text-center">Configured Seats</th>
                    <th className="px-4 py-3 text-center text-amber-700">🥇 Priority 1</th>
                    <th className="px-4 py-3 text-center text-slate-700">🥈 Priority 2</th>
                    <th className="px-4 py-3 text-center text-amber-900">🥉 Priority 3</th>
                    <th className="px-4 py-3 text-center text-emerald-700">Allotted</th>
                    <th className="px-4 py-3 text-center">Vacancies Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.subjectWiseStats.map((subj) => (
                    <tr key={subj.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{subj.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{subj.code} ({subj.branch})</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800">{subj.seats}</td>
                      <td className="px-4 py-3 text-center font-bold text-crimson-700">{subj.priority1}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">{subj.priority2}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">{subj.priority3}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-emerald-600">{subj.allotted}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          subj.remaining === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {subj.remaining} seats left
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analytics.subjectWiseStats.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        No {analyticsElectiveType} subjects configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ALLOTMENTS, OVERRIDES & SEPARATE PRINTING */}
      {/* ========================================================================= */}
      {activeTab === 'CHANGE_PRINT' && (
        <div className="space-y-6 no-print">
          
          {/* Action Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search email, roll no, subject..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-crimson-600"
                />
              </div>

              <select
                value={filters.elective_type}
                onChange={(e) => setFilters({ ...filters, elective_type: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
              >
                <option value="ALL">All Elective Types (PE & OE)</option>
                <option value="PE">Professional Elective (PE)</option>
                <option value="OE">Open Elective (OE)</option>
              </select>

              <select
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ALLOTTED">ALLOTTED</option>
                <option value="WAITLISTED">WAITLISTED</option>
              </select>
            </div>

            {/* Separate PE / OE Print & Export Options */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => coordinatorService.exportAllotmentsCSV(allotments, 'elective_allotments_export.csv')}
                className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => triggerPrint('PE', 'Professional Elective (PE) Allotment Sheet', 'Department Specialty Courses')}
                className="px-3.5 py-2 rounded-xl bg-crimson-50 hover:bg-crimson-100 text-xs font-bold text-crimson-800 flex items-center gap-1 transition-colors border border-crimson-200"
              >
                <Printer className="w-3.5 h-3.5 text-crimson-700" />
                <span>Print PE Sheet</span>
              </button>

              <button
                onClick={() => triggerPrint('OE', 'Open Elective (OE) Allotment Sheet', 'Interdisciplinary Courses')}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 flex items-center gap-1 transition-colors border border-blue-200"
              >
                <Printer className="w-3.5 h-3.5 text-blue-700" />
                <span>Print OE Sheet</span>
              </button>

              <button
                onClick={() => triggerPrint('COMPLETE', 'Consolidated Elective Allotment Master Roster', 'Complete University Record')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white crimson-gradient-btn flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Master Sheet</span>
              </button>
            </div>

          </div>

          {/* Allotment Records Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Official Allotment Master Roster
                </h3>
                <p className="text-xs text-gray-500">
                  Showing {allotments.length} processed student records. Click Modify to adjust allotment.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student Email</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Branch & Sec</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Allotted Subject</th>
                    <th className="px-4 py-3 text-center">Priority</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">FIFO Timestamp</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allotments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.studentEmail}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{item.rollNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.studentName}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{item.branch} - Sec {item.section}</td>
                      <td className="px-4 py-3 font-bold text-crimson-700">{item.elective_type}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {item.subjectCode ? `${item.subjectCode} - ${item.subjectName}` : item.subjectName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.priority_selected ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                            Priority {item.priority_selected}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Manual/None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider ${
                          item.status === 'ALLOTTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedAllotmentForOverride(item);
                            setOverrideModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-crimson-700 bg-crimson-50 hover:bg-crimson-100 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Manually modify allotment"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Modify</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allotments.length === 0 && (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-gray-400">
                        No allotment records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Coordinator Action Audit Trail
                </h3>
                <p className="text-xs text-gray-500">
                  Immutable log of manual allotment overrides and enrollment changes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Student</th>
                    <th className="px-4 py-3">Previous Value</th>
                    <th className="px-4 py-3">New Value</th>
                    <th className="px-4 py-3">Reason / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-crimson-700">{log.studentEmail}</td>
                      <td className="px-4 py-3 text-gray-500">{log.old_value || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{log.new_value || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 italic">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Subject Create/Edit Modal */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        editingSubject={editingSubject}
        defaultType={subjectModalType}
      />

      {/* Enroll Student Modal */}
      <AddStudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        onSave={handleSaveStudent}
      />

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        onSave={handleSaveOverride}
        allotmentRecord={selectedAllotmentForOverride}
        eligibleSubjects={[...peSubjects, ...oeSubjects]}
      />

      {/* PRINT-ONLY COMPONENT */}
      <PrintAllotmentView
        records={allotments.filter(a => printConfig.reportType === 'COMPLETE' || a.elective_type === printConfig.reportType)}
        reportType={printConfig.reportType}
        title={printConfig.title}
        subtitle={printConfig.subtitle}
      />

    </div>
  );
}
