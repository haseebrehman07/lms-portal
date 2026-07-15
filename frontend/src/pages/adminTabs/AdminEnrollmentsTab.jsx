import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Check, X, Upload, Download, Users, ChevronDown, FileText, BookOpen } from 'lucide-react';

const AdminEnrollmentsTab = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection State
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSessionName, setImportSessionName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enrollRes, coursesRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/courses')
      ]);
      
      let usersData = [];
      try {
        const usersRes = await api.get('/users');
        usersData = usersRes.data;
      } catch (e) {
        console.warn("Could not fetch users list");
      }

      const enrollmentsData = enrollRes.data;
      const coursesData = coursesRes.data;

      setCourses(coursesData);
      
      if (!selectedCourseId && coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }

      const detailedEnrollments = enrollmentsData.map(enr => {
        const matchedUser = usersData.find(u => u.id === enr.user_id);
        
        // Spread matched user first so ANY extra dynamic columns from DB are included
        return {
          studentName: matchedUser ? (matchedUser.name || matchedUser.email) : `ID: ${enr.user_id.slice(0, 8)}...`,
          department: matchedUser?.department || 'N/A',
          ...matchedUser, 
          ...enr, // Spread enrollment over it so status/progress take precedence
        };
      });

      setEnrollments(detailedEnrollments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // RESTORED: Fixed syntax error where this got overwritten
  const handleStatusUpdate = async (enrollmentId, newStatus) => {
    try {
      if (newStatus === 'approved') {
        await api.patch(`/enrollments/${enrollmentId}/approve`);
      } 
      await fetchData(); 
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating enrollment status.");
    }
  };

  // --- CSV IMPORT LOGIC ---
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile || !importSessionName.trim() || !selectedCourseId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('session_name', importSessionName.trim());

    try {
      // 1. Uses 'api' so your Admin Token is automatically attached!
      // 2. Explicitly override the JSON default to 'multipart/form-data'
      await api.post(`/courses/${selectedCourseId}/import-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportSessionName('');
      await fetchData(); // Refresh the tables
    } catch (error) {
      console.error("Import failed:", error);
      alert(error.response?.data?.detail || "Failed to import CSV.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- CSV EXPORT LOGIC ---
  const handleExport = async (sessionName = null) => {
    if (!selectedCourseId) return;
    try {
      const url = `/courses/${selectedCourseId}/export-csv${sessionName ? `?session_name=${encodeURIComponent(sessionName)}` : ''}`;
      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `enrollments_${sessionName || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export CSV.");
    }
  };

  // --- DATA GROUPING ---
  const courseEnrollments = enrollments.filter(e => e.course_id === selectedCourseId);
  const groupedEnrollments = courseEnrollments.reduce((acc, curr) => {
    const session = curr.session_name || 'Independent Learners';
    if (!acc[session]) acc[session] = [];
    acc[session].push(curr);
    return acc;
  }, {});

  // --- DYNAMIC TABLE HELPERS ---
  // Hide internal database IDs and passwords from the dynamic table
  const EXCLUDED_KEYS = ['id', 'user_id', 'course_id', 'session_name', 'enrolled_at', 'completed_at', 'password_hash', 'role', 'is_active', 'updated_at', 'created_at', 'avatar_url'];

  const getDynamicColumns = (students) => {
    if (!students || students.length === 0) return [];
    // Grab all keys from the first student object, filter out the excluded ones
    return Object.keys(students[0]).filter(key => !EXCLUDED_KEYS.includes(key));
  };

  const formatColumnHeader = (key) => {
    // Converts "progress_percent" to "Progress Percent"
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header & Course Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage enrollments and cohort sessions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8 outline-none font-medium"
            >
              <option value="" disabled>Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button 
            onClick={() => handleExport()}
            disabled={!selectedCourseId || courseEnrollments.length === 0}
            className="p-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Export All to CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={!selectedCourseId}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic Session Tables */}
      {!selectedCourseId ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No Course Selected</h3>
          <p className="text-gray-500">Please select a course from the dropdown above.</p>
        </div>
      ) : Object.keys(groupedEnrollments).length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No Enrollments Found</h3>
          <p className="text-gray-500">Use the Import button to add a cohort via CSV.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEnrollments).map(([sessionName, students]) => {
            const dynamicColumns = getDynamicColumns(students);

            return (
              <div key={sessionName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{sessionName}</h2>
                      <p className="text-xs font-medium text-gray-500">{students.length} Learners</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleExport(sessionName === 'Independent Learners' ? '' : sessionName)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export Cohort
                  </button>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        {/* Dynamically Map Headers */}
                        {dynamicColumns.map((colKey) => (
                          <th key={colKey} className="px-6 py-3 font-semibold text-gray-500 whitespace-nowrap">
                            {formatColumnHeader(colKey)}
                          </th>
                        ))}
                        {/* Always keep Actions at the end */}
                        <th className="px-6 py-3 font-semibold text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map((enr) => (
                        <tr key={enr.id} className="hover:bg-gray-50/50 transition-colors">
                          
                          {/* Dynamically Map Cells */}
                          {dynamicColumns.map((colKey) => (
                            <td key={colKey} className="px-6 py-4">
                              {/* Special Formatting for Progress */}
                              {colKey === 'progress_percent' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${enr[colKey]}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-600">{enr[colKey]}%</span>
                                </div>
                              ) 
                              /* Special Formatting for Status */
                              : colKey === 'status' ? (
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                                  enr[colKey] === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 
                                  enr[colKey] === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                  enr[colKey] === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 
                                  'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                  {enr[colKey]}
                                </span>
                              ) 
                              /* Default Text Formatting for everything else */
                              : (
                                <span className="text-gray-600 font-medium">
                                  {typeof enr[colKey] === 'object' ? JSON.stringify(enr[colKey]) : String(enr[colKey] || '—')}
                                </span>
                              )}
                            </td>
                          ))}

                          {/* Static Actions Column */}
                          <td className="px-6 py-4 text-right">
                            {enr.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleStatusUpdate(enr.id, 'approved')}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors cursor-pointer" title="Reject">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-medium text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- IMPORT MODAL --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Import Cohort</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session / Cohort Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., CHRMP 16" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  value={importSessionName}
                  onChange={(e) => setImportSessionName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors group">
                  <FileText className={`w-8 h-8 mb-2 ${importFile ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
                  <span className="text-sm font-medium text-gray-600 text-center">
                    {importFile ? importFile.name : "Click to select CSV file"}
                  </span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    required
                    className="hidden" 
                    onChange={(e) => setImportFile(e.target.files[0])}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2 flex flex-col gap-1">
                  <span>Required columns: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">email</code></span>
                  <span>Any extra columns will automatically display!</span>
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? 'Importing...' : 'Upload & Enroll Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEnrollmentsTab;