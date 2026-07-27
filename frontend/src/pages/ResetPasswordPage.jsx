import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  console.log("Extracted Token:", token); // This grabs the token from ?token=xxx
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage({ text: 'Invalid or missing reset link.', type: 'error' });
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) return;

    // Frontend validation: Check if passwords match before sending
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsLoading(true);
    // Clear any previous error messages when starting a valid request
    setMessage({ text: '', type: '' }); 
    
    try {
      // Sends only the token and the final validated password to the backend
      await api.post('/auth/reset-password', { 
        token: token, 
        new_password: newPassword 
      });
      alert('Password updated! Redirecting to login.');
      navigate('/login');
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.detail || 'Reset failed.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">Set New Password</h2>
        
        {message.text && (
          <p className={`mb-4 text-sm text-center ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message.text}
          </p>
        )}

        {token && (
          <form onSubmit={handleReset} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter new password" 
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
            
            {/* Added Confirm Password Input */}
            <input 
              type="password" 
              placeholder="Confirm new password" 
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
            
            <button 
              disabled={isLoading || !token} 
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;