// frontend/src/pages/TeacherLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Reusing our beautiful global styles

const TeacherLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* SIDE NAVIGATION BAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ margin: 0, color: 'white' }}>TechTitans <span className="highlight-blue">LMS</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '5px 0 0 0', textTransform: 'uppercase' }}>Trainer Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          {/* Note the active styling uses the blue highlight class (if added to CSS) or inline styles */}
          <NavLink to="/teacher" end className={({isActive}) => isActive ? "nav-item active-blue" : "nav-item"}>Home</NavLink>
          <NavLink to="/teacher/submissions" className={({isActive}) => isActive ? "nav-item active-blue" : "nav-item"}>Submissions</NavLink>
          <NavLink to="/teacher/attendance" className={({isActive}) => isActive ? "nav-item active-blue" : "nav-item"}>Attendance Roster</NavLink>
          <NavLink to="/teacher/gradebook" className={({isActive}) => isActive ? "nav-item active-blue" : "nav-item"}>Final Gradebook</NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;