// frontend/src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; // Make sure the path matches where you saved the image
import './Login.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Send ONLY email and password to the backend. Let the database decide who they are!
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });

      // 2. Extract the true data from the backend's response
      const { token, role, name } = response.data;

      // 3. Save it to Local Storage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', name);

      // 4. The Smart Router: Teleport the user based on their TRUE database role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'teacher' || role === 'trainer') {
        navigate('/teacher');
      } else {
        navigate('/student'); // Default to student
      }

    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* NEW: TechTitans Logo */}
        <img src={logo} alt="TechTitans Logo" className="brand-logo" />
        
        <h2>LMS Portal Access</h2>

        <div className="role-toggle-container">
          <div className={`toggle-slider ${role}`}></div>
          <button 
            type="button" 
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            Participant
          </button>
          <button 
            type="button" 
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            Trainer
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="emailAddress">Email Address</label>
            <input
              type="email"
              id="emailAddress"
              name="emailAddress"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;