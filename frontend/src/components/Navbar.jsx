// frontend/src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';

const Navbar = ({ roleTitle }) => {
  const navigate = useNavigate();
  
  // Pull the name we just saved in Step 1
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear(); // Clears token, role, and name all at once
    navigate('/');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.brand}>
        <span style={styles.logo}>🎓</span>
        <h2 style={styles.title}>LMS Portal</h2>
        <span style={styles.badge}>{roleTitle} Mode</span>
      </div>

      <div style={styles.profile}>
        <span style={styles.greeting}>Welcome back, <strong>{userName}</strong></span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px 30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '15px' },
  logo: { fontSize: '1.8rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' },
  badge: { backgroundColor: '#34495e', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#ecf0f1', border: '1px solid #7f8c8d' },
  profile: { display: 'flex', alignItems: 'center', gap: '20px' },
  greeting: { fontSize: '1rem' },
  logoutBtn: { padding: '8px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }
};

export default Navbar;