import { db } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const studentService = {
  // Get eligible subjects based on student's branch, semester, and elective type
  getEligibleSubjects: async (profile, electiveType) => {
    if (!profile) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('subjects')
          .select('*')
          .eq('semester', profile.semester)
          .eq('elective_type', electiveType)
          .eq('active', true);

        if (electiveType === 'PE') {
          query = query.eq('branch', profile.branch);
        }

        const { data, error } = await query;
        if (data && data.length > 0 && !error) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase eligible subjects query note:', e);
      }
    }

    const allSubjects = db.getSubjects(electiveType);
    return allSubjects.filter(s => {
      if (!s.active) return false;
      if (Number(s.semester) !== Number(profile.semester)) return false;

      if (electiveType === 'PE') {
        return s.branch === profile.branch;
      } else {
        return s.branch === 'ALL' || !s.branch || s.branch === profile.branch;
      }
    });
  },

  // Get existing preferences submitted by student
  getSubmittedPreferences: async (studentId, electiveType) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('elective_preferences')
          .select('*, subjects(*)')
          .eq('student_id', studentId)
          .eq('elective_type', electiveType)
          .order('priority', { ascending: true });
        if (data && data.length > 0 && !error) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase preferences query note:', e);
      }
    }

    const prefs = db.getStudentPreferences(studentId, electiveType);
    const subjects = db.getSubjects();
    return prefs.map(p => ({
      ...p,
      subject: subjects.find(s => s.id === p.subject_id)
    }));
  },

  // Submit preferences with instant real-time FIFO seat allocation and locking
  submitPreferences: async (studentId, electiveType, subjectPriorities) => {
    // 1. Validate no duplicate subject IDs
    const subjectIds = subjectPriorities.map(p => p.subject_id);
    const uniqueIds = new Set(subjectIds);
    if (uniqueIds.size !== subjectIds.length) {
      throw new Error('Duplicate subjects detected in your preferences. Each priority choice must be unique.');
    }

    if (subjectPriorities.length === 0) {
      throw new Error('Please select at least one subject preference.');
    }

    // Check if already locked
    const existing = await studentService.getAllotment(studentId, electiveType);
    if (existing) {
      throw new Error(`Your ${electiveType === 'PE' ? 'Professional' : 'Open'} Elective choices are already submitted and locked.`);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('submit_and_allot_preferences', {
          p_student_id: studentId,
          p_elective_type: electiveType,
          p_subject_priorities: subjectPriorities
        });

        if (data && !error) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase RPC submit_and_allot_preferences note, executing engine fallback:', e);
      }
    }

    // Execute local instant FIFO allotment
    return db.submitAndAllot(studentId, electiveType, subjectPriorities);
  },

  // Get student allotment status
  getAllotment: async (studentId, electiveType) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('allotments')
          .select('*, subjects(*)')
          .eq('student_id', studentId)
          .eq('elective_type', electiveType)
          .maybeSingle();
        if (data && !error) return data;
      } catch (e) {
        console.warn('Supabase allotment query note:', e);
      }
    }

    const allotment = db.getAllotmentForStudent(studentId, electiveType);
    if (!allotment) return null;

    const subjects = db.getSubjects();
    return {
      ...allotment,
      subject: allotment.subject_id ? subjects.find(s => s.id === allotment.subject_id) : null
    };
  }
};
