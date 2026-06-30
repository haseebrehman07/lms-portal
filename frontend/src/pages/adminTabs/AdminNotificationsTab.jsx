// frontend/src/pages/adminTabs/AdminNotificationsTab.jsx
import { useState } from 'react';
import axios from 'axios';

const AdminNotificationsTab = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill in both the title and the message.');
      return;
    }

    setIsSending(true);
    const token = localStorage.getItem('token');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { title, message };

      const response = await axios.post('http://localhost:5000/api/admin/notify/all', payload, config);
      
      alert(response.data.message || 'Broadcast sent successfully!');
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Broadcast failed:', error);
      alert('Error sending broadcast: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h1 className="welcome-header">Global Communications</h1>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        Broadcast urgent announcements, fee reminders, or portal updates to all enrolled students instantly.
      </p>

      <div className="dashboard-card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleBroadcast}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '500' }}>
              Notification Title
            </label>
            <input
              type="text"
              className="dashboard-input"
              placeholder="e.g., URGENT: Fee Deadline Extension"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: '500' }}>
              Message Content
            </label>
            <textarea
              className="dashboard-input"
              style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Type your announcement details here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="action-btn"
            disabled={isSending}
            style={{
              background: '#3b82f6',
              cursor: isSending ? 'not-allowed' : 'pointer',
              width: '100%',
            }}
          >
            {isSending ? 'Transmitting Broadcast...' : '📣 Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminNotificationsTab;