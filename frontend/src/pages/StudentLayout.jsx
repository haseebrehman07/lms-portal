// frontend/src/pages/StudentLayout.jsx
import NotificationModal from '../components/NotificationModal';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const StudentLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* SIDE NAVIGATION BAR */}
      <NotificationModal />
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ margin: 0, color: 'white' }}>TechTitans <span className="highlight-green">LMS</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/student" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Home</NavLink>
          <NavLink to="/student/assignments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Assignments</NavLink>
          <NavLink to="/student/attendance" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Attendance</NavLink>
          <NavLink to="/student/enrollments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>New Enrollments</NavLink>
          <NavLink to="/student/fees" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Fee Management</NavLink>
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

export default StudentLayout;