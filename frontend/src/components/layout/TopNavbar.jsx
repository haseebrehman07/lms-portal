import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user')) || { name: 'Guest', role: 'visitor' };

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
        {/* Notifications */}
        <button 
          onClick={() => navigate(user.role === 'admin' || user.role === 'manager' ? '/admin/chat' : '/student/chat')}
          className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer mr-1"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate('/student/notifications')}
          className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            {/* 2. Inject the dynamic name and role */}
            <p className="text-sm font-bold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          
          {/* 3. Make the avatar dynamic based on the first letter of their name */}
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

    </header>
  );
};

export default TopNavbar;