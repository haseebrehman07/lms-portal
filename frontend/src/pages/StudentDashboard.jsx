// frontend/src/pages/StudentDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import NotificationModal from '../components/NotificationModal'; // <-- Fixed import path to just one folder up!

const StudentDashboard = () => {
  console.log("🚨 DASHBOARD IS RENDERING!");
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  
  const [enrollments, setEnrollments] = useState([]);
  const [timetable, setTimetable] = useState([]);
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
        
        const [enrollmentRes, timetableRes, assignmentRes, availableRes] = await Promise.all([
          axios.get('http://localhost:5000/api/student/enrollments', config),
          axios.get('http://localhost:5000/api/student/timetable', config),
          axios.get('http://localhost:5000/api/student/assignments', config),
          axios.get('http://localhost:5000/api/student/courses/available', config)
        ]);
        
        setEnrollments(enrollmentRes.data);
        setTimetable(timetableRes.data);
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

  const checkAttendanceEligibility = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/student/attendance/${courseId}`, config);
      alert(`Attendance: ${data.percentage}%\nEligible for Exams: ${data.isEligible ? 'Yes' : 'No'}`);
    } catch (error) {
      alert('Error fetching attendance');
    }
  };

  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/student/enroll', { courseId, section: 'A' }, config);
      alert('Successfully enrolled!');
      window.location.reload(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Error enrolling in course');
    }
  };

  const handleSubmitAssignment = async (e, assignmentId) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const fileUrl = e.target.elements.fileUrl.value;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/student/submission', { assignmentId, fileUrl }, config);
      alert('Assignment submitted successfully!');
      e.target.reset();
    } catch (error) {
      alert('Error submitting assignment');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- THE FIX: Wrap early returns in a Fragment <> so the Modal always loads! ---
  if (loading) return (
    <>
      <NotificationModal />
      <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <h2>Loading Portal...</h2>
      </div>
    </>
  );

  if (error) return (
    <>
      <NotificationModal />
      <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <h2 style={{color: '#ef4444'}}>{error}</h2>
      </div>
    </>
  );

  return (
    <div className="dashboard-container">
      <NotificationModal />
      <header className="dashboard-header">
        <h1>Welcome, <span className="highlight-green">{userName}</span></h1>
        <button className="logout-btn" onClick={handleLogout}>Potato Logout</button>
      </header>

      <div className="dashboard-grid">
        
        {/* CARD 1: My Courses */}
        <div className="dashboard-card">
          <h3>Enrolled Courses</h3>
          {enrollments.length === 0 ? <p>No courses enrolled yet.</p> : enrollments.map((enr) => (
            <div key={enr._id} style={{marginBottom: '15px'}}>
              <h4 style={{margin: '0 0 5px 0', color: '#e2e8f0'}}>{enr.course.title}</h4>
              <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Code: {enr.course.courseCode} | Section: {enr.section}</p>
              <button className="action-btn blue" onClick={() => checkAttendanceEligibility(enr.course._id)}>
                Check Attendance Eligibility
              </button>
              <hr />
            </div>
          ))}
        </div>

        {/* CARD 2: Course Catalog */}
        <div className="dashboard-card" style={{borderColor: '#10b981'}}>
          <h3>Course Catalog</h3>
          {availableCourses.length === 0 ? <p>You are enrolled in all available courses.</p> : availableCourses.map((course) => (
            <div key={course._id} style={{marginBottom: '15px'}}>
              <h4 style={{margin: '0 0 5px 0', color: '#e2e8f0'}}>{course.title}</h4>
              <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Code: {course.courseCode} | Credits: {course.credits}</p>
              <button className="action-btn" onClick={() => handleEnroll(course._id)}>
                Enroll Now
              </button>
              <hr />
            </div>
          ))}
        </div>

        {/* CARD 3: Assignments */}
        <div className="dashboard-card">
          <h3>Active Assignments</h3>
          {assignments.length === 0 ? <p>No pending assignments.</p> : assignments.map((assignment) => (
            <div key={assignment._id} style={{marginBottom: '15px'}}>
              <h4 style={{margin: '0 0 5px 0', color: '#e2e8f0'}}>{assignment.title}</h4>
              <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Due: {new Date(assignment.deadline).toLocaleDateString()}</p>
              <form onSubmit={(e) => handleSubmitAssignment(e, assignment._id)}>
                <input type="url" name="fileUrl" placeholder="Enter Submission URL" required className="dashboard-input" />
                <button type="submit" className="action-btn blue">Submit Work</button>
              </form>
              <hr />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;