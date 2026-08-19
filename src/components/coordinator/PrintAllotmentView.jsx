import React from 'react';

export default function PrintAllotmentView({ 
  records = [], 
  reportType = 'PE', // 'PE', 'OE', 'COMPLETE'
  title = 'Professional Elective (PE) Allotment Sheet',
  subtitle = 'Academic Year 2024–2025'
}) {
  return (
    <div className="hidden print-only p-8 bg-white text-black font-sans print-container">
      {/* College Official Letterhead */}
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-xl">
            🎓
          </div>
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-wide">
              COLLEGE OF ENGINEERING & TECHNOLOGY (AUTONOMOUS)
            </h1>
            <p className="text-xs uppercase font-semibold text-gray-700">
              Office of the Academic Coordinator & Dean of Academics
            </p>
          </div>
        </div>
        <div className="mt-3 py-1.5 bg-gray-100 border-y border-black">
          <h2 className="text-base font-extrabold uppercase tracking-wider">{title}</h2>
          <p className="text-xs text-gray-600 font-medium">{subtitle} • Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center text-xs font-semibold mb-4 px-2">
        <div>Total Students Listed: <strong>{records.length}</strong></div>
        <div>Allotment Algorithm: <strong>Strict FIFO Timestamp Allocation</strong></div>
      </div>

      {/* Main Table */}
      <table className="w-full text-xs text-left border-collapse border border-black">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-2 text-center w-10">S.No</th>
            <th className="border border-black px-2 py-2">Student Email</th>
            <th className="border border-black px-2 py-2">Roll Number</th>
            <th className="border border-black px-2 py-2">Student Name</th>
            <th className="border border-black px-2 py-2 text-center">Branch</th>
            <th className="border border-black px-2 py-2 text-center">Sec</th>
            <th className="border border-black px-2 py-2 text-center">Type</th>
            <th className="border border-black px-2 py-2">Allotted Subject</th>
            <th className="border border-black px-2 py-2 text-center">Priority</th>
            <th className="border border-black px-2 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-gray-50">
              <td className="border border-black px-2 py-1.5 text-center font-mono">{idx + 1}</td>
              <td className="border border-black px-2 py-1.5 font-medium">{row.studentEmail}</td>
              <td className="border border-black px-2 py-1.5 font-mono font-bold">{row.rollNumber}</td>
              <td className="border border-black px-2 py-1.5 font-semibold">{row.studentName}</td>
              <td className="border border-black px-2 py-1.5 text-center">{row.branch}</td>
              <td className="border border-black px-2 py-1.5 text-center">{row.section}</td>
              <td className="border border-black px-2 py-1.5 text-center font-bold">{row.elective_type}</td>
              <td className="border border-black px-2 py-1.5 font-bold">
                {row.subjectCode ? `${row.subjectCode} - ${row.subjectName}` : row.subjectName}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">
                {row.priority_selected ? `P-${row.priority_selected}` : '—'}
              </td>
              <td className="border border-black px-2 py-1.5 text-center font-bold">
                {row.status}
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan="10" className="border border-black py-8 text-center text-gray-500 italic">
                No allotment records found for this category.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="mt-16 pt-8 flex justify-between items-end text-xs text-black">
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1"></div>
          <span className="font-semibold">Prepared By</span>
        </div>
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1"></div>
          <span className="font-semibold">Academic Coordinator</span>
        </div>
        <div className="text-center">
          <div className="w-36 border-b border-black mb-1"></div>
          <span className="font-semibold">Dean of Academics</span>
        </div>
      </div>
    </div>
  );
}
