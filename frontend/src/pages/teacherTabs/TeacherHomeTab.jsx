// frontend/src/pages/teacherTabs/TeacherHomeTab.jsx
import { useNavigate } from 'react-router-dom';

const TeacherHomeTab = ({ schedule, submissions }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Trainer';

  const pendingGrades = submissions.filter(sub => !sub.grade).length;

  return (
    <div>
      <h1 className="welcome-header">Welcome back, Prof. {userName}</h1>
      
      {/* Metrics Banner */}
      <div className="stats-banner">
        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div className="stat-text">
            <h2>{schedule.length}</h2>
            <p>Assigned Classes</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="stat-text">
            <h2>{pendingGrades}</h2>
            <p>Pending Grades</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '20px' }}>My Assigned Classes</h2>
      
      {schedule.length === 0 ? <p style={{ color: '#94a3b8' }}>No classes assigned.</p> : schedule.map((slot) => (
        <div 
          key={slot._id} 
          className="horizontal-card"
          onClick={() => navigate(`/teacher/course/${slot.course._id}`)}
        >
          <div className="card-info">
            <h3>{slot.course.title} - {slot.course.courseCode}</h3>
            <p>Room: {slot.roomNo} &nbsp;&bull;&nbsp; Timing: {slot.dayOfWeek} ({slot.startTime} - {slot.endTime})</p>
          </div>
          <div className="card-action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherHomeTab;