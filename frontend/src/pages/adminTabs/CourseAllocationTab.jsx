import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, Trophy, Loader2, CalendarX, ArrowRight, UploadCloud, X, ImageIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

// Helper: Safely format dates
const formatDate = (isoString) => {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

const statusStyles = {
  completed: 'text-emerald-600 bg-emerald-50',
  in_progress: 'text-blue-600 bg-blue-50',
  not_started: 'text-gray-500 bg-gray-100'
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getNextClassDates = (courses) => {
  const upcoming = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  courses.forEach(course => {
    if (!course.session_days || course.session_days.length === 0) return;
    for (let offset = 0; offset <= 14; offset++) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() + offset);
      const pythonWeekday = candidate.getDay() === 0 ? 6 : candidate.getDay() - 1;

      if (course.session_days.includes(pythonWeekday)) {
        upcoming.push({
          courseName: course.title,
          date: new Date(candidate),
          dayName: DAY_NAMES[candidate.getDay()]
        });
        break; 
      }
    }
  });
  return upcoming.sort((a, b) => a.date - b.date).slice(0, 3);
};

const AdminHomeTab = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    total_students: 0,
    total_courses: 0,
    total_enrollments: 0,
    certificates_issued: 0,
    training_progress: {
      completed: 0, completed_percent: 0,
      in_progress: 0, in_progress_percent: 0,
      not_started: 0, not_started_percent: 0
    }
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  
  // Poster State
  const [posterUrl, setPosterUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({}); 

  useEffect(() => {
    const fetchData = async () => {
      const [meRes, statsRes, recentRes, topRes, coursesRes, posterRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-enrollments'),
        api.get('/dashboard/top-courses'),
        api.get('/courses'),
        api.get('/dashboard/upcoming-poster').catch(() => ({ data: { url: null } })) 
      ]);

      const newErrors = {};

      if (meRes.status === 'fulfilled') setCurrentUser(meRes.value.data);
      else newErrors.me = true;

      if (statsRes.status === 'fulfilled') setStats((prev) => ({ ...prev, ...statsRes.value.data }));
      else newErrors.stats = true;

      if (recentRes.status === 'fulfilled') setRecentEnrollments(recentRes.value.data);
      else newErrors.recent = true;

      if (topRes.status === 'fulfilled') setTopCourses(topRes.value.data);
      else newErrors.top = true;

      if (coursesRes.status === 'fulfilled') setUpcomingClasses(getNextClassDates(coursesRes.value.data));
      else newErrors.courses = true;

      if (posterRes.status === 'fulfilled' && posterRes.value.data?.url) setPosterUrl(posterRes.value.data.url);

      setErrors(newErrors);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const uploadRes = await api.post('/uploads/thumbnail', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newImageUrl = uploadRes.data.url;
      await api.post('/dashboard/upcoming-poster', { url: newImageUrl });
      setPosterUrl(newImageUrl);
    } catch (err) {
      console.error("Poster upload failed:", err);
      alert(err.response?.data?.detail || "Failed to upload poster.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePoster = async () => {
    try {
      await api.delete('/dashboard/upcoming-poster');
      setPosterUrl(null);
    } catch (err) {
      console.error("Poster removal failed:", err);
      alert("Failed to remove poster.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading dashboard statistics...</p>
      </div>
    );
  }

  const { completed_percent, in_progress_percent, not_started_percent } = stats.training_progress;
  const hasProgressData = completed_percent + in_progress_percent + not_started_percent > 0;
  
  const donutStyle = hasProgressData
    ? { background: `conic-gradient(#3b82f6 0% ${completed_percent}%, #facc15 ${completed_percent}% ${completed_percent + in_progress_percent}%, #f87171 ${completed_percent + in_progress_percent}% 100%)` }
    : { background: '#f3f4f6' };

  const maxEnrollments = topCourses.length > 0 ? Math.max(...topCourses.map((c) => c.enrollments || 0), 1) : 1;
  const firstName = currentUser?.name?.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome back, Admin!'}
        </p>
      </div>

      {/* Top Stats Row (Permanent Colored Borders with Enhanced Hovers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div 
          onClick={() => navigate('/admin/users')} 
          className="bg-white p-6 rounded-2xl border-2 border-blue-200 flex items-center gap-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
        >
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_students}</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/courses')} 
          className="bg-white p-6 rounded-2xl border-2 border-emerald-200 flex items-center gap-4 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all"
        >
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Courses</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_courses}</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/enrollments')} 
          className="bg-white p-6 rounded-2xl border-2 border-orange-200 flex items-center gap-4 cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all"
        >
          <div className="p-3.5 bg-orange-50 text-orange-500 rounded-xl"><UserCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/certificates')} 
          className="bg-white p-6 rounded-2xl border-2 border-purple-200 flex items-center gap-4 cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all"
        >
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl"><Trophy className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Certificates Issued</p>
            <p className="text-2xl font-bold text-gray-900">{stats.certificates_issued}</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Left & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* === LEFT COLUMN === */}
        <div className="space-y-6">
          
          {/* Upcoming Interactive Session Poster Management */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Interactive Session</h3>
              {posterUrl && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">Active</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="w-full sm:w-64 h-36 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl relative flex items-center justify-center overflow-hidden shrink-0 group">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : posterUrl ? (
                  <>
                    <img src={posterUrl} alt="Session Poster" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <label className="cursor-pointer text-white font-medium text-sm flex items-center gap-2 hover:underline">
                        <UploadCloud className="w-4 h-4" /> Replace
                        <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 w-full h-full transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Upload Poster</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                  </label>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Upload an image to announce an upcoming live session to students. Recommended: 16:9 ratio.
                </p>
                {posterUrl && (
                  <button 
                    onClick={handleRemovePoster}
                    className="self-start px-4 py-2 border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Training Progress */}
          <div onClick={() => navigate('/admin/reports')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Training Progress</h3>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
            {errors.stats ? (
              <p className="text-sm text-gray-500">Couldn't load training progress.</p>
            ) : stats.total_enrollments === 0 ? (
              <p className="text-sm text-gray-500">No enrollments yet.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center shrink-0" style={donutStyle}>
                  <div className="absolute w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{completed_percent}%</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Completed</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-4 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-gray-600 font-medium">Completed</span></div>
                    <span className="font-bold text-gray-900">{completed_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span><span className="text-gray-600 font-medium">In Progress</span></div>
                    <span className="font-bold text-gray-900">{in_progress_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-4 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span><span className="text-gray-600 font-medium">Not Started</span></div>
                    <span className="font-bold text-gray-900">{not_started_percent}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div onClick={() => navigate('/admin/courses')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all group hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Upcoming Classes</h3>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
            
            {upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-blue-100 transition-colors">
                    <div className="bg-blue-100 text-blue-700 p-3 rounded-lg flex flex-col items-center justify-center min-w-[3.5rem] shrink-0">
                      <span className="text-xs font-bold uppercase">{cls.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-tight">{cls.date.getDate()}</span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{cls.courseName}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{cls.dayName} Session</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-gray-400">
                <CalendarX className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No upcoming classes scheduled yet.</p>
              </div>
            )}
          </div>

        </div>

        {/* === RIGHT COLUMN === */}
        <div className="space-y-6">
          
          {/* Dynamic Recent Enrollments */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Enrollments</h3>
            <div className="space-y-4 flex-1">
              {errors.recent ? (
                <p className="text-sm text-gray-500">Couldn't load recent enrollments.</p>
              ) : recentEnrollments.length > 0 ? (
                recentEnrollments.map((enr) => (
                  <div key={enr.id || enr.course_name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 uppercase shrink-0">
                        {enr.student_name ? enr.student_name.charAt(0) : 'U'}
                      </div>
                      <div className="overflow-hidden pr-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{enr.course_name}</h4>
                        <p className="text-xs text-gray-500 truncate">{enr.student_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <p className="text-xs text-gray-400 hidden sm:block">{formatDate(enr.date)}</p>
                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${statusStyles[enr.status?.toLowerCase()] || 'text-gray-500 bg-gray-100'}`}>
                        {enr.status ? enr.status.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent enrollments found.</p>
              )}
            </div>
            
            <div onClick={() => navigate('/admin/enrollments')} className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">View All Enrollments</span>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Dynamic Top Courses */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Courses</h3>
            <div className="space-y-5 flex-1">
              {errors.top ? (
                <p className="text-sm text-gray-500">Couldn't load top courses.</p>
              ) : topCourses.length > 0 ? (
                topCourses.map((course, idx) => (
                  <div key={course.id || idx}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 truncate pr-4">{idx + 1}. {course.title}</span>
                      <span className="font-bold text-gray-900 shrink-0">{course.enrollments} enrolled</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(course.enrollments / maxEnrollments) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No courses available.</p>
              )}
            </div>

            <div onClick={() => navigate('/admin/courses')} className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">View All Courses</span>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminHomeTab;