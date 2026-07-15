import React, { useState } from 'react';
import { ArrowLeft, Plus, Video, FileText, HelpCircle, Trash2, Edit2, GripVertical, Check } from 'lucide-react';

const AdminCourseBuilder = ({ course, onBack }) => {
  // --- STATE ---
  // In the future, this will be populated by an API fetch!
  const [weeks, setWeeks] = useState([]);
  
  // Modal states
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [activeWeekId, setActiveWeekId] = useState(null); // Tracks which week we are adding a lesson to

  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video' });

  // --- HANDLERS ---
  const handleAddWeek = () => {
    if (!newWeekTitle.trim()) return;
    const newWeek = {
      id: `temp-${Date.now()}`,
      title: newWeekTitle,
      lessons: []
    };
    setWeeks([...weeks, newWeek]);
    setNewWeekTitle('');
    setIsWeekModalOpen(false);
  };

  const handleOpenLessonModal = (weekId) => {
    setActiveWeekId(weekId);
    setLessonForm({ title: '', type: 'video' });
    setIsLessonModalOpen(true);
  };

  const handleAddLesson = () => {
    if (!lessonForm.title.trim()) return;
    
    const newLesson = {
      id: `temp-lesson-${Date.now()}`,
      title: lessonForm.title,
      type: lessonForm.type
    };

    setWeeks(weeks.map(week => {
      if (week.id === activeWeekId) {
        return { ...week, lessons: [...week.lessons, newLesson] };
      }
      return week;
    }));
    
    setIsLessonModalOpen(false);
  };

  const handleDeleteWeek = (weekId) => {
    setWeeks(weeks.filter(w => w.id !== weekId));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Curriculum Builder</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Editing: {course.title}</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer flex items-center gap-2">
          <Check className="w-4 h-4" /> Save Curriculum
        </button>
      </div>

      {/* CURRICULUM AREA */}
      <div className="space-y-4">
        {weeks.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 border-dashed text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Your course is empty</h3>
            <p className="text-gray-500 mb-6">Start by adding your first week or module.</p>
            <button 
              onClick={() => setIsWeekModalOpen(true)}
              className="px-6 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              + Add Week / Module
            </button>
          </div>
        ) : (
          weeks.map((week, index) => (
            <div key={week.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Week Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                  <h2 className="text-lg font-bold text-gray-900">
                    <span className="text-blue-600 mr-2">Week {index + 1}:</span> 
                    {week.title}
                  </h2>
                </div>
                <button onClick={() => handleDeleteWeek(week.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons List */}
              <div className="p-4 space-y-2">
                {week.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${lesson.type === 'video' ? 'bg-blue-50 text-blue-500' : lesson.type === 'quiz' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                        {lesson.type === 'video' ? <Video className="w-4 h-4" /> : lesson.type === 'quiz' ? <HelpCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-gray-700">{lesson.title}</span>
                    </div>
                    <button className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer p-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Content Button */}
                <button 
                  onClick={() => handleOpenLessonModal(week.id)}
                  className="w-full py-3 mt-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Lesson or Quiz
                </button>
              </div>
            </div>
          ))
        )}

        {weeks.length > 0 && (
          <button 
            onClick={() => setIsWeekModalOpen(true)}
            className="w-full py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Add Another Week
          </button>
        )}
      </div>

      {/* --- MODALS --- */}
      {/* Week Modal */}
      {isWeekModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Week</h2>
            <input 
              type="text" 
              placeholder="e.g. Introduction to React" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-6"
              value={newWeekTitle}
              onChange={(e) => setNewWeekTitle(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsWeekModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleAddWeek} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer">Add Week</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Course Content</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <div className="flex gap-2">
                  {['video', 'document', 'quiz'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setLessonForm({...lessonForm, type})}
                      className={`flex-1 py-2 capitalize rounded-lg font-medium text-sm border transition-colors cursor-pointer ${lessonForm.type === type ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  placeholder={`e.g. ${lessonForm.type === 'video' ? 'Lecture 1: The Basics' : lessonForm.type === 'quiz' ? 'Midterm Exam' : 'Reading Assignment'}`} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleAddLesson} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer">Save Content</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCourseBuilder;