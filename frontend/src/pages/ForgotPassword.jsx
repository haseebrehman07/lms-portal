import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: '', type: '' }); // Clear previous messages

    try {
      // Sends exactly what auth.py expects: { "email": "user@example.com" }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleRequest} className="p-8 w-full max-w-sm mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
          <p className="text-sm text-gray-500">Enter your email to receive a reset link.</p>
        </div>

        {/* Dynamic Status Message */}
        {status.message && (
          <div className={`mb-5 p-3 text-sm rounded-lg text-center ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.message}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required 
          />
        </div>

        <div className="flex flex-col gap-3">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:bg-blue-400"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg transition-colors border border-gray-200"
          >
            Back to Login
          </button>
        </div>

      </form>
    </div>
  );
};

export default ForgotPassword;