import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Video, FileText, HelpCircle, Trash2, Edit2, GripVertical, Check, Upload, Loader2, PlayCircle, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axiosConfig';

// Helper to format raw seconds into standard MM:SS display
const formatDuration = (seconds) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AdminCourseBuilder = ({ course, onBack }) => {
  // --- STATE ---
  const [weeks, setWeeks] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [activeWeekId, setActiveWeekId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null); 

  const [isSaving, setIsSaving] = useState(false);

  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    type: 'video',
    videoUrl: '',
    pdfUrl: '',
    thumbnailUrl: '', // NEW: Lesson Thumbnail State
    content: '', 
    quizPassingScore: 70,
    questions: [
      { question: '', options: ['', '', '', ''], correct_option: 0 }
    ]
  });
  
  const [isUploading, setIsUploading] = useState(false);

  // ─── FETCH EXISTING CURRICULUM ON MOUNT ──────────────────────────────────
  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!course?.id) return;
      setIsInitialLoading(true);

      try {
        const res = await api.get(`/courses/${course.id}/modules`);
        const modulesData = res.data;

        const loadedWeeks = await Promise.all(modulesData.map(async (mod) => {
          const loadedLessons = await Promise.all((mod.lessons || []).map(async (lesson) => {
            let quizData = null;
            if (lesson.lesson_type === 'quiz') {
              try {
                const quizRes = await api.get(`/lessons/${lesson.id}/quiz`);
                quizData = {
                  passing_score: quizRes.data.passing_score,
                  questions: quizRes.data.questions || [{ question: '', options: ['', '', '', ''], correct_option: 0 }]
                };
              } catch (err) {
                console.error(`Failed to load quiz for lesson ${lesson.id}`);
              }
            }

            return {
              id: lesson.id,
              title: lesson.title,
              type: lesson.lesson_type === 'pdf' ? 'document' : lesson.lesson_type, 
              video_url: lesson.video_url || '',
              pdf_url: lesson.pdf_url || '',
              thumbnail_url: lesson.thumbnail_url || '', // Fetch existing thumbnail
              content: lesson.content || '',
              duration_seconds: lesson.duration_seconds || 0,
              quiz_data: quizData
            };
          }));

          return {
            id: mod.id,
            title: mod.title,
            lessons: loadedLessons
          };
        }));

        setWeeks(loadedWeeks);
      } catch (error) {
        console.error("Failed to fetch curriculum:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchCurriculum();
  }, [course.id]);
  // ────────────────────────────────────────────────────────────────────────────

  // --- HANDLERS ---
  const handleAddWeek = () => {
    if (!newWeekTitle.trim()) return;
    const newWeek = {
      id: `temp-week-${Date.now()}`,
      title: newWeekTitle,
      lessons: []
    };
    setWeeks([...weeks, newWeek]);
    setNewWeekTitle('');
    setIsWeekModalOpen(false);
  };

  const handleOpenLessonModal = (weekId) => {
    setActiveWeekId(weekId);
    setEditingLessonId(null);
    setLessonForm({ 
      title: '', 
      type: 'video', 
      videoUrl: '', 
      pdfUrl: '', 
      thumbnailUrl: '',
      content: '',
      quizPassingScore: 70,
      questions: [{ question: '', options: ['', '', '', ''], correct_option: 0 }] 
    });
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (weekId, lesson) => {
    setActiveWeekId(weekId);
    setEditingLessonId(lesson.id);
    
    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      videoUrl: lesson.video_url || '',
      pdfUrl: lesson.pdf_url || '',
      thumbnailUrl: lesson.thumbnail_url || '',
      content: lesson.content || '',
      quizPassingScore: lesson.quiz_data?.passing_score || 70,
      questions: lesson.quiz_data?.questions || [{ question: '', options: ['', '', '', ''], correct_option: 0 }]
    });
    
    setIsLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setIsLessonModalOpen(false);
    setEditingLessonId(null);
  };

  const handleFileUpload = async (e, uploadType) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      if (uploadType === 'video') endpoint = '/uploads/video';
      else if (uploadType === 'document') endpoint = '/uploads/pdf';
      else endpoint = '/uploads/thumbnail'; // New endpoint for the image

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadType === 'video') {
        setLessonForm(prev => ({ ...prev, videoUrl: res.data.url }));
      } else if (uploadType === 'document') {
        setLessonForm(prev => ({ ...prev, pdfUrl: res.data.url }));
      } else {
        setLessonForm(prev => ({ ...prev, thumbnailUrl: res.data.url }));
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Upload failed. Check file size and type.');
    } finally {
      setIsUploading(false);
    }
  };

  const addQuizQuestion = () => {
    setLessonForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correct_option: 0 }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...lessonForm.questions];
    newQuestions[index][field] = value;
    setLessonForm({ ...lessonForm, questions: newQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const newQuestions = [...lessonForm.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setLessonForm({ ...lessonForm, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = lessonForm.questions.filter((_, i) => i !== index);
    setLessonForm({ ...lessonForm, questions: newQuestions });
  };

  const handleAddOrUpdateLesson = () => {
    if (!lessonForm.title.trim()) return;
    
    const lessonData = {
      id: editingLessonId || `temp-lesson-${Date.now()}`,
      title: lessonForm.title,
      type: lessonForm.type,
      video_url: lessonForm.videoUrl,
      pdf_url: lessonForm.pdfUrl,
      thumbnail_url: lessonForm.thumbnailUrl, // Attached to temporary lesson data
      content: lessonForm.content,
      duration_seconds: 0, // In a real app, you'd extract video metadata here
      quiz_data: lessonForm.type === 'quiz' ? {
        passing_score: lessonForm.quizPassingScore,
        questions: lessonForm.questions
      } : null
    };

    setWeeks(weeks.map(week => {
      if (week.id === activeWeekId) {
        if (editingLessonId) {
          return {
            ...week,
            lessons: week.lessons.map(l => l.id === editingLessonId ? lessonData : l)
          };
        } else {
          return { ...week, lessons: [...week.lessons, lessonData] };
        }
      }
      return week;
    }));
    
    closeLessonModal();
  };

  const handleDeleteWeek = (weekId) => {
    setWeeks(weeks.filter(w => w.id !== weekId));
  };

  // --- SAVE CONTENT TO DB ---
  const handleSaveCurriculum = async () => {
    if (weeks.length === 0) {
      alert('Please add at least one week before saving.');
      return;
    }

    setIsSaving(true);

    try {
      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const week = weeks[weekIndex];
        let moduleId = week.id;

        // 1. MODULE SAVING LOGIC
        if (week.id.toString().startsWith('temp-')) {
          const moduleRes = await api.post(`/courses/${course.id}/modules`, {
            title: week.title,
            order_index: weekIndex
          });
          moduleId = moduleRes.data.id;
        } else {
          try {
            await api.patch(`/modules/${moduleId}`, {
              title: week.title,
              order_index: weekIndex
            });
          } catch (err) {
            console.warn("Update module failed.");
          }
        }

        // 2. LESSON SAVING LOGIC
        for (let lessonIndex = 0; lessonIndex < week.lessons.length; lessonIndex++) {
          const lesson = week.lessons[lessonIndex];
          const lessonType = lesson.type === 'document' ? 'pdf' : lesson.type;

          if (lesson.id.toString().startsWith('temp-')) {
            const lessonRes = await api.post(`/courses/${course.id}/lessons`, {
              title: lesson.title,
              lesson_type: lessonType,
              module_id: moduleId,
              order_index: lessonIndex,
              video_url: lesson.video_url || null,
              pdf_url: lesson.pdf_url || null,
              thumbnail_url: lesson.thumbnail_url || null, // Sent to backend
              content: lesson.content || null,
              duration_seconds: 0
            });
            const lessonId = lessonRes.data.id;

            if (lessonType === 'quiz' && lesson.quiz_data) {
              await api.post(`/lessons/${lessonId}/quiz`, {
                title: `${lesson.title} Quiz`,
                passing_score: parseInt(lesson.quiz_data.passing_score) || 70,
                questions: lesson.quiz_data.questions.map(q => ({
                  question: q.question,
                  options: q.options,
                  correct_option: q.correct_option
                }))
              });
            }
          } else {
            try {
              await api.patch(`/lessons/${lesson.id}`, {
                title: lesson.title,
                order_index: lessonIndex,
                video_url: lesson.video_url || null,
                pdf_url: lesson.pdf_url || null,
                thumbnail_url: lesson.thumbnail_url || null, // Sent to backend
                content: lesson.content || null
              });
            } catch (err) {
              console.warn("Update lesson failed.");
            }
          }
        }
      }

      alert('Curriculum saved successfully!');
      onBack();

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Failed to save curriculum. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading Course Curriculum...</p>
      </div>
    );
  }

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
        <button
          onClick={handleSaveCurriculum}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer flex items-center gap-2 disabled:bg-blue-400"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Curriculum</>}
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

              {/* UPDATED: Cinematic 16:9 Lesson Rendering */}
              <div className="px-4 py-2 space-y-2">
                {week.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex gap-4 p-2 rounded-xl transition-colors hover:bg-gray-50 group border border-transparent hover:border-gray-100">
                    
                    {/* Thumbnail Section */}
                    <div className="relative w-32 sm:w-40 aspect-video bg-gray-900 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                      {(lesson.thumbnail_url || course.thumbnail_url) ? (
                        <img 
                          src={lesson.thumbnail_url || course.thumbnail_url} 
                          alt={lesson.title} 
                          className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        {lesson.type === 'video' ? <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" /> : 
                         lesson.type === 'quiz' ? <HelpCircle className="w-8 h-8 text-white drop-shadow-lg" /> : 
                         <FileText className="w-8 h-8 text-white drop-shadow-lg" />}
                      </div>

                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider backdrop-blur-sm">
                        {lesson.type === 'video' ? formatDuration(lesson.duration_seconds) : lesson.type === 'quiz' ? 'QUIZ' : 'PDF'}
                      </div>
                    </div>
                    
                    {/* Text Data Section */}
                    <div className="flex flex-col py-1 flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 leading-snug truncate pr-4">
                        {lesson.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-medium capitalize">
                        <span>{lesson.type === 'document' ? 'PDF Material' : lesson.type} Lesson</span>
                      </div>
                    </div>
                    
                    {/* Edit Button */}
                    <div className="flex items-center justify-center pr-2">
                      <button 
                        onClick={() => handleEditLesson(week.id, lesson)} 
                        className="p-2.5 text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm cursor-pointer"
                        title="Edit Lesson"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                  </div>
                ))}

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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6"
              value={newWeekTitle}
              onChange={(e) => setNewWeekTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWeek()}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsWeekModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddWeek} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Add Week</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLessonId ? 'Edit Course Content' : 'Add Course Content'}
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <div className="flex gap-2">
                  {['video', 'document', 'quiz'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setLessonForm({...lessonForm, type})}
                      className={`flex-1 py-2.5 capitalize rounded-lg font-medium text-sm border transition-colors cursor-pointer ${lessonForm.type === type ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {type === 'document' ? 'PDF Document' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                <input 
                  type="text" 
                  placeholder={`e.g. ${lessonForm.type === 'video' ? 'Lecture 1: The Basics' : lessonForm.type === 'quiz' ? 'Midterm Exam' : 'Reading Assignment'}`} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                />
              </div>

              {/* VIDEO UPLOAD & THUMBNAIL (Split UI for Video) */}
              {lessonForm.type === 'video' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Video File */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                    <label className={`flex flex-col items-center justify-center p-4 h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${lessonForm.videoUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <Upload className={`w-6 h-6 mb-2 ${lessonForm.videoUrl ? 'text-green-600' : 'text-gray-400'}`} />}
                      <span className={`text-xs font-medium text-center px-2 ${lessonForm.videoUrl ? 'text-green-700' : 'text-gray-600'}`}>
                        {isUploading ? 'Uploading...' : lessonForm.videoUrl ? 'Video Ready' : 'Upload MP4 / WebM'}
                      </span>
                      <input type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={isUploading} />
                    </label>
                  </div>
                  
                  {/* Thumbnail Cover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Thumbnail (16:9)</label>
                    <label className={`relative overflow-hidden flex flex-col items-center justify-center p-4 h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${lessonForm.thumbnailUrl ? 'border-blue-300 bg-black' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                      {lessonForm.thumbnailUrl ? (
                        <>
                          <img src={lessonForm.thumbnailUrl} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <span className="relative z-10 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Change Cover</span>
                        </>
                      ) : (
                        <>
                          {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <ImageIcon className="w-6 h-6 mb-2 text-gray-400" />}
                          <span className="text-xs font-medium text-center text-gray-600">
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                          </span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              )}

              {/* PDF UPLOAD */}
              {lessonForm.type === 'document' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
                  <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${lessonForm.pdfUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <FileText className={`w-8 h-8 ${lessonForm.pdfUrl ? 'text-green-600' : 'text-gray-400'}`} />}
                    <span className={`text-sm font-medium ${lessonForm.pdfUrl ? 'text-green-700' : 'text-gray-600'}`}>
                      {isUploading ? 'Uploading...' : lessonForm.pdfUrl ? 'PDF Uploaded Successfully (Click to Replace)' : 'Click to Upload PDF'}
                    </span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} disabled={isUploading} />
                  </label>
                </div>
              )}

              {/* QUIZ BUILDER */}
              {lessonForm.type === 'quiz' && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Passing Score (%)</span>
                      <input 
                        type="number" min="0" max="100" 
                        value={lessonForm.quizPassingScore}
                        onChange={(e) => setLessonForm({...lessonForm, quizPassingScore: e.target.value})}
                        className="w-20 p-1.5 border border-gray-300 rounded text-center text-sm"
                      />
                    </div>
                  </div>

                  {lessonForm.questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative">
                      {lessonForm.questions.length > 1 && (
                        <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="mb-4 pr-8">
                        <input 
                          type="text" placeholder={`Question ${qIndex + 1}`}
                          value={q.question} onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-md">
                            <input 
                              type="radio" 
                              name={`correct-${qIndex}`} 
                              checked={q.correct_option === optIndex}
                              onChange={() => updateQuestion(qIndex, 'correct_option', optIndex)}
                              className="w-4 h-4 text-blue-600 cursor-pointer"
                            />
                            <input 
                              type="text" placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              value={opt} onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                              className="flex-1 text-sm outline-none border-b border-transparent focus:border-gray-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={addQuizQuestion}
                    className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    + Add Another Question
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white">
              <button onClick={closeLessonModal} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer">Cancel</button>
              <button 
                onClick={handleAddOrUpdateLesson} 
                disabled={isUploading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:bg-blue-400"
              >
                Save Content
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCourseBuilder;