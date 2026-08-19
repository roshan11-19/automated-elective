import { db } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const coordinatorService = {
  // --------------------------------------------------------------------------
  // 1. ELECTIVE SUBJECTS (SEPARATE PE & OE RETRIEVAL)
  // --------------------------------------------------------------------------

  getSubjects: async (electiveType) => {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('subjects').select('*').order('created_at', { ascending: false });
        if (electiveType) {
          query = query.eq('elective_type', electiveType);
        }
        const { data, error } = await query;
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase getSubjects note:', e);
      }
    }
    return db.getSubjects(electiveType);
  },

  addSubject: async (subjectData) => {
    const localResult = db.addSubject(subjectData);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('subjects').insert([{
          ...subjectData,
          available_seats: Number(subjectData.seats)
        }]);
      } catch (e) {
        console.warn('Supabase addSubject note:', e);
      }
    }
    return localResult;
  },

  updateSubject: async (id, subjectData) => {
    const localResult = db.updateSubject(id, subjectData);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('subjects').update(subjectData).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateSubject note:', e);
      }
    }
    return localResult;
  },

  deleteSubject: async (id) => {
    const localResult = db.deleteSubject(id);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('subjects').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteSubject note:', e);
      }
    }
    return localResult;
  },

  // --------------------------------------------------------------------------
  // 2. STUDENT PROFILES MANAGEMENT (COORDINATOR ENROLLS STUDENTS)
  // --------------------------------------------------------------------------

  getStudents: async () => {
    let profiles = db.getProfiles().filter(p => p.role === 'student');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student');
        if (data && !error) {
          profiles = data;
        }
      } catch (e) {
        console.warn('Supabase getStudents note:', e);
      }
    }

    const preferences = db.getPreferences();
    const allotments = db.getAllotments();
    const subjects = db.getSubjects();

    return profiles.map(student => {
      const studentPrefs = preferences.filter(p => p.student_id === student.id);
      const studentAllotmentPE = allotments.find(a => a.student_id === student.id && a.elective_type === 'PE');
      const studentAllotmentOE = allotments.find(a => a.student_id === student.id && a.elective_type === 'OE');

      return {
        ...student,
        hasSubmittedPE: studentPrefs.some(p => p.elective_type === 'PE') || Boolean(studentAllotmentPE),
        hasSubmittedOE: studentPrefs.some(p => p.elective_type === 'OE') || Boolean(studentAllotmentOE),
        allotmentPE: studentAllotmentPE ? {
          ...studentAllotmentPE,
          subject: subjects.find(s => s.id === studentAllotmentPE.subject_id)
        } : null,
        allotmentOE: studentAllotmentOE ? {
          ...studentAllotmentOE,
          subject: subjects.find(s => s.id === studentAllotmentOE.subject_id)
        } : null
      };
    });
  },

  addStudent: async (studentData) => {
    const cleanEmail = studentData.email.trim().toLowerCase();
    
    // 1. Local add
    const localResult = db.addProfile({
      ...studentData,
      email: cleanEmail,
      role: 'student',
      password_changed: true
    });

    // 2. Supabase add if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').insert([{
          ...studentData,
          email: cleanEmail,
          role: 'student',
          password_changed: true
        }]);
      } catch (e) {
        console.warn('Supabase addStudent note:', e);
      }
    }

    return localResult;
  },

  deleteStudent: async (id) => {
    const localResult = db.deleteProfile(id);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteStudent note:', e);
      }
    }
    return localResult;
  },

  // --------------------------------------------------------------------------
  // 3. ANALYTICS & LIVE SEAT DEMAND
  // --------------------------------------------------------------------------

  getAnalyticsSummary: async (electiveType = 'PE') => {
    const allStudents = await coordinatorService.getStudents();
    const allSubjects = await coordinatorService.getSubjects(electiveType);
    const allPreferences = db.getPreferences().filter(p => p.elective_type === electiveType);
    const allAllotments = db.getAllotments().filter(a => a.elective_type === electiveType);

    const totalSeats = allSubjects.reduce((acc, s) => acc + Number(s.seats || 0), 0);
    const availableSeats = allSubjects.reduce((acc, s) => acc + Number(s.available_seats || 0), 0);
    const filledSeats = totalSeats - availableSeats;

    const submittedStudents = new Set(allPreferences.map(p => p.student_id)).size;
    const allottedCount = allAllotments.filter(a => a.status === 'ALLOTTED').length;
    const waitlistedCount = allAllotments.filter(a => a.status === 'WAITLISTED').length;
    const pendingCount = Math.max(0, allStudents.length - (allottedCount + waitlistedCount));

    // Subject-wise demand
    const subjectWiseStats = allSubjects.map(subj => {
      const p1Count = allPreferences.filter(p => p.subject_id === subj.id && p.priority === 1).length;
      const p2Count = allPreferences.filter(p => p.subject_id === subj.id && p.priority === 2).length;
      const p3Count = allPreferences.filter(p => p.subject_id === subj.id && p.priority === 3).length;
      const totalDemand = allPreferences.filter(p => p.subject_id === subj.id).length;
      const allottedToSubject = allAllotments.filter(a => a.subject_id === subj.id && a.status === 'ALLOTTED').length;

      return {
        id: subj.id,
        code: subj.subject_code,
        name: subj.subject_name,
        branch: subj.branch,
        seats: Number(subj.seats),
        available_seats: Number(subj.available_seats),
        priority1: p1Count,
        priority2: p2Count,
        priority3: p3Count,
        totalDemand,
        allotted: allottedToSubject,
        remaining: Math.max(0, Number(subj.available_seats))
      };
    });

    // Branch-wise distribution
    const branchMap = {};
    allStudents.forEach(st => {
      const b = st.branch || 'Other';
      branchMap[b] = (branchMap[b] || 0) + 1;
    });
    const branchDistribution = Object.entries(branchMap).map(([name, value]) => ({ name, value }));

    return {
      totalStudents: allStudents.length,
      submittedStudents,
      totalSeats,
      filledSeats,
      availableSeats,
      allottedCount,
      waitlistedCount,
      pendingCount,
      subjectWiseStats,
      branchDistribution
    };
  },

  // --------------------------------------------------------------------------
  // 4. ALLOTMENT MANAGEMENT, MANUAL OVERRIDES & REPORTS
  // --------------------------------------------------------------------------

  getAllotmentRecords: async (filters = {}) => {
    const allotments = db.getAllotments();
    const students = db.getProfiles();
    const subjects = db.getSubjects();

    let list = allotments.map(a => {
      const student = students.find(s => s.id === a.student_id) || {};
      const subject = subjects.find(s => s.id === a.subject_id) || null;

      return {
        ...a,
        studentName: student.name || 'Unknown',
        studentEmail: a.student_email || student.email || 'N/A',
        rollNumber: a.roll_number || student.roll_number || 'N/A',
        branch: student.branch || 'N/A',
        section: student.section || 'N/A',
        semester: student.semester || 5,
        subjectName: subject ? subject.subject_name : (a.status === 'WAITLISTED' ? 'WAITLISTED (No Vacancy)' : 'Not Allotted'),
        subjectCode: subject ? subject.subject_code : 'N/A'
      };
    });

    if (filters.elective_type && filters.elective_type !== 'ALL') {
      list = list.filter(item => item.elective_type === filters.elective_type);
    }
    if (filters.branch && filters.branch !== 'ALL') {
      list = list.filter(item => item.branch === filters.branch);
    }
    if (filters.section && filters.section !== 'ALL') {
      list = list.filter(item => item.section === filters.section);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(item => item.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(item =>
        item.studentEmail?.toLowerCase().includes(q) ||
        item.rollNumber?.toLowerCase().includes(q) ||
        item.studentName?.toLowerCase().includes(q) ||
        item.subjectName?.toLowerCase().includes(q) ||
        item.subjectCode?.toLowerCase().includes(q)
      );
    }

    return list;
  },

  // Manual Allotment Override with Audit Log
  manualUpdateAllotment: async ({ allotmentId, newSubjectId, reason, coordinatorId }) => {
    const allotments = db.getAllotments();
    const targetAllotment = allotments.find(a => a.id === allotmentId);
    if (!targetAllotment) throw new Error('Allotment record not found.');

    const subjects = db.getSubjects();
    const oldSubject = subjects.find(s => s.id === targetAllotment.subject_id);
    const newSubject = subjects.find(s => s.id === newSubjectId);

    // Free seat from old subject
    if (oldSubject) {
      db.updateSubject(oldSubject.id, {
        available_seats: Math.min(oldSubject.seats, oldSubject.available_seats + 1)
      });
    }

    // Occupy seat in new subject
    if (newSubject) {
      db.updateSubject(newSubject.id, {
        available_seats: Math.max(0, newSubject.available_seats - 1)
      });
    }

    // Update allotment
    const updatedAllotment = db.updateAllotment(allotmentId, {
      subject_id: newSubjectId || null,
      status: newSubjectId ? 'ALLOTTED' : 'WAITLISTED',
      priority_selected: null
    });

    db.addAuditLog({
      coordinatorId,
      studentId: targetAllotment.student_id,
      action: 'MANUAL_ALLOTMENT_MODIFICATION',
      oldValue: oldSubject ? `${oldSubject.subject_code} - ${oldSubject.subject_name}` : 'WAITLISTED',
      newValue: newSubject ? `${newSubject.subject_code} - ${newSubject.subject_name}` : 'WAITLISTED',
      reason: reason || 'Manual adjustment by coordinator'
    });

    return updatedAllotment;
  },

  getAuditLogs: async () => {
    const logs = db.getAuditLogs();
    const coordinators = db.getProfiles();
    const students = db.getProfiles();

    return logs.map(log => {
      const coord = coordinators.find(p => p.id === log.coordinator_id);
      const student = students.find(p => p.id === log.student_id);
      return {
        ...log,
        coordinatorName: coord?.name || 'Coordinator',
        studentEmail: student?.email || 'General'
      };
    });
  },

  exportAllotmentsCSV: (allotmentsList, filename = 'elective_allotments.csv') => {
    const headers = ['Student Email', 'Roll Number', 'Student Name', 'Branch', 'Section', 'Elective Type', 'Subject Code', 'Allotted Subject', 'Priority', 'Status', 'Submitted At', 'Allotted At'];
    const rows = allotmentsList.map(a => [
      `"${a.studentEmail || ''}"`,
      `"${a.rollNumber || ''}"`,
      `"${a.studentName || ''}"`,
      `"${a.branch || ''}"`,
      `"${a.section || ''}"`,
      `"${a.elective_type || ''}"`,
      `"${a.subjectCode || ''}"`,
      `"${a.subjectName || ''}"`,
      `"${a.priority_selected || 'Manual'}"`,
      `"${a.status || ''}"`,
      `"${a.submitted_at ? new Date(a.submitted_at).toLocaleString() : ''}"`,
      `"${a.allotted_at ? new Date(a.allotted_at).toLocaleString() : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
