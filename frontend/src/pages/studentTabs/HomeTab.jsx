// frontend/src/pages/studentTabs/HomeTab.jsx
import { useNavigate } from 'react-router-dom';

const HomeTab = ({ enrollments }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Participant';

  return (
    <div>
      {/* THE NEW WELCOME HEADER & STATS BANNER */}
      <h1 className="welcome-header">Hi, {userName}! 👋</h1>
      
      <div className="stats-banner">
        <div className="stat-item">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          </div>
          <div className="stat-text">
            <h2>{enrollments.length}</h2>
            <p>Courses Enrolled</p>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="stat-text">
            <h2>0</h2>
            <p>Courses Completed</p>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <div className="stat-text">
            <h2>0</h2>
            <p>Activities Completed</p>
          </div>
        </div>

        <div className="stat-item" style={{ borderRight: 'none' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="stat-text">
            <h2>0</h2>
            <p>Activities Due</p>
          </div>
        </div>
      </div>

      {/* LOWERED ENROLLED COURSES SECTION */}
      <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '20px' }}>Current Semester</h2>
      
      {enrollments.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No courses enrolled for the current semester.</p>
      ) : (
        enrollments.map((enr) => (
          <div 
            key={enr._id} 
            className="horizontal-card"
            onClick={() => navigate(`/student/course/${enr.course._id}`)}
          >
            <div className="card-info">
              <h3>{enr.course.title} - {enr.course.courseCode}</h3>
              <p>Teacher: {enr.course.teacherName || 'Prof. Zubair Sultan'} &nbsp;&bull;&nbsp; Timing: {enr.course.timing || 'Mon 9:00 AM'}</p>
            </div>
            <div className="card-action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HomeTab;