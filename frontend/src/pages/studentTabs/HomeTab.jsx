import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Award, Loader2, AlertCircle, ArrowRight, CalendarX, ImageIcon } from 'lucide-react';
import api from '../../api/axiosConfig';

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper: Find the next occurrence of specific weekdays
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    enrollments: [],
    certificates: [],
    announcements: []
  });
  
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [posterUrl, setPosterUrl] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(sessionStorage.getItem('user')) || { name: 'Student' };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [enrollRes, certRes, announcRes, coursesRes, posterRes] = await Promise.allSettled([
          api.get('/enrollments/me'),
          api.get('/certificates/me'),
          api.get('/announcements'),
          api.get('/courses'),
          api.get('/dashboard/upcoming-poster').catch(() => ({ data: { url: null } }))
        ]);
  
        setDashboardData({
          enrollments: enrollRes.status === 'fulfilled' ? enrollRes.value.data : [],
          certificates: certRes.status === 'fulfilled' ? certRes.value.data : [],
          announcements: announcRes.status === 'fulfilled' ? announcRes.value.data : []
        });

        if (coursesRes.status === 'fulfilled') {
          const enrolledIds = enrollRes.status === 'fulfilled' ? enrollRes.value.data.map(e => e.course_id) : [];
          const enrolledCoursesData = coursesRes.value.data.filter(c => enrolledIds.includes(c.id));
          setUpcomingClasses(getNextClassDates(enrolledCoursesData));
        }

        if (posterRes.status === 'fulfilled' && posterRes.value.data?.url) {
          setPosterUrl(posterRes.value.data.url);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please ensure the backend is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Keep learning, keep growing.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/student/courses')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Courses Enrolled</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.enrollments.length}</p>
          </div>
        </div>

        <div onClick={() => navigate('/student/certificates')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Courses Completed</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.certificates.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Learning Hours</p>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
        </div>

        <div onClick={() => navigate('/student/certificates')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 hover:shadow-md transition-all">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><Award className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Certificates Earned</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.certificates.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Session Poster */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Upcoming Session</h3>
          </div>
          <div className="flex-1 bg-gray-50 flex items-center justify-center relative min-h-[300px]">
            {posterUrl ? (
              <img 
                src={posterUrl} 
                alt="Upcoming Session" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <ImageIcon className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No upcoming sessions right now.</p>
                <p className="text-xs mt-1">Keep an eye out for future announcements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications (Moved to the smaller right column) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Notifications</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            {dashboardData.announcements.length > 0 ? (
              dashboardData.announcements.slice(0, 3).map((task, idx) => (
                <div key={idx} onClick={() => navigate('/student/deadlines')} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{task.title}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">{task.date ? new Date(task.date).toLocaleDateString() : 'Ongoing'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-gray-400">
                <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No new announcements.</p>
              </div>
            )}
          </div>

          <div 
            onClick={() => navigate('/student/notifications')}
            className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between cursor-pointer group"
          >
            <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">View All Notifications</span>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Upcoming Classes (Moved to the full-width bottom row) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Classes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls, idx) => (
                <div key={idx} onClick={() => navigate('/student/courses')} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-blue-100 shadow-sm">
                  <div className="bg-blue-100 text-blue-700 p-3 rounded-lg flex flex-col items-center justify-center min-w-[3.5rem] shrink-0">
                    <span className="text-xs font-bold uppercase">{cls.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-tight">{cls.date.getDate()}</span>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{cls.courseName}</h4>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{cls.dayName} Session</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4 md:col-span-3">No upcoming classes scheduled yet.</p>
            )}
          </div>

          <div 
            onClick={() => navigate('/student/courses')}
            className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between cursor-pointer group"
          >
            <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">View All Courses</span>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;