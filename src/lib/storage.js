import {
  INITIAL_PROFILES,
  INITIAL_SUBJECTS,
  INITIAL_PREFERENCES,
  INITIAL_ALLOTMENTS,
  INITIAL_AUDIT_LOGS
} from './mockData';

const KEYS = {
  PROFILES: 'aes_v2_profiles',
  SUBJECTS: 'aes_v2_subjects',
  PREFERENCES: 'aes_v2_preferences',
  ALLOTMENTS: 'aes_v2_allotments',
  AUDIT_LOGS: 'aes_v2_audit_logs',
  CURRENT_USER: 'aes_v2_current_user'
};

function getStored(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const db = {
  // Clear & reset
  resetAll: () => {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(INITIAL_PREFERENCES));
    localStorage.setItem(KEYS.ALLOTMENTS, JSON.stringify(INITIAL_ALLOTMENTS));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  },

  // Profiles
  getProfiles: () => getStored(KEYS.PROFILES, INITIAL_PROFILES),
  getProfileById: (id) => db.getProfiles().find(p => p.id === id),
  getProfileByEmail: (email) => db.getProfiles().find(p => p.email?.toLowerCase().trim() === email?.toLowerCase().trim()),
  addProfile: (profile) => {
    const profiles = db.getProfiles();
    const cleanEmail = profile.email?.toLowerCase().trim();
    if (profiles.some(p => p.email?.toLowerCase().trim() === cleanEmail)) {
      throw new Error(`A student with email "${profile.email}" is already registered.`);
    }
    const newProfile = {
      id: profile.id || `s-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      password_changed: true, // Password change is not mandatory
      ...profile,
      email: cleanEmail
    };
    profiles.push(newProfile);
    setStored(KEYS.PROFILES, profiles);
    return newProfile;
  },
  deleteProfile: (id) => {
    const profiles = db.getProfiles().filter(p => p.id !== id);
    setStored(KEYS.PROFILES, profiles);
    return true;
  },
  updateProfile: (id, updates) => {
    const profiles = db.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
      setStored(KEYS.PROFILES, profiles);
      return profiles[index];
    }
    return null;
  },

  // Subjects (PE and OE managed separately)
  getSubjects: (electiveType) => {
    const subjects = getStored(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    if (electiveType) {
      return subjects.filter(s => s.elective_type === electiveType);
    }
    return subjects;
  },
  getSubjectById: (id) => db.getSubjects().find(s => s.id === id),
  addSubject: (subject) => {
    const subjects = db.getSubjects();
    const seatsCount = Number(subject.seats);
    const newSubject = {
      id: `subj-${Date.now()}`,
      seats: seatsCount,
      available_seats: seatsCount,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...subject
    };
    subjects.push(newSubject);
    setStored(KEYS.SUBJECTS, subjects);
    return newSubject;
  },
  updateSubject: (id, updates) => {
    const subjects = db.getSubjects();
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      const current = subjects[index];
      const newSeats = updates.seats !== undefined ? Number(updates.seats) : current.seats;
      const diff = newSeats - current.seats;
      const updatedAvailable = updates.available_seats !== undefined 
        ? Number(updates.available_seats) 
        : Math.max(0, current.available_seats + diff);

      subjects[index] = { 
        ...current, 
        ...updates, 
        seats: newSeats,
        available_seats: updatedAvailable,
        updated_at: new Date().toISOString() 
      };
      setStored(KEYS.SUBJECTS, subjects);
      return subjects[index];
    }
    return null;
  },
  deleteSubject: (id) => {
    const subjects = db.getSubjects().filter(s => s.id !== id);
    setStored(KEYS.SUBJECTS, subjects);
    return true;
  },

  // Preferences & Instant FIFO Allotment
  getPreferences: () => getStored(KEYS.PREFERENCES, INITIAL_PREFERENCES),
  getStudentPreferences: (studentId, electiveType) => {
    return db.getPreferences()
      .filter(p => p.student_id === studentId && (!electiveType || p.elective_type === electiveType))
      .sort((a, b) => a.priority - b.priority);
  },

  // Atomic Instant FIFO Submission & Allocation
  submitAndAllot: (studentId, electiveType, subjectPriorities) => {
    // Check if already locked
    const existingAllotment = db.getAllotmentForStudent(studentId, electiveType);
    if (existingAllotment) {
      throw new Error(`Your ${electiveType} choices are already submitted and locked.`);
    }

    const student = db.getProfileById(studentId);
    if (!student) throw new Error('Student record not found.');

    const timestamp = new Date().toISOString();
    const preferences = db.getPreferences().filter(p => !(p.student_id === studentId && p.elective_type === electiveType));
    
    // Save preferences
    const newPrefs = subjectPriorities.map((item, idx) => ({
      id: `pref-${studentId}-${idx}-${Date.now()}`,
      student_id: studentId,
      elective_type: electiveType,
      subject_id: item.subject_id,
      priority: item.priority || (idx + 1),
      submitted_at: timestamp,
      created_at: timestamp
    }));
    setStored(KEYS.PREFERENCES, [...preferences, ...newPrefs]);

    // Perform Instant FIFO Allotment
    let allottedSubject = null;
    let allottedPriority = null;
    let status = 'WAITLISTED';

    const subjects = db.getSubjects();

    for (const item of newPrefs) {
      const targetSubj = subjects.find(s => s.id === item.subject_id);
      if (targetSubj && targetSubj.available_seats > 0) {
        // Seat available! Decrement and assign immediately
        targetSubj.available_seats = Math.max(0, targetSubj.available_seats - 1);
        db.updateSubject(targetSubj.id, { available_seats: targetSubj.available_seats });

        allottedSubject = targetSubj;
        allottedPriority = item.priority;
        status = 'ALLOTTED';
        break;
      }
    }

    const allotments = db.getAllotments().filter(a => !(a.student_id === studentId && a.elective_type === electiveType));
    const newAllotment = {
      id: `allot-${studentId}-${electiveType}-${Date.now()}`,
      student_id: studentId,
      roll_number: student.roll_number || 'N/A',
      student_email: student.email,
      elective_type: electiveType,
      subject_id: allottedSubject ? allottedSubject.id : null,
      priority_selected: allottedPriority,
      status,
      submitted_at: timestamp,
      allotted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp
    };

    allotments.push(newAllotment);
    setStored(KEYS.ALLOTMENTS, allotments);

    return {
      allotment: newAllotment,
      subject: allottedSubject
    };
  },

  // Allotments
  getAllotments: () => getStored(KEYS.ALLOTMENTS, INITIAL_ALLOTMENTS),
  getAllotmentForStudent: (studentId, electiveType) => {
    const allotments = db.getAllotments();
    return allotments.find(a => a.student_id === studentId && (!electiveType || a.elective_type === electiveType));
  },
  setAllotments: (list) => setStored(KEYS.ALLOTMENTS, list),
  updateAllotment: (id, updates) => {
    const allotments = db.getAllotments();
    const index = allotments.findIndex(a => a.id === id);
    if (index !== -1) {
      allotments[index] = { ...allotments[index], ...updates, updated_at: new Date().toISOString() };
      setStored(KEYS.ALLOTMENTS, allotments);
      return allotments[index];
    }
    return null;
  },

  // Audit Logs
  getAuditLogs: () => getStored(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  addAuditLog: ({ coordinatorId, studentId, action, oldValue, newValue, reason }) => {
    const logs = db.getAuditLogs();
    const newLog = {
      id: `audit-${Date.now()}`,
      coordinator_id: coordinatorId,
      student_id: studentId || null,
      action,
      old_value: oldValue || null,
      new_value: newValue || null,
      reason: reason || 'Manual modification',
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    setStored(KEYS.AUDIT_LOGS, logs);
    return newLog;
  },

  // Session
  getCurrentUser: () => {
    try {
      const u = localStorage.getItem(KEYS.CURRENT_USER);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }
};
