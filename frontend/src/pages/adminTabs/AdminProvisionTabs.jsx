// frontend/src/pages/adminTabs/AdminProvisionTab.jsx
import { useState } from 'react';
import axios from 'axios';

const AdminProvisionTab = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('TechTitans2026!'); // A default password they can change later
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      // NOTE: Make sure this URL matches your live Render API!
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { name, email, password, role };

      const response = await axios.post('http://localhost:5000/api/admin/provision', payload, config);
      
      alert(response.data.message);
      
      // Clear form except default password
      setName('');
      setEmail('');
    } catch (error) {
      alert('Error creating account: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="welcome-header">User Provisioning</h1>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        Securely generate accounts for new students and faculty.
      </p>

      <div className="dashboard-card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleCreateUser}>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>Full Name</label>
            <input type="text" className="dashboard-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>Email Address</label>
            <input type="email" className="dashboard-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>Account Type</label>
            <select className="dashboard-input" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%' }}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px' }}>Temporary Password</label>
            <input type="text" className="dashboard-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="action-btn" disabled={isLoading} style={{ background: '#10b981', width: '100%' }}>
            {isLoading ? 'Generating...' : '🔐 Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProvisionTab;