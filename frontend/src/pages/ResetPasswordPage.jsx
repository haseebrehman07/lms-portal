import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, BookOpen, LineChart, Award } from 'lucide-react';
import api from '../api/axiosConfig';
import './Login.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage({ text: 'Invalid or missing secure reset link.', type: 'error' });
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' }); 
    
    try {
      await api.post('/auth/reset-password', { 
        token: token, 
        new_password: newPassword 
      });
      alert('Password updated! Redirecting to login.');
      navigate('/login');
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.detail || 'Reset failed. Your link may have expired.', 
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

        {/* Right Side: Reset Password Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Set New Password</h2>
              <p>Please enter your new secure password below.</p>
            </div>
            
            {message.text && (
              <div className={message.type === 'error' ? 'error-banner' : ''} style={message.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px' } : {}}>
                {message.text}
              </div>
            )}

            {token && (
              <form onSubmit={handleReset} className="login-form">
                
                <div className="input-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter new password"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm new password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="eye-btn">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading || !token} className="submit-btn" style={{ marginTop: '10px' }}>
                  {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Update Password'}
                </button>
              </form>
            )}
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

export default ResetPasswordPage;