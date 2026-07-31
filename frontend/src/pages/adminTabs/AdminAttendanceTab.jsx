import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, AlertTriangle, Calendar, FileText, Activity } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminAttendanceTab = () => {
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'summary'
  
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Tab 1: Records
  const [records, setRecords] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Tab 2: Summary
  const [summaryData, setSummaryData] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch courses (only those with attendance enabled)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        const trackingCourses = res.data.filter(c => c.attendance_enabled);
        setCourses(trackingCourses);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // 2. Fetch Data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'records') {
          let url = '/attendance?';
          if (selectedCourseId) url += `course_id=${selectedCourseId}&`;
          if (filterDate) url += `date=${filterDate}`;
          
          const res = await api.get(url);
          setRecords(res.data);
        } else if (activeTab === 'summary' && selectedCourseId) {
          const res = await api.get(`/attendance/course/${selectedCourseId}/summary`);
          setSummaryData(res.data);
        } else {
          setSummaryData([]);
        }
      } catch (err) {
        console.error("Failed to load attendance data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, selectedCourseId, filterDate]);

  // Actions
  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/attendance/${editingRecord.id}`, {
        date: editingRecord.date,
        mode: editingRecord.mode
      });
      setEditingRecord(null);
      // Trigger re-fetch
      const url = `/attendance?${selectedCourseId ? `course_id=${selectedCourseId}&` : ''}${filterDate ? `date=${filterDate}` : ''}`;
      const res = await api.get(url);
      setRecords(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update record.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      await api.delete(`/attendance/${id}`);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Log</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and report daily student presence.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2 ${
              activeTab === 'records' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Raw Records
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex justify-center items-center gap-2 ${
              activeTab === 'summary' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="w-4 h-4" /> Summary Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:w-72 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm font-medium"
        >
          <option value="">{activeTab === 'summary' ? 'Select a course to view summary...' : 'All Tracking Courses'}</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {activeTab === 'records' && (
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 shadow-sm font-medium"
          />
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'summary' ? (
          // SUMMARY TAB
          !selectedCourseId ? (
            <div className="p-16 text-center text-gray-500 font-medium bg-gray-50 border-t border-gray-100">
              Please select a course from the dropdown above to view its summary report.
            </div>
          ) : summaryData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">No attendance data exists for this course yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Learner Name</th>
                    <th className="px-6 py-4 font-semibold text-center text-purple-600">On-Site Total</th>
                    <th className="px-6 py-4 font-semibold text-center text-blue-600">Online Total</th>
                    <th className="px-6 py-4 font-semibold text-center bg-gray-100 border-l border-gray-200">Total Sessions Attended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryData.map(row => (
                    <tr key={row.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{row.user_name}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{row.onsite_count}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{row.online_count}</td>
                      <td className="px-6 py-4 text-center font-black text-gray-900 bg-gray-50 border-l border-gray-100">{row.total_sessions_marked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // RECORDS TAB
          records.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">No attendance records match these filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Learner Name</th>
                    <th className="px-6 py-4 font-semibold">Course</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Mode</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {record.user_name} <br/>
                        <span className="text-xs text-gray-500 font-medium">{record.user_email}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{record.course_title}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          record.mode === 'onsite' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {record.mode === 'onsite' ? 'On-Site' : 'Online'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setEditingRecord(record)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Record</h2>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date"
                  required
                  value={editingRecord.date}
                  onChange={e => setEditingRecord({...editingRecord, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={editingRecord.mode}
                  onChange={e => setEditingRecord({...editingRecord, mode: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="onsite">On-Site</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAttendanceTab;