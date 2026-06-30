// frontend/src/pages/TeacherDashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  
  const [schedule, setSchedule] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  const [activeAttendanceCourse, setActiveAttendanceCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const rosterRef = useRef(null);

  useEffect(() => {
    if (activeAttendanceCourse && rosterRef.current) {
      rosterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeAttendanceCourse]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName') || 'Trainer';

      if (!token || role !== 'teacher') return navigate('/');
      setUserName(name);

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [scheduleRes, submissionsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/teacher/timetable', config),
          axios.get('http://localhost:5000/api/teacher/submissions', config)
        ]);
        
        setSchedule(scheduleRes.data);
        setSubmissions(submissionsRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load trainer data.');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreateAssignment = async (e, courseId) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/teacher/assignment', {
        courseId, title, description: "Please upload your submission.", deadline
      }, config);
      alert('Assignment Slot created successfully!');
      setTitle(''); setDeadline('');
    } catch (error) {
      alert('Error creating assignment');
    }
  };

  const handleGradeSubmission = async (e, submissionId) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/teacher/submission/${submissionId}/grade`, {
        grade: grades[submissionId],
        teacherFeedback: feedbacks[submissionId] || 'Good work.'
      }, config);
      
      alert('Grade saved successfully!');
      setSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { ...sub, grade: grades[submissionId], teacherFeedback: feedbacks[submissionId] } : sub
      ));
    } catch (error) {
      alert('Error saving grade');
    }
  };

  const handleOpenAttendance = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/teacher/course/${courseId}/students`, config);
      setRoster(data);
      setActiveAttendanceCourse(courseId); 
    } catch (error) {
      alert('Error fetching class roster');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/teacher/attendance', {
        courseId: activeAttendanceCourse,
        studentId,
        status 
      }, config);
      
      alert(`Marked ${status}!`);
    } catch (error) {
      alert('Error saving attendance');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><h2>Loading Portal...</h2></div>;
  if (error) return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><h2 style={{color: '#ef4444'}}>{error}</h2></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Trainer Portal: <span className="highlight-blue">{userName}</span></h1>
        <button className="logout-btn" onClick={handleLogout}>Secure Logout</button>
      </header>

      <div className="dashboard-grid">
        
        {/* CARD 1: My Classes & Assignments */}
        <div className="dashboard-card">
          <h3>Assigned Classes</h3>
          {schedule.length === 0 ? <p>No classes assigned.</p> : schedule.map((slot) => (
            <div key={slot._id} style={{marginBottom: '20px'}}>
              <h4 style={{margin: '0 0 5px 0', color: '#e2e8f0'}}>{slot.course.title}</h4>
              <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Room: {slot.roomNo} | {slot.dayOfWeek}</p>
              
              <button className="action-btn blue" onClick={() => handleOpenAttendance(slot.course._id)}>
                Open Attendance Roster
              </button>

              <div style={{marginTop: '15px'}}>
                <h5 style={{margin: '0 0 10px 0', color: '#94a3b8'}}>Create Assignment Slot</h5>
                <form onSubmit={(e) => handleCreateAssignment(e, slot.course._id)}>
                  <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="dashboard-input" />
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="dashboard-input" />
                  <button type="submit" className="action-btn">Publish to Class</button>
                </form>
              </div>
              <hr />
            </div>
          ))}
        </div>

        {/* CARD 2: Submissions to Grade */}
        <div className="dashboard-card">
          <h3>Submissions to Grade</h3>
          {submissions.length === 0 ? <p>No student submissions yet.</p> : submissions.map((sub) => (
            <div key={sub._id} style={{marginBottom: '15px'}}>
              <h4 style={{margin: '0 0 5px 0', color: '#e2e8f0'}}>{sub.assignment.title}</h4>
              <p style={{margin: '0 0 10px 0', fontSize: '0.9rem'}}>Student: {sub.student.name}</p>
              <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{color: '#3498db', fontSize: '0.9rem', display: 'block', marginBottom: '10px'}}>View Work</a>

              {sub.grade ? (
                <div style={{padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '5px'}}>
                  <p style={{margin: 0, color: '#10b981'}}>Grade: {sub.grade}/100</p>
                </div>
              ) : (
                <form onSubmit={(e) => handleGradeSubmission(e, sub._id)}>
                  <input type="number" placeholder="Grade (0-100)" required value={grades[sub._id] || ''} onChange={(e) => setGrades({ ...grades, [sub._id]: e.target.value })} className="dashboard-input" />
                  <input type="text" placeholder="Feedback" value={feedbacks[sub._id] || ''} onChange={(e) => setFeedbacks({ ...feedbacks, [sub._id]: e.target.value })} className="dashboard-input" />
                  <button type="submit" className="action-btn blue">Submit Grade</button>
                </form>
              )}
              <hr />
            </div>
          ))}
        </div>

        {/* CARD 3: Live Attendance Roster */}
        {activeAttendanceCourse && (
          <div className="dashboard-card" ref={rosterRef} style={{borderColor: '#3498db'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{color: '#3498db', margin: 0}}>Live Roster</h3>
              <button onClick={() => setActiveAttendanceCourse(null)} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>Close</button>
            </div>
            
            {roster.length === 0 ? <p>No students enrolled.</p> : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((enrollment) => (
                    <tr key={enrollment._id}>
                      <td>{enrollment.student.name}</td>
                      <td>
                        <button onClick={() => handleMarkAttendance(enrollment.student._id, 'Present')} style={{padding: '5px 10px', background: '#10b981', border: 'none', color: 'white', borderRadius: '3px', marginRight: '5px', cursor: 'pointer'}}>P</button>
                        <button onClick={() => handleMarkAttendance(enrollment.student._id, 'Absent')} style={{padding: '5px 10px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer'}}>A</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;