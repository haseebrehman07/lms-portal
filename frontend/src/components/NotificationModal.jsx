// frontend/src/components/NotificationModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationModal = () => {
    console.log("🚨 NOTIFICATION MODAL IS ALIVE!");
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fetch unread messages the second this component loads
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('http://localhost:5000/api/student/notifications/unread', config);
        console.log("Mailbox data:", response.data);
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications');
      }
    };

    fetchNotifications();
  }, []);

  // 2. If there are no unread messages, render absolutely nothing!
  if (notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];

  // 3. Mark as read and move to the next message (if there are multiple)
  const handleAcknowledge = async () => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/student/notifications/${currentNotification._id}/read`, {}, config);

      if (currentIndex < notifications.length - 1) {
        setCurrentIndex(prev => prev + 1); // Show the next message
      } else {
        setNotifications([]); // All caught up, close the modal completely!
      }
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  // 4. The UI: A sleek, dark-themed overlay
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.85)', // Dark blur effect
      backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999 // Guarantees it stays on top of everything
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '24px', marginRight: '10px' }}>🔔</span>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>{currentNotification.title}</h2>
        </div>
        
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>
          {currentNotification.message}
        </p>
        
        <button 
          onClick={handleAcknowledge}
          style={{
            width: '100%', padding: '12px',
            background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px',
            fontSize: '1rem', fontWeight: 'bold',
            cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#2563eb'}
          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
        >
        Continue
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;