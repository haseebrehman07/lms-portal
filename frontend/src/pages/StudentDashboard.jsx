import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationModal from '../components/NotificationModal';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName') || 'Participant';

      if (!token || role !== 'student') return navigate('/');
      setUserName(name);

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [enrollmentRes, assignmentRes, availableRes] = await Promise.all([
          axios.get('http://localhost:5000/api/student/enrollments', config),
          axios.get('http://localhost:5000/api/student/assignments', config),
          axios.get('http://localhost:5000/api/student/courses/available', config)
        ]);
        
        setEnrollments(enrollmentRes.data);
        setAssignments(assignmentRes.data);
        setAvailableCourses(availableRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data.');
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Stat Cards Data
  const stats = [
    { label: 'Courses Enrolled', value: enrollments.length, subtext: 'Total Courses', icon: '📚', color: 'bg-blue-100 text-blue-600', path: '/student/courses' },
    { label: 'Courses Completed', value: '5', subtext: 'Keep it up!', icon: '✅', color: 'bg-green-100 text-green-600', path: '/student/certificates' },
    { label: 'Learning Hours', value: '48h', subtext: 'This Month', icon: '⏱️', color: 'bg-yellow-100 text-yellow-600', path: null },
    { label: 'Certificates', value: '8', subtext: 'View all', icon: '🏆', color: 'bg-purple-100 text-purple-600', path: '/student/certificates' }
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><h2>Loading Portal...</h2></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      <NotificationModal />
      
      {/* Welcome Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold">Welcome back, <span className="text-blue-600">{userName}</span>! 👋</h1>
        <p className="text-gray-500">Keep learning, keep growing.</p>
      </div>

      {/* Stat Cards (THE CLICKABLE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => stat.path && navigate(stat.path)}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 transition-all duration-200 
              ${stat.path ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your existing Enrolled/Catalog/Assignments layout goes here... */}
      </div>
    </div>
  );
};

export default StudentDashboard;