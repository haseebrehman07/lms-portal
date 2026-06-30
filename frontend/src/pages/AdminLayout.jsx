// frontend/src/pages/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* ADMIN SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ margin: 0, color: 'white' }}>TechTitans <span style={{ color: '#06b6d4' }}>Admin</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '5px 0 0 0', textTransform: 'uppercase' }}>Control Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({isActive}) => isActive ? "nav-item active-admin" : "nav-item"}>Allocations</NavLink>
          <NavLink to="/admin/fees" className={({isActive}) => isActive ? "nav-item active-admin" : "nav-item"}>Fee Verification</NavLink>
          <NavLink to="/admin/reports" className={({isActive}) => isActive ? "nav-item active-admin" : "nav-item"}>System Reports</NavLink>
          <NavLink to="/admin/notifications" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Send Notifications</NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* ADMIN MAIN CONTENT */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;