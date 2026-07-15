import { useState } from 'react';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Grade Posted', time: '2 hours ago', unread: true, msg: 'Your grade for Software Engineering Midterm has been released.' },
    { id: 2, title: 'Attendance Warning', time: '1 day ago', unread: true, msg: 'Your attendance in Database Systems is below 75%.' },
    { id: 3, title: 'Assignment Deadline', time: '2 days ago', unread: false, msg: 'Reminder: Excel Quiz is due tomorrow at 11:59 PM.' },
    { id: 4, title: 'System Update', time: '3 days ago', unread: false, msg: 'The portal will be under maintenance on Sunday.' }
  ]);

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header & Clear All Button */}
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.length > 0 && (
          <button 
            onClick={() => setNotifications([])}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium underline"
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
                <p className="text-sm text-gray-600 mt-0.5">{n.msg}</p>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => dismissNotification(n.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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