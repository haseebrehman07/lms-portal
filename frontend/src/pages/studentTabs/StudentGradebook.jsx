import { useState, useEffect } from 'react';
// import api from '../../api/axiosConfig'; 

const StudentGradebook = () => {
  const [selectedSession, setSelectedSession] = useState('2025–26');
  const [gradeData, setGradeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Available sessions for the dropdown
  const sessions = ['2025–26', '2024–25', '2023–24'];

  // Simulated database structure grouped by session
  const mockDatabase = {
    '2025–26': [
      { id: 1, subject: 'Software Engineering', assessment: 'Midterm Exam', obtained: 42, total: 50, grade: 'A' },
      { id: 2, subject: 'Database Systems', assessment: 'Final Project', obtained: 88, total: 100, grade: 'A' },
      { id: 3, subject: 'Software Quality Engineering', assessment: 'Quiz 1', obtained: 7, total: 10, grade: 'C' },
      { id: 4, subject: 'Operating Systems', assessment: 'Assignment 2', obtained: 12, total: 20, grade: 'D' },
    ],
    '2024–25': [
      { id: 5, subject: 'Data Structures', assessment: 'Final Exam', obtained: 78, total: 100, grade: 'B' },
      { id: 6, subject: 'Object Oriented Programming', assessment: 'Midterm Exam', obtained: 35, total: 50, grade: 'C' },
    ],
    '2023–24': [] // Triggers the empty state
  };

  useEffect(() => {
    setLoading(true);
    // Simulating the network request latency
    setTimeout(() => {
      setGradeData(mockDatabase[selectedSession] || []);
      setLoading(false);
    }, 300);
  }, [selectedSession]);

  const handleSessionChange = (e) => {
    setSelectedSession(e.target.value);
  };

  // Helper function to color-code the grade badges
  const getGradeColor = (grade) => {
    switch (grade.toUpperCase()) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gradebook</h1>
        
        <div className="flex items-center gap-2">
          <label htmlFor="session-select" className="text-sm font-medium text-gray-600">
            Session:
          </label>
          <select
            id="session-select"
            value={selectedSession}
            onChange={handleSessionChange}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm transition-colors"
          >
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {loading ? (
          // Loading State
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : gradeData.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              {/* Note: Swapped the icon to an academic cap/clipboard style for grades */}
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No grades posted</h3>
            <p className="mt-1 text-sm text-gray-500">
              No grade data available for the {selectedSession} session.
            </p>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Assessment/Exam</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Marks Obtained</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Total Marks</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gradeData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {record.assessment}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-900">
                      {record.obtained}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {record.total}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getGradeColor(record.grade)}`}>
                        {record.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGradebook;