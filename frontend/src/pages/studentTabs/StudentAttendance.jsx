import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Calendar, MapPin, Laptop, Clock } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentAttendance = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch courses the student is enrolled in
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [coursesRes, enrollmentsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/enrollments/me')
        ]);
        
        // Match enrolled courses and filter for ones that are active
        const enrolledIds = enrollmentsRes.data.map(e => e.course_id);
        const myCourses = coursesRes.data.filter(c => enrolledIds.includes(c.id));
        
        setEnrolledCourses(myCourses);
        if (myCourses.length > 0) {
          setSelectedCourseId(myCourses[0].id);
        }
      } catch (error) {
        console.error("Failed to load enrolled courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch attendance data when selected course changes
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [historyRes, todayRes] = await Promise.all([
        api.get(`/attendance/me?course_id=${selectedCourseId}`),
        api.get(`/attendance/me/today?course_id=${selectedCourseId}`)
      ]);
      setAttendanceHistory(historyRes.data);
      setTodayRecord(todayRes.data);
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handle Mark Attendance
  const handleMarkAttendance = async (mode) => {
    setIsMarking(true);
    setErrorMsg(null);
    try {
      await api.post('/attendance/mark', {
        course_id: selectedCourseId,
        mode: mode
      });
      await fetchAttendanceData(); // Refresh records
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      setErrorMsg(error.response?.data?.detail || "Failed to mark attendance.");
    } finally {
      setIsMarking(false);
    }
  };

  const selectedCourse = enrolledCourses.find(c => c.id === selectedCourseId);

  if (isLoading && enrolledCourses.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header & Course Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Center</h1>
          <p className="text-sm text-gray-500 mt-1">Mark daily presence and review history.</p>
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-64 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm font-medium"
          >
            {enrolledCourses.length === 0 && <option value="">No active enrollments</option>}
            {enrolledCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 font-medium">
          You are not enrolled in any active courses yet.
        </div>
      ) : (
        <>
          {/* THE WIDGET: Only show if course has attendance enabled */}
          {selectedCourse?.attendance_enabled && (
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Calendar className="w-7 h-7 text-blue-200" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Today's Session</h2>
                    <p className="text-blue-200 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                  {todayRecord ? (
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 px-6 py-3 rounded-xl font-bold shadow-inner">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      Marked Present ({todayRecord.mode === 'onsite' ? 'On-Site' : 'Online'})
                    </div>
                  ) : (
                    <div className="flex flex-col w-full sm:w-auto gap-3">
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => handleMarkAttendance('onsite')}
                          disabled={isMarking}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-md disabled:opacity-70"
                        >
                          <MapPin className="w-5 h-5" /> On-Site
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance('online')}
                          disabled={isMarking}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-800 text-white border border-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                        >
                          <Laptop className="w-5 h-5" /> Online
                        </button>
                      </div>
                      {errorMsg && (
                        <p className="text-red-300 text-xs font-medium text-center flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errorMsg}
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* HISTORY TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Attendance History</h2>
            </div>

            {!selectedCourse?.attendance_enabled ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                Attendance tracking is not enabled for this course.
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                No attendance records found. Start marking your presence!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Mode</th>
                      <th className="px-6 py-4 font-semibold text-right">Time Marked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            record.mode === 'onsite' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {record.mode === 'onsite' ? 'On-Site' : 'Online'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium text-right">
                          {new Date(record.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;