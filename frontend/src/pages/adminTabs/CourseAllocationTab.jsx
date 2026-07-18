import React, { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, Trophy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Adjust path if needed

const AdminHomeTab = () => {
  // 1. Setup State for the API data
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_students: 0,
    total_courses: 0,
    total_enrollments: 0,
    certificates_issued: 0
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch data on component load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes, topRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-enrollments'),
          api.get('/dashboard/top-courses')
        ]);
        
        setStats(statsRes.data);
        setRecentEnrollments(recentRes.data);
        setTopCourses(topRes.data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
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

  // Calculate max enrollments to scale the Top Courses progress bars dynamically
  const maxEnrollments = topCourses.length > 0 ? topCourses[0].enrollments : 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, Admin!</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students Card */}
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

        {/* Total Courses Card */}
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

        {/* Total Enrollments Card */}
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

        {/* Certificates Issued Card */}
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
          {/* Training Progress (Static for now until we build analytics) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Training Progress</h3>
            <div className="flex items-center justify-around">
              <div className="relative w-32 h-32 rounded-full border-[12px] border-blue-500 border-r-gray-100 border-b-purple-500 border-l-yellow-400 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">72%</p>
                  <p className="text-[10px] text-gray-500">Completed</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-gray-600">Completed</span><span className="font-bold ml-4">72%</span></div>
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-gray-600">In Progress</span><span className="font-bold ml-4">20%</span></div>
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-red-400"></span><span className="text-gray-600">Not Started</span><span className="font-bold ml-4">8%</span></div>
              </div>
            </div>
          </div>

          {/* Upcoming Trainings (Static for now) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Courses</h3>
              <a href="#" className="text-sm text-blue-600 font-medium">View Calendar</a>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-700 text-center rounded-lg p-2 min-w-[50px]">
                  <p className="text-xs font-bold uppercase">May</p>
                  <p className="text-lg font-bold">24</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Workplace Safety Training</h4>
                  <p className="text-xs text-gray-500">Online Session</p>
                </div>
                <p className="text-sm text-gray-500">10:00 AM - 11:30 AM</p>
              </div>
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
              {recentEnrollments.length > 0 ? (
                recentEnrollments.map((enr, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
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
                      <p className="text-xs text-gray-400">{enr.date}</p>
                      <span className="text-xs font-medium text-blue-600 capitalize">{enr.status}</span>
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
              {topCourses.length > 0 ? (
                topCourses.map((course, idx) => (
                  <div key={course.id}>
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