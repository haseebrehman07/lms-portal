import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Award, PlayCircle, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    enrollments: [],
    certificates: [],
    announcements: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve user name from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Student' };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch all student data in parallel
        const [enrollRes, certRes, announcRes] = await Promise.all([
          api.get('/enrollments/me'),
          api.get('/certificates/me'),
          api.get('/announcements')
        ]);
  
        setDashboardData({
          enrollments: enrollRes.data || [],
          certificates: certRes.data || [],
          announcements: announcRes.data || []
        });
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
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Course Enrolled */}
        <div onClick={() => navigate('/student/courses')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Courses Enrolled</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.enrollments.length}</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Total Courses</p>
          </div>
        </div>

        {/* Courses Completed */}
        <div onClick={() => navigate('/student/certificates')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-emerald-200 transition-colors">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Courses Completed</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.certificates.length}</p>
            </div>
            <p className="text-xs text-emerald-500 font-medium mt-0.5">Keep it up!</p>
          </div>
        </div>

        {/* Learning Hours (Static placeholder until backend tracks time) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Learning Hours</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">This Month</p>
          </div>
        </div>

        {/* Certificates Earned */}
        <div onClick={() => navigate('/student/certificates')} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 transition-colors">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Certificates Earned</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.certificates.length}</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Earned so far</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Continue Learning Widget */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Continue Learning</h3>
          </div>
          
          {dashboardData.enrollments.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start border border-gray-50 rounded-xl p-4 shadow-sm">
              <div className="w-full sm:w-48 h-32 bg-gray-900 rounded-xl relative flex items-center justify-center">
                 <PlayCircle className="w-12 h-12 text-white opacity-80" />
              </div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-gray-900 text-lg">{dashboardData.enrollments[0]?.course_name || 'Active Course'}</h4>
                <p className="text-sm text-gray-500 mb-4">Pick up where you left off</p>
                <button 
                  onClick={() => navigate('/student/learning')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">You are not enrolled in any courses yet.</p>
          )}
        </div>

        {/* Upcoming Deadlines / Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
            <button onClick={() => navigate('/student/deadlines')} className="text-sm text-blue-600 font-medium hover:underline">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardData.announcements.length > 0 ? (
              dashboardData.announcements.slice(0, 3).map((task, idx) => (
                <div key={idx} onClick={() => navigate('/student/deadlines')} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{task.date ? new Date(task.date).toLocaleDateString() : 'Ongoing'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No new announcements.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;