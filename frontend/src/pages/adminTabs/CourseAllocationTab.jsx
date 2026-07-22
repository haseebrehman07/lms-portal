import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, Trophy, Loader2, CalendarX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Adjust path if needed

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

// Helper: Map status to Tailwind color classes
const statusStyles = {
  completed: 'text-emerald-600 bg-emerald-50',
  in_progress: 'text-blue-600 bg-blue-50',
  not_started: 'text-gray-500 bg-gray-100'
};

const AdminHomeTab = () => {
  const navigate = useNavigate();

  // 1. Setup State for API data & UI
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    total_students: 0,
    total_courses: 0,
    total_enrollments: 0,
    certificates_issued: 0,
    training_progress: {
      completed: 0,
      completed_percent: 0,
      in_progress: 0,
      in_progress_percent: 0,
      not_started: 0,
      not_started_percent: 0
    }
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({}); // Granular error tracking

  // 2. Fetch data on component load
  useEffect(() => {
    const fetchData = async () => {
      // Using Promise.allSettled so one failed endpoint doesn't break the whole dashboard
      const [meRes, statsRes, recentRes, topRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-enrollments'),
        api.get('/dashboard/top-courses')
      ]);

      const newErrors = {};

      if (meRes.status === 'fulfilled') {
        setCurrentUser(meRes.value.data);
      } else {
        newErrors.me = true;
        console.error('Failed to fetch current user:', meRes.reason);
      }

      if (statsRes.status === 'fulfilled') {
        setStats((prev) => ({ ...prev, ...statsRes.value.data }));
      } else {
        newErrors.stats = true;
        console.error('Failed to fetch dashboard stats:', statsRes.reason);
      }

      if (recentRes.status === 'fulfilled') {
        setRecentEnrollments(recentRes.value.data);
      } else {
        newErrors.recent = true;
        console.error('Failed to fetch recent enrollments:', recentRes.reason);
      }

      if (topRes.status === 'fulfilled') {
        setTopCourses(topRes.value.data);
      } else {
        newErrors.top = true;
        console.error('Failed to fetch top courses:', topRes.reason);
      }

      setErrors(newErrors);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading dashboard statistics...</p>
      </div>
    );
  }

  // 4. Calculations for Dynamic UI
  const { completed_percent, in_progress_percent, not_started_percent } = stats.training_progress;
  const hasProgressData = completed_percent + in_progress_percent + not_started_percent > 0;
  
  // Real conic-gradient donut driven by actual percentages (removes the hardcoded mock borders)
  const donutStyle = hasProgressData
    ? {
        background: `conic-gradient(
          #3b82f6 0% ${completed_percent}%,
          #facc15 ${completed_percent}% ${completed_percent + in_progress_percent}%,
          #f87171 ${completed_percent + in_progress_percent}% 100%
        )`
      }
    : { background: '#f3f4f6' };

  // Calculate max enrollments safely to scale Top Courses progress bars dynamically
  const maxEnrollments = topCourses.length > 0
    ? Math.max(...topCourses.map((c) => c.enrollments || 0), 1)
    : 1;

  const firstName = currentUser?.name?.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome back, Admin!'}
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Students</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.total_students}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/courses')}
          className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-emerald-200 transition-colors"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Courses</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.total_courses}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/enrollments')}
          className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 transition-colors"
        >
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/certificates')}
          className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-purple-200 transition-colors"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Certificates Issued</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{stats.certificates_issued}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Training Progress - Dynamic from /dashboard/stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Training Progress</h3>
            {errors.stats ? (
              <p className="text-sm text-gray-500">Couldn't load training progress.</p>
            ) : stats.total_enrollments === 0 ? (
              <p className="text-sm text-gray-500">No enrollments yet.</p>
            ) : (
              <div className="flex items-center justify-around">
                <div 
                  className="relative w-32 h-32 rounded-full flex items-center justify-center"
                  style={donutStyle}
                >
                  <div className="absolute w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{completed_percent}%</p>
                      <p className="text-[10px] text-gray-500">Completed</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600">Completed</span>
                    <span className="font-bold ml-4">{completed_percent}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="text-gray-600">In Progress</span>
                    <span className="font-bold ml-4">{in_progress_percent}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="text-gray-600">Not Started</span>
                    <span className="font-bold ml-4">{not_started_percent}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Trainings - Clean Empty State */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Courses</h3>
              <a href="#" className="text-sm text-blue-600 font-medium">View Calendar</a>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-6 text-gray-400">
              <CalendarX className="w-8 h-8 mb-2" />
              <p className="text-sm">No upcoming courses scheduled yet.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Dynamic Recent Enrollments */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Enrollments</h3>
              <a href="#" className="text-sm text-blue-600 font-medium">View All</a>
            </div>
            <div className="space-y-4">
              {errors.recent ? (
                <p className="text-sm text-gray-500">Couldn't load recent enrollments.</p>
              ) : recentEnrollments.length > 0 ? (
                recentEnrollments.map((enr) => (
                  <div key={enr.id || enr.course_name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                        {enr.student_name ? enr.student_name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{enr.course_name}</h4>
                        <p className="text-xs text-gray-500">{enr.student_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-gray-400">{formatDate(enr.date)}</p>
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
          </div>

          {/* Dynamic Top Courses */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Top Courses</h3>
              <a href="#" className="text-sm text-blue-600 font-medium">View All</a>
            </div>
            <div className="space-y-5">
              {errors.top ? (
                <p className="text-sm text-gray-500">Couldn't load top courses.</p>
              ) : topCourses.length > 0 ? (
                topCourses.map((course, idx) => (
                  <div key={course.id || idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{idx + 1}. {course.title}</span>
                      <span className="font-bold text-gray-900">{course.enrollments} enrolled</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(course.enrollments / maxEnrollments) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No courses available.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminHomeTab;