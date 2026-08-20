import React, { useState, useEffect } from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const TopNavbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user')) || { name: 'Guest', role: 'visitor' };
  
  const [hasUnread, setHasUnread] = useState(false);

  // Check if there are active unread announcements/notifications
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const res = await api.get('/announcements');
        // If announcements exist, show the indicator dot; otherwise hide it when cleared/read
        if (res.data && res.data.length > 0) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      } catch (err) {
        setHasUnread(false);
      }
    };
    checkUnreadNotifications();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      
      {/* Search Bar */}
      <div className="flex items-center w-96 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search for courses, users, etc..." 
          className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-400"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Chat Button */}
        <button 
          onClick={() => navigate(user.role === 'admin' || user.role === 'manager' ? '/admin/chat' : '/student/chat')}
          className="relative p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all cursor-pointer mr-1"
          title="Messages"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Beautified Notification Bell Button */}
        <button 
          onClick={() => {
            setHasUnread(false); // Clear red dot indicator on click
            navigate('/student/notifications');
          }}
          className="relative p-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all cursor-pointer group"
          title="Notifications"
        >
          <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
          
          {/* Dynamic Red Dot Badge: Disappears completely if cleared or read */}
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

    </header>
  );
};

export default TopNavbar;