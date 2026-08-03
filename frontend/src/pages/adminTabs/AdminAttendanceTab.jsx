import React, { useState, useEffect } from 'react';
import { MoreVertical, Download, Search } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminAttendanceTab = () => {
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real API Filters
  const [dateFilter, setDateFilter] = useState(''); 
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.filter(c => c.attendance_enabled));
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage, limit: 15 });
        if (selectedCourseId) params.append('course_id', selectedCourseId);
        if (selectedMode) params.append('mode', selectedMode);
        if (dateFilter) params.append('date', dateFilter);
        if (searchQuery) params.append('search', searchQuery);
        
        const res = await api.get(`/attendance?${params.toString()}`);
        setRecords(res.data.items || res.data); // Adjust based on teammate's exact pagination JSON shape
        setTotalPages(res.data.total_pages || 1);
        setTotalRecords(res.data.total_items || res.data.length);
      } catch (err) {
        console.error("Failed to load attendance data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small debounce for the text search
    const delayDebounceFn = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [selectedCourseId, selectedMode, dateFilter, searchQuery, currentPage]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedCourseId) params.append('course_id', selectedCourseId);
    if (selectedMode) params.append('mode', selectedMode);
    if (dateFilter) params.append('date', dateFilter);
    if (searchQuery) params.append('search', searchQuery);
    
    // Trigger browser download by hitting the new export endpoint directly
    window.location.href = `${api.defaults.baseURL}/attendance/export?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage student attendance.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Dynamic Filters Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-gray-50/50">
          
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded px-3 py-1.5 font-medium shadow-sm outline-none focus:border-blue-500"
            />
            <select
              value={selectedMode}
              onChange={(e) => { setSelectedMode(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded px-3 py-1.5 font-medium shadow-sm outline-none focus:border-blue-500"
            >
              <option value="">All Modes</option>
              <option value="online">Online</option>
              <option value="onsite">On-site</option>
            </select>

            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded px-3 py-1.5 font-medium shadow-sm outline-none focus:border-blue-500 max-w-[200px] truncate"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded pl-3 pr-8 py-1.5 font-medium shadow-sm w-full md:w-48 outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button 
              onClick={handleExport}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm rounded px-3 py-1.5 font-medium shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Student Name</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Day</th>
                  <th className="px-6 py-4 font-bold">Mode</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Time Marked</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(record => {
                  const dateObj = new Date(record.date);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{record.user_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold ${
                          record.mode === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {record.mode === 'online' ? 'Online' : 'On-site'}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold text-emerald-600">Present</span></td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{new Date(record.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <span className="text-sm text-gray-500 font-medium">
                Showing Page {currentPage} of {totalPages} ({totalRecords} records)
              </span>
              <div className="flex gap-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-3 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded text-sm font-medium disabled:opacity-50"
                >&lt;</button>
                <span className="px-3 py-1 border border-blue-600 bg-blue-600 text-white rounded text-sm font-medium">{currentPage}</span>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded text-sm font-medium disabled:opacity-50"
                >&gt;</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendanceTab;