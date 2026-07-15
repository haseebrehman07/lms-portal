import React, { useState } from 'react';
import api from '../api/axiosConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('If your email is registered, you will receive a reset link shortly.');
    } catch (err) {
      setStatus('Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleRequest} className="p-8 max-w-sm mx-auto bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Reset Password</h2>
      <input 
        type="email" placeholder="Enter your email" 
        className="w-full p-2 border rounded mb-4"
        onChange={(e) => setEmail(e.target.value)} required 
      />
      <button className="w-full bg-blue-600 text-white py-2 rounded">Send Reset Link</button>
      {status && <p className="mt-4 text-sm text-center">{status}</p>}
    </form>
  );
};
export default ForgotPassword;