import { useState, useEffect } from 'react';
// import api from '../../api/axiosConfig'; 

const StudentAttendance = () => {
  const [selectedSession, setSelectedSession] = useState('2025–26');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const sessions = ['2025–26', '2024–25', '2023–24'];

  const mockDatabase = {
    '2025–26': [
      { id: 1, subject: 'Software Engineering', totalClasses: 40, present: 36, absent: 4 },
      { id: 2, subject: 'Database Systems', totalClasses: 38, present: 38, absent: 0 },
      { id: 3, subject: 'Software Quality Engineering', totalClasses: 35, present: 24, absent: 11 }, // Below 75%
    ],
    '2024–25': [
      { id: 4, subject: 'Data Structures', totalClasses: 45, present: 40, absent: 5 },
      { id: 5, subject: 'Object Oriented Programming', totalClasses: 42, present: 35, absent: 7 },
    ],
    '2023–24': [] 
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAttendanceData(mockDatabase[selectedSession] || []);
      setLoading(false);
    }, 300);
  }, [selectedSession]);

  const handleSessionChange = (e) => {
    setSelectedSession(e.target.value);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Attendance Record</h1>
        
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No attendance data</h3>
            <p className="mt-1 text-sm text-gray-500">
              No attendance data available for the {selectedSession} session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Total</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Present</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Absent</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceData.map((record) => {
                  // Calculate percentage on the fly
                  const percentage = record.totalClasses > 0 
                    ? ((record.present / record.totalClasses) * 100).toFixed(1) 
                    : 0;
                  
                  // Determine color based on 75% rule
                  const isSafe = percentage >= 75;

                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {record.subject}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {record.totalClasses}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {record.present}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {record.absent}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isSafe ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;