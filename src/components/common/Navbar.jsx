import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  ChevronDown,
  Sparkles,
  BookOpen,
  Globe,
  User,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/storage';

export default function Navbar() {
  const { currentUser, logout, switchDemoUser, isCoordinator, isStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const allProfiles = db.getProfiles();

  const navLinks = [
    { name: 'Home', path: '/' },
    ...(isStudent ? [
      { name: 'Elective Selection', path: '/student/select' },
      { name: 'My Allotment', path: '/student/allotment' },
    ] : []),
    ...(isCoordinator ? [
      { name: 'Coordinator Portal', path: '/coordinator' },
    ] : []),
    { name: 'Help & FAQ', path: '/help' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Custom Modern Elective Portal Emblem Logo */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-crimson-800 via-crimson-600 to-coral flex items-center justify-center shadow-md shadow-crimson-700/25 group-hover:scale-105 transition-all p-2.5">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="#F8B1B3" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-display flex items-center gap-1.5">
                Automation for <span className="text-crimson-700">Elective System</span>
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Autonomous College Elective Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-crimson-700 bg-crimson-50 font-semibold'
                      : 'text-gray-600 hover:text-crimson-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Area: User / Quick Demo Switcher / Login */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                
                {/* Account Switcher Pill */}
                <div className="relative">
                  <button
                    onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-200 transition-colors"
                    title="Switch profile"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-crimson-600" />
                    <span>Switch Profile</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {demoMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Available Enrolled Accounts
                      </div>
                      {allProfiles.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchDemoUser(p.id);
                            setDemoMenuOpen(false);
                            if (p.role === 'coordinator') navigate('/coordinator');
                            else navigate('/student');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-crimson-50 transition-colors ${
                            currentUser.id === p.id ? 'bg-crimson-50/70 font-semibold text-crimson-800' : 'text-gray-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-[11px] text-gray-500">
                              {p.email}
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            p.role === 'coordinator' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {p.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Info Card */}
                <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-crimson-700 font-semibold flex items-center justify-end gap-1">
                      {currentUser.role === 'coordinator' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Academic Coordinator</span>
                        </>
                      ) : (
                        <>
                          <span>{currentUser.email}</span>
                          <span className="text-gray-400">•</span>
                          <span>{currentUser.branch}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-crimson-700 hover:bg-crimson-50 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login?role=student"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-crimson-700 hover:bg-gray-100 transition-all"
                >
                  Student Login
                </Link>
                <Link
                  to="/login?role=coordinator"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white crimson-gradient-btn shadow-sm"
                >
                  Coordinator Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          {currentUser && (
            <div className="p-3 bg-gray-50 rounded-xl mb-2 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm">{currentUser.name}</div>
                <div className="text-xs text-crimson-700 font-semibold">
                  {currentUser.role === 'coordinator' ? 'Academic Coordinator' : currentUser.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-crimson-700 px-2 py-1 rounded bg-crimson-100"
              >
                Logout
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-crimson-50 hover:text-crimson-700"
            >
              {link.name}
            </Link>
          ))}

          {!currentUser && (
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <Link
                to="/login?role=student"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800"
              >
                Student Login
              </Link>
              <Link
                to="/login?role=coordinator"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-crimson-700"
              >
                Coordinator Login
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
