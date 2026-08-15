import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Loader2, BookOpen, LineChart, Award } from 'lucide-react';
import api from '../api/axiosConfig';
import './Login.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loginResponse = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('token', loginResponse.data.access_token);
      
      const userResponse = await api.get('/auth/me');
      const user = userResponse.data;
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('role', user.role);

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (error) {
      console.error(error);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-split-card">
        
        {/* Left Side: Branding & Info */}
        <div className="login-left-panel">
          <div className="login-left-content">
            {/* Logo */}
            <div className="logo-container">
              <img 
                src="https://pub-9ef90a63c4e64bdb9430fa540ae45e34.r2.dev/logo/ChatGPT%20Image%20Aug%205%2C%202026%2C%2001_08_27%20PM%20(1)%20(1).png" 
                alt="Tech Titan Logo" 
                className="brand-logo" 
              />
            </div>

            {/* Typography */}
            <div className="brand-text">
              <h1 className="brand-heading">
                Learn. Grow.<br />
                <span className="brand-heading-highlight">Lead the Future.</span>
              </h1>
              <p className="brand-subheading">
                Welcome to Tech Titans LMS <br></br> Your all-in-one learning platform.
              </p>
            </div>

            {/* Removed the <img> from the placeholder; CSS ::before handles it now */}
            <div className="illustration-placeholder"></div>

            {/* Bottom Features */}
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon-wrapper"><BookOpen size={20} /></div>
                <span>Smart Learning</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><LineChart size={20} /></div>
                <span>Track Progress</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><Award size={20} /></div>
                <span>Achieve More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Welcome Back!</h2>
              <p>Login to continue to Tech Titan LMS</p>
            </div>
            
            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>Email or Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter your email or username"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="eye-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="forgot-password-row">
                  <button 
                    type="button" 
                    onClick={() => navigate('/forgot-password')} 
                    className="forgot-link"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Login'}
              </button>
            </form>
          </div>

          <div className="login-footer">
            <p>© 2026 Tech Titan LMS. All rights reserved.</p>
            <div className="footer-links">
              <span>Privacy Policy</span>
              <span className="separator">|</span>
              <span>Terms of Service</span>
              <span className="separator">|</span>
              <span>Help Center</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;