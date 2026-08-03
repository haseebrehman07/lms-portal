import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Calendar, Clock, ChevronDown, AlertTriangle } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentAttendance = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // New API-driven states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [summary, setSummary] = useState({ attendance_percentage: 0, classes_attended: 0, classes_missed: 0, total_classes: 0 });
  const [todayStatus, setTodayStatus] = useState(null);
  
  const [sessionMode, setSessionMode] = useState('online');
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [coursesRes, enrollmentsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/enrollments/me')
        ]);
        const enrolledIds = enrollmentsRes.data.map(e => e.course_id);
        const myCourses = coursesRes.data.filter(c => enrolledIds.includes(c.id));
        
        setEnrolledCourses(myCourses);
        if (myCourses.length > 0) {
          setSelectedCourseId(myCourses[0].id);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      const [historyRes, summaryRes, statusRes] = await Promise.all([
        api.get(`/attendance/me?course_id=${selectedCourseId}`),
        api.get(`/attendance/me/summary?course_id=${selectedCourseId}`),
        api.get(`/attendance/me/today-status?course_id=${selectedCourseId}`)
      ]);
      setAttendanceHistory(historyRes.data);
      setSummary(summaryRes.data);
      setTodayStatus(statusRes.data);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleMarkAttendance = async () => {
    setIsMarking(true);
    try {
      await api.post('/attendance/mark', {
        course_id: selectedCourseId,
        mode: sessionMode
      });
      await fetchAttendanceData(); 
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      alert(error.response?.data?.detail || "Failed to mark attendance.");
    } finally {
      setIsMarking(false);
    }
  };

  if (isLoading && enrolledCourses.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header & Dynamic Course Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Mark your attendance for today's class.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          {enrolledCourses.length > 1 && (
             <div className="flex flex-col gap-1 w-full">
               <label className="text-xs font-semibold text-gray-500 uppercase">Course</label>
               <select
                 value={selectedCourseId}
                 onChange={(e) => setSelectedCourseId(e.target.value)}
                 className="bg-white border border-gray-300 text-gray-900 font-medium text-sm rounded-lg p-2.5 shadow-sm"
               >
                 {enrolledCourses.map((c) => (
                   <option key={c.id} value={c.id}>{c.title}</option>
                 ))}
               </select>
             </div>
          )}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-gray-500 uppercase">Session Mode</label>
            <div className="relative">
              <select
                value={sessionMode}
                onChange={(e) => setSessionMode(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-900 font-medium text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 pr-8 shadow-sm cursor-pointer"
              >
                <option value="online">Online</option>
                <option value="onsite">On-site</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Status Banner */}
      {!todayStatus ? (
        <div className="animate-pulse bg-gray-100 h-32 rounded-xl"></div>
      ) : todayStatus.batch_ended ? (
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <div className="bg-gray-800 text-white p-3 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Batch Completed</h2>
            <p className="text-sm text-gray-600 mt-1">All sessions for this course have concluded.</p>
          </div>
        </div>
      ) : todayStatus.is_cancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4 shadow-sm">
           <div className="bg-red-600 text-white p-3 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
           <div>
             <h2 className="text-xl font-bold text-gray-900">Class Cancelled</h2>
             <p className="text-sm text-red-700 mt-1">Today's session has been cancelled by the instructor. Next class: {todayStatus.next_session_date}</p>
           </div>
        </div>
      ) : todayStatus.is_session_day ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="bg-emerald-600 text-white p-3 rounded-lg shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              <p className="font-semibold text-emerald-800 mt-1">Class is available today</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end w-full md:w-auto gap-2">
            {todayStatus.has_marked ? (
              <div className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                <CheckCircle className="w-5 h-5" /> Marked Present
              </div>
            ) : (
              <button 
                onClick={handleMarkAttendance}
                disabled={isMarking}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-70 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" /> Mark My Attendance
              </button>
            )}
            {todayStatus.cutoff_time && (
              <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Closes at: <span className="font-bold">{todayStatus.cutoff_time}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 items-start shadow-sm">
            <div className="bg-amber-500 text-white p-3 rounded-lg shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">No class scheduled today.</h2>
            </div>
          </div>
          <div className="w-full md:w-64 bg-orange-50 border border-orange-100 rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-bold">Your next class:</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{todayStatus.next_session_date || 'TBD'}</h3> 
          </div>
        </div>
      )}

      {/* API-Driven Summary Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
          Your Attendance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-blue-600">{summary.attendance_percentage}%</span>
            <span className="text-xs font-semibold text-gray-500 uppercase mt-1">Attendance %</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-emerald-600">{summary.classes_attended}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase mt-1">Classes Attended</span>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-orange-600">{summary.classes_missed}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase mt-1">Classes Missed</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-purple-600">{summary.total_classes}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase mt-1">Total Classes</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Recent Attendance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Day</th>
                <th className="px-6 py-4 font-bold">Mode</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Time Marked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceHistory.map((record) => {
                const dateObj = new Date(record.date);
                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${
                        record.mode === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {record.mode === 'online' ? 'Online' : 'On-site'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-bold">Present</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {new Date(record.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StudentAttendance;