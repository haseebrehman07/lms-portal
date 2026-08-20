import React from 'react';
import { 
  LayoutDashboard, BookOpen, Route, Calendar, Award, 
  MessageSquare, Users, Bell, Settings, ClipboardCheck, 
  FileBarChart, Megaphone, CheckSquare, UserCheck, Receipt, LogOut, Clock3, CreditCard
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ role = 'student' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const adminLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Enrollments', icon: ClipboardCheck, path: '/admin/enrollments' },
    //{ name: 'Training Schedule', icon: Clock3, path: '/admin/schedule'},
    { name: 'Attendance', icon: UserCheck, path: '/admin/attendance' },
    { name: 'Reports', icon: FileBarChart, path: '/admin/reports' },
    { name: 'Certificates', icon: Award, path: '/admin/certificates' },
    { name: 'Fees & Ledger', icon: CreditCard, path: '/admin/fees' }, // NEW ADMIN FEES TAB
    { name: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
    //{ name: 'Settings', icon: Settings, path: '/admin/settings' },
    { name: 'Group Chat', icon: MessageSquare, path: '/admin/chat' },
  ];

  const studentLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { name: 'My courses', icon: BookOpen, path: '/student/courses' },
   // { name: 'Gradebook', icon: CheckSquare, path: '/student/gradebook' },
   // { name: 'Learning', icon: Route, path: '/student/learning' },
    { name: 'Attendance', icon: UserCheck, path: '/student/attendance' },
   // { name: 'Calendar', icon: Calendar, path: '/student/timetable' },
    { name: 'Certificates', icon: Award, path: '/student/certificates' },
    { name: 'Notifications', icon: Bell, path: '/student/notifications' },
    { name: 'Fees', icon: Receipt, path: '/student/fees' }, // UNCOMMENTED STUDENT FEES TAB
    { name: 'Group Chat', icon: MessageSquare, path: '/student/chat' },
  ];

  const navItems = role === 'admin' ? adminLinks : studentLinks;
  
  // Theme Toggle based on role
  const isAdmin = role === 'admin';
  const sidebarBg = isAdmin ? 'bg-[#0f172a]' : 'bg-white border-r border-gray-100';
  const textColor = isAdmin ? 'text-slate-300' : 'text-gray-500';
  const hoverBg = isAdmin ? 'hover:bg-slate-800' : 'hover:bg-blue-50';
  const hoverText = isAdmin ? 'hover:text-white' : 'hover:text-blue-600';
  const logoText = isAdmin ? 'text-white' : 'text-gray-900';

  return (
    <div className={`w-64 flex flex-col h-full shadow-sm z-10 hidden md:flex transition-colors ${sidebarBg}`}>
      
      {/* Logo Area */}
      <div className={`h-20 flex items-center px-6 border-b ${isAdmin ? 'border-slate-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600 bg-opacity-20">
            <BookOpen className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <h2 className={`text-xl font-bold m-0 tracking-tight ${logoText}`}>
              HR LMS
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin' || item.path === '/student'} 
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : `${textColor} ${hoverBg} ${hoverText}`
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`p-4 border-t ${isAdmin ? 'border-slate-800' : 'border-gray-100'}`}>
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            isAdmin ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;