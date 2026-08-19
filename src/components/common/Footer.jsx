import React from 'react';
import { GraduationCap, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Desc */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crimson-700 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold font-display text-gray-900">
                Automation for <span className="text-crimson-700">Elective System</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-md leading-relaxed">
              A high-precision, transparent portal for automated Professional Elective (PE) and Open Elective (OE) subject selection and First-In, First-Out (FIFO) seat allotment.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Supabase Authenticated & Atomic FIFO Engine</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Portals & Services
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/student" className="hover:text-crimson-700 transition-colors">Student Dashboard</Link></li>
              <li><Link to="/student/select" className="hover:text-crimson-700 transition-colors">PE / OE Subject Selection</Link></li>
              <li><Link to="/student/allotment" className="hover:text-crimson-700 transition-colors">Allotment Results & Slip</Link></li>
              <li><Link to="/coordinator" className="hover:text-crimson-700 transition-colors">Academic Coordinator Portal</Link></li>
              <li><Link to="/help" className="hover:text-crimson-700 transition-colors">Helpdesk & Rules</Link></li>
            </ul>
          </div>

          {/* Col 3: Academic Office Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
              Academic Office
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-crimson-600 flex-shrink-0" />
                <span>electives@college.edu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-crimson-600 flex-shrink-0" />
                <span>+91 866-2468000 / Ext 402</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-crimson-600 flex-shrink-0 mt-0.5" />
                <span>Office of Dean Academics, Block-A</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} College Autonomous Elective Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with precision for transparent student allotments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
