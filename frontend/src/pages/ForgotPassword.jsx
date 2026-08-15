import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, BookOpen, LineChart, Award, ArrowLeft } from 'lucide-react';
import api from '../api/axiosConfig';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', type: '' });

    try {
      await api.post('/auth/forgot-password', { email });
      setStatus({ 
        message: 'If your email is registered, you will receive a reset link shortly.', 
        type: 'success' 
      });
    } catch (err) {
      setStatus({ 
        message: err.response?.data?.detail || 'Something went wrong. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-split-card">
        
        {/* Left Side: Branding */}
        <div className="login-left-panel">
          <div className="login-left-content">
            <div className="logo-container">
              <img 
                src="https://pub-9ef90a63c4e64bdb9430fa540ae45e34.r2.dev/logo/ChatGPT%20Image%20Aug%205%2C%202026%2C%2001_08_27%20PM%20(1)%20(1).png" 
                alt="Tech Titan Logo" 
                className="brand-logo" 
              />
            </div>
            <div className="brand-text">
              <h1 className="brand-heading">Learn. Grow.<br /><span className="brand-heading-highlight">Lead the Future.</span></h1>
              <p className="brand-subheading">Welcome to Tech Titan LMS - your all-in-one learning platform.</p>
            </div>
            <div className="illustration-placeholder"></div>
            <div className="brand-features">
              <div className="feature-item"><div className="feature-icon-wrapper"><BookOpen size={20} /></div><span>Smart Learning</span></div>
              <div className="feature-item"><div className="feature-icon-wrapper"><LineChart size={20} /></div><span>Track Progress</span></div>
              <div className="feature-item"><div className="feature-icon-wrapper"><Award size={20} /></div><span>Achieve More</span></div>
            </div>
          </div>
        </div>

        {/* Right Side: Forgot Password Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Reset Password</h2>
              <p>Enter your email to receive a secure reset link.</p>
            </div>
            
            {status.message && (
              <div className={status.type === 'error' ? 'error-banner' : ''} style={status.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px' } : {}}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleRequest} className="login-form">
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter your registered email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <button type="submit" disabled={isLoading} className="submit-btn">
                  {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Send Reset Link'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => navigate('/login')}
                  style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ArrowLeft size={18} /> Back to Login
                </button>
              </div>
            </form>
          </div>

          <div className="login-footer">
            <p>© 2026 Tech Titan LMS. All rights reserved.</p>
            <div className="footer-links">
              <span>Privacy Policy</span><span className="separator">|</span>
              <span>Terms of Service</span><span className="separator">|</span>
              <span>Help Center</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;