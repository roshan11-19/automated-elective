// Clean initial coordinator profile (Students will be added by Coordinator)
export const INITIAL_PROFILES = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    email: 'coordinator@college.edu',
    roll_number: 'COORD-01',
    name: 'Academic Coordinator',
    role: 'coordinator',
    branch: 'CSE',
    section: 'Admin',
    regulation: 'Autonomous',
    admitted_batch: '2024-2025',
    semester: 5,
    password_changed: true,
    created_at: new Date().toISOString()
  }
];

export const INITIAL_SUBJECTS = [];

export const INITIAL_PREFERENCES = [];

export const INITIAL_ALLOTMENTS = [];

export const INITIAL_AUDIT_LOGS = [];
