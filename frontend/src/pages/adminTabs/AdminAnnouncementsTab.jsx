import React, { useState } from 'react';
import { Plus, X, Megaphone, Clock, User, Send, Bell } from 'lucide-react';

const AdminAnnouncementsTab = () => {
  // Mock Data: Notification History
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Portal Maintenance Scheduled',
      message: 'The student portal will undergo routine maintenance this Saturday from 2:00 AM to 4:00 AM. Expect brief outages.',
      date: '2026-06-28T10:30:00',
      sentBy: 'Admin Team'
    },
    {
      id: 2,
      title: 'Course Registration Deadline Extended',
      message: 'Good news! The deadline for Fall 2026 course registration has been extended to July 15th. Please finalize your timetables.',
      date: '2026-07-01T09:15:00',
      sentBy: 'Registrar Office'
    },
    {
      id: 3,
      title: 'Welcome to the New Academic Year',
      message: 'Welcome back students! Ensure you have checked your updated fee vouchers and timetables in your respective tabs.',
      date: '2026-07-02T08:00:00',
      sentBy: 'Admin - Haseeb'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '' });
  const MAX_CHARS = 500;

  const openModal = () => {
    setFormData({ title: '', message: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSend = () => {
    if (!formData.title || !formData.message) return alert("Please fill in both fields.");
    
    const newAnnouncement = {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      date: new Date().toISOString(),
      sentBy: 'Admin' // In a real app, grab from localStorage
    };
    
    // Add to the top of the list (newest first)
    setAnnouncements([newAnnouncement, ...announcements]);
    closeModal();
  };

  // Format date helper
  const formatDateTime = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">Broadcast notifications to all enrolled students.</p>
        </div>
        <button 
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create
        </button>
      </div>

      {/* Notification History Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2 px-1 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          Notification History
        </h2>
        
        {announcements.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group hover:border-blue-200 transition-colors">
            {/* Left Accent border */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-xl"></div>
            
            <div className="p-6 pl-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(item.date)}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {item.message}
              </p>
              
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <User className="w-3.5 h-3.5" />
                Sent by: {item.sentBy}
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No announcements sent yet.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Announcement</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Heading</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Campus Closed Tomorrow"
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-gray-700">Notification Text</label>
                  <span className={`text-xs font-medium ${formData.message.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formData.message.length} / {MAX_CHARS}
                  </span>
                </div>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value.slice(0, MAX_CHARS)})}
                  placeholder="Type the announcement details here. This will be visible on all student dashboards..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSend}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
                Broadcast Now
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementsTab;