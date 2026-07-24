import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Loader2 } from 'lucide-react'; // Assuming you use lucide-react for loading spinners

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        // Fetches announcements from the backend router
        const response = await api.get('/announcements');
        
        // Maps the backend AnnouncementResponse to the frontend structure
        const formattedNotifications = response.data.map((announcement) => {
          // Format the created_at datetime to a readable string
          const dateObj = new Date(announcement.created_at);
          const timeString = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          return {
            id: announcement.id,
            title: announcement.title,
            time: timeString,
            unread: true, // Defaulting incoming announcements to unread
            msg: announcement.body
          };
        });

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Note: Since the backend DELETE /announcements route is protected by require_admin, 
  // dismissing them here only clears them from the local UI state for this session.
  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header & Clear All Button */}
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.length > 0 && (
          <button 
            onClick={() => setNotifications([])}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`relative bg-white rounded-lg border p-3 shadow-sm flex gap-3 ${n.unread ? 'border-blue-200' : 'border-gray-200'}`}
            >
              {/* Red Dot (Only visible if unread) */}
              {n.unread && (
                <div className="absolute top-4 left-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
              
              {/* Content */}
              <div className="ml-4 flex-grow">
                <div className="flex justify-between items-center">
                  <h3 className={`text-sm font-bold ${n.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-gray-400">{n.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{n.msg}</p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => dismissNotification(n.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;