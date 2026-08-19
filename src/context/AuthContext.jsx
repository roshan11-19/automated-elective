import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const clearToast = () => setToast(null);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', session.user.email)
                .maybeSingle();
              if (profile) {
                setCurrentUser(profile);
                db.setCurrentUser(profile);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Supabase session note:', e);
          }
        }

        const saved = db.getCurrentUser();
        if (saved) {
          const fresh = db.getProfileById(saved.id) || db.getProfileByEmail(saved.email) || saved;
          setCurrentUser(fresh);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // Helper to query profiles
  const resolveProfileByEmail = async (emailInput) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        if (data && !error) return data;
      } catch (err) {
        console.warn('Supabase profile query note:', err);
      }
    }

    return db.getProfileByEmail(cleanEmail);
  };

  // Student login via College Email
  const loginStudent = async (emailInput, password) => {
    setLoading(true);
    try {
      const cleanEmail = emailInput.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error('Please enter your college email address.');
      }

      // Check if student email has been registered by coordinator
      const profile = await resolveProfileByEmail(cleanEmail);
      if (!profile) {
        throw new Error('Your email is not registered in the system. Please contact the Academic Coordinator to add your student profile.');
      }

      if (profile.role !== 'student') {
        throw new Error('This email belongs to a Coordinator account. Please switch to Coordinator Login.');
      }

      // Attempt Supabase Auth if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (authError && (authError.message?.toLowerCase().includes('invalid login credentials') || authError.status === 400)) {
            // Auto sign-up if first time on Supabase Auth
            await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  name: profile.name,
                  role: 'student',
                  roll_number: profile.roll_number
                }
              }
            });
          }
        } catch (e) {
          console.warn('Supabase Auth attempt note:', e);
        }
      }

      if (!password || password.length < 3) {
        throw new Error('Please enter a valid password.');
      }

      setCurrentUser(profile);
      db.setCurrentUser(profile);
      showToast(`Welcome, ${profile.name}!`);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // Coordinator login via official Email
  const loginCoordinator = async (emailInput, password) => {
    setLoading(true);
    try {
      const cleanEmail = emailInput.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error('Please enter your official coordinator email address.');
      }

      let profile = await resolveProfileByEmail(cleanEmail);
      
      // If coordinator@college.edu, ensure profile exists
      if (!profile && cleanEmail === 'coordinator@college.edu') {
        profile = db.getProfileByEmail('coordinator@college.edu');
      }

      if (!profile) {
        throw new Error('No coordinator account found with this email. (Default: coordinator@college.edu)');
      }

      if (profile.role !== 'coordinator') {
        throw new Error('Unauthorized: This account does not possess coordinator privileges.');
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (authError) {
            await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  name: profile.name,
                  role: 'coordinator'
                }
              }
            });
          }
        } catch (e) {
          console.warn('Supabase Auth note:', e);
        }
      }

      if (!password || password.length < 3) {
        throw new Error('Please enter a valid password.');
      }

      setCurrentUser(profile);
      db.setCurrentUser(profile);
      showToast(`Logged in as Academic Coordinator: ${profile.name}`);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async (role = 'student') => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase Google OAuth fallback:', err);
      }
    }

    const profiles = db.getProfiles();
    const targetUser = role === 'coordinator' 
      ? profiles.find(p => p.role === 'coordinator')
      : profiles.find(p => p.role === 'student');
    
    if (!targetUser) {
      throw new Error(`No registered ${role} found. Coordinator must add students first.`);
    }

    setCurrentUser(targetUser);
    db.setCurrentUser(targetUser);
    showToast(`Logged in via Google as ${targetUser.name}`);
    return targetUser;
  };

  // Switch demo user helper
  const switchDemoUser = (userIdOrEmail) => {
    let profile = db.getProfileById(userIdOrEmail) || db.getProfileByEmail(userIdOrEmail);
    if (profile) {
      setCurrentUser(profile);
      db.setCurrentUser(profile);
      showToast(`Switched active user to: ${profile.name} (${profile.role.toUpperCase()})`, 'info');
      return profile;
    }
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout note:', e);
      }
    }
    setCurrentUser(null);
    db.setCurrentUser(null);
    showToast('Logged out successfully.', 'info');
  };

  const value = {
    currentUser,
    loading,
    toast,
    showToast,
    clearToast,
    loginStudent,
    loginCoordinator,
    loginWithGoogle,
    switchDemoUser,
    logout,
    isCoordinator: currentUser?.role === 'coordinator',
    isStudent: currentUser?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
