import React, { useState, useEffect } from 'react';
import { Plus, Settings, X, Upload, BookOpen, Calendar, AlertTriangle, CheckCircle, Award, RotateCcw, Clock, Trash2, CalendarOff } from 'lucide-react';
import api from '../../api/axiosConfig'; 
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';
import AdminCourseBuilder from './AdminCourseBuilder';

const AdminCoursesTab = () => {
  const [editingCourse, setEditingCourse] = useState(null);
  const [courses, setCourses] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  const [isUploading, setIsUploading] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Tab Management
  const [activeModalTab, setActiveModalTab] = useState('details'); // 'details' | 'schedule'

  // Cancellation State
  const [cancelledDates, setCancelledDates] = useState([]);
  const [cancelDateForm, setCancelDateForm] = useState({ date: '', reason: '' });
  
  const defaultFormState = { 
    id: null, title: '', instructor: '', timings: '', startDate: '', endDate: '', thumbnailUrl: '', 
    is_published: false, is_completed: false, attendance_enabled: false,
    session_days: [0, 6], // Defaulting to Sun/Sat
    attendance_cutoff_time: '', total_sessions: '', batch_start_date: ''
  };

  const [formData, setFormData] = useState(defaultFormState);

  const DAYS = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
  ];

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchCancelledDates = async (courseId) => {
    try {
      const res = await api.get(`/attendance/course/${courseId}/cancelled-dates`);
      setCancelledDates(res.data);
    } catch (error) {
      console.error("Failed to load cancelled dates:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let timer;
    if (isConfirmingDelete && deleteCountdown > 0) {
      timer = setTimeout(() => setDeleteCountdown(deleteCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isConfirmingDelete, deleteCountdown]);

  const openModal = (course = null) => {
    setIsConfirmingDelete(false);
    setDeleteCountdown(5);
    setActiveModalTab('details');

    if (course) {
      setFormData({ 
        id: course.id,
        title: course.title || '', 
        instructor: course.instructor_name || '', 
        timings: course.timings || '',
        startDate: course.start_date || '',
        endDate: course.end_date || '',
        thumbnailUrl: course.thumbnail_url || '',
        is_published: course.is_published || false,
        is_completed: course.is_completed || false,
        attendance_enabled: course.attendance_enabled || false,
        session_days: course.session_days || [0, 6],
        attendance_cutoff_time: course.attendance_cutoff_time || '',
        total_sessions: course.total_sessions || '',
        batch_start_date: course.batch_start_date || ''
      });
      fetchCancelledDates(course.id);
      setIsModalOpen(true);
    } else {
      setFormData(defaultFormState);
      setCancelledDates([]);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsConfirmingDelete(false);
    setDeleteCountdown(5);
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setRawImage(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    setIsUploading(true);
    try {
      const croppedImageFile = await getCroppedImg(rawImage, croppedAreaPixels);
      const uploadData = new FormData();
      uploadData.append('file', croppedImageFile);

      const res = await api.post('/uploads/thumbnail', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData({ ...formData, thumbnailUrl: res.data.url });
      setRawImage(null); 
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload cropped image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    const payload = {
      title: formData.title,
      instructor_name: formData.instructor, 
      timings: formData.timings,
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      thumbnail_url: formData.thumbnailUrl,
      attendance_enabled: formData.attendance_enabled,
      session_days: formData.session_days,
      attendance_cutoff_time: formData.attendance_cutoff_time || null,
      total_sessions: formData.total_sessions ? parseInt(formData.total_sessions) : null,
      batch_start_date: formData.batch_start_date || null
    };

    try {
      if (formData.id) {
        await api.patch(`/courses/${formData.id}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      await fetchCourses(); 
      closeModal();
    } catch (error) {
      console.error("Failed to save course:", error);
      alert("Error saving course. Check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    try {
      if(formData.id) {
        await api.delete(`/courses/${formData.id}`);
        await fetchCourses(); 
      }
      closeModal();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handlePublish = async () => {
    if (!formData.id) return;
    try {
      await api.post(`/courses/${formData.id}/publish`);
      alert("Course published successfully! It is now visible to students.");
      await fetchCourses();
      closeModal();
    } catch (error) {
      console.error("Failed to publish:", error);
      alert(error.response?.data?.detail || "Failed to publish course.");
    }
  };

  const handleToggleCompletion = async () => {
    if (!formData.id) return;
    const isCompleting = !formData.is_completed;
    const confirmMsg = isCompleting 
      ? "Are you sure you want to end this course? This will automatically mark ALL enrolled students as 'Completed'."
      : "Are you sure you want to revert this course to Active? This will change all student enrollments back to 'In Progress'.";
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/courses/${formData.id}/toggle-completion`);
      alert(`Course marked as ${isCompleting ? 'completed' : 'active'}!`);
      await fetchCourses();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update status.");
    }
  };

  const handleCancelDate = async (e) => {
    e.preventDefault();
    if (!cancelDateForm.date || !formData.id) return;
    try {
      await api.post(`/attendance/course/${formData.id}/cancel-date`, {
        date: cancelDateForm.date,
        reason: cancelDateForm.reason
      });
      setCancelDateForm({ date: '', reason: '' });
      await fetchCancelledDates(formData.id);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to cancel date.");
    }
  };

  const handleRestoreDate = async (cancellationId) => {
    if (!formData.id) return;
    try {
      await api.delete(`/attendance/course/${formData.id}/cancel-date/${cancellationId}`);
      await fetchCancelledDates(formData.id);
    } catch (error) {
      alert("Failed to restore date.");
    }
  };

  const toggleDay = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      session_days: prev.session_days.includes(dayValue)
        ? prev.session_days.filter(d => d !== dayValue)
        : [...prev.session_days, dayValue].sort((a, b) => a - b)
    }));
  };

  if (editingCourse) {
    return <AdminCourseBuilder course={editingCourse} onBack={() => setEditingCourse(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800 relative">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, update, and manage all portal courses.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group hover:border-blue-300 transition-colors cursor-pointer flex flex-col">
            
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold z-10 shadow-sm border ${
              course.is_completed ? 'bg-purple-100 text-purple-700 border-purple-200' :
              course.is_published ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
              'bg-orange-100 text-orange-700 border-orange-200'
            }`}>
              {course.is_completed ? 'Completed' : course.is_published ? 'Active' : 'Draft'}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); openModal(course); }}
              className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur text-gray-500 hover:text-blue-600 rounded-lg shadow border border-gray-100 z-10 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="aspect-[4/5] bg-gray-50 flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className={`w-full h-full object-cover transition-transform duration-500 ${course.is_completed ? 'opacity-80 grayscale-[20%]' : 'group-hover:scale-105'}`} />
              ) : (
                <BookOpen className="w-12 h-12 text-gray-300" />
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 leading-snug">{course.title}</h3>
              <p className="text-xs text-gray-500 font-medium mb-4">Instructor: {course.instructor_name || 'TBA'}</p>
              
              <div className="mt-auto">
                <button 
                  onClick={() => setEditingCourse(course)}
                  className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Edit Curriculum
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header & Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex justify-between items-center p-6 pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {isConfirmingDelete ? 'Confirm Deletion' : formData.id ? 'Course Settings' : 'Create New Course'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {!isConfirmingDelete && (
                <div className="flex gap-6 px-6">
                  <button 
                    onClick={() => setActiveModalTab('details')}
                    className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeModalTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    General Details
                  </button>
                  <button 
                    onClick={() => setActiveModalTab('schedule')}
                    className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeModalTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Schedule & Attendance
                  </button>
                </div>
              )}
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
              {isConfirmingDelete ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Are you absolutely sure?</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                    Deleting <span className="font-bold text-gray-900">"{formData.title}"</span> will erase all uploads, enrolled students, and assignment records. This action cannot be undone.
                  </p>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => { setIsConfirmingDelete(false); setDeleteCountdown(5); }}
                      className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={deleteCountdown > 0}
                      onClick={executeDelete}
                      className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                        deleteCountdown > 0 ? 'bg-red-300 cursor-not-allowed opacity-80' : 'bg-red-600 hover:bg-red-700 shadow-md cursor-pointer' 
                      }`}
                    >
                      {deleteCountdown > 0 ? `Yes, Delete (${deleteCountdown}s)` : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              ) : activeModalTab === 'details' ? (
                /* Details Tab */
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 flex flex-col items-center">
                    {rawImage ? (
                      <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
                        <div className="relative w-full aspect-[4/5] bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                          <Cropper image={rawImage} crop={crop} zoom={zoom} aspect={4 / 5} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                        </div>
                        <div className="px-2">
                          <label className="text-xs text-gray-500 mb-1 block font-medium">Zoom</label>
                          <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-blue-600" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setRawImage(null)} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors cursor-pointer">Cancel</button>
                          <button type="button" onClick={handleCropAndUpload} disabled={isUploading} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer disabled:bg-blue-400">
                            {isUploading ? 'Saving...' : 'Crop & Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="w-full aspect-[4/5] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-blue-400 transition-colors cursor-pointer group relative overflow-hidden">
                          {formData.thumbnailUrl ? (
                            <div className="w-full h-full relative group">
                              <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white font-medium text-sm drop-shadow-md">Click to change</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 group-hover:text-blue-500 transition-colors" />
                              <span className="text-sm font-medium group-hover:text-blue-500">Select Image</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isUploading} />
                        </label>
                        <p className="text-xs text-gray-400 mt-3 text-center">Recommended: Portrait (4:5 ratio)</p>
                      </>
                    )}
                  </div>

                  <div className="w-full md:w-2/3 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input type="text" placeholder="e.g., Introduction to Programming" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
                      <input type="text" placeholder="e.g., Dr. Alan Turing" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">General Timings</label>
                      <input type="text" placeholder="e.g., 01:00 PM - 03:00 PM" value={formData.timings} onChange={(e) => setFormData({...formData, timings: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Start Date</label>
                            <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course End Date</label>
                            <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Schedule & Attendance Tab */
                <div className="space-y-8 animate-in fade-in duration-200">
                  
                  {/* Toggle Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <label className="flex items-center cursor-pointer gap-3">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={formData.attendance_enabled}
                        onChange={(e) => setFormData({...formData, attendance_enabled: e.target.checked})}
                      />
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-gray-900">Enable Attendance Tracking</span>
                        <span className="text-sm text-gray-500 mt-0.5">Activate daily presence marking, batch management, and schedule restrictions.</span>
                      </div>
                    </label>
                  </div>

                  {formData.attendance_enabled && (
                    <>
                      {/* Configuration Grid */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Batch Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Days (Session Days)</label>
                            <div className="flex flex-wrap gap-2">
                              {DAYS.map(day => (
                                <button 
                                  key={day.value}
                                  type="button"
                                  onClick={() => toggleDay(day.value)}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${formData.session_days.includes(day.value) ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Cutoff Time</label>
                            <div className="relative">
                              <input 
                                type="time" 
                                value={formData.attendance_cutoff_time}
                                onChange={(e) => setFormData({...formData, attendance_cutoff_time: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 outline-none focus:border-blue-500" 
                              />
                              <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Leave empty for no daily limit.</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions (Batch Cap)</label>
                            <input 
                              type="number" 
                              placeholder="e.g., 20"
                              value={formData.total_sessions}
                              onChange={(e) => setFormData({...formData, total_sessions: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" 
                            />
                            <p className="text-xs text-gray-500 mt-1">Course concludes after this many classes.</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Start Date</label>
                            <input 
                              type="date" 
                              value={formData.batch_start_date}
                              onChange={(e) => setFormData({...formData, batch_start_date: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" 
                            />
                          </div>

                        </div>
                      </div>

                      {/* Exceptions / Cancellations (Only on Existing Courses) */}
                      {formData.id && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Class Exceptions & Cancellations</h3>
                          
                          <form onSubmit={handleCancelDate} className="flex flex-col sm:flex-row gap-3 mb-6 bg-red-50/50 p-4 rounded-xl border border-red-100">
                            <div className="flex-1">
                              <input 
                                type="date" required
                                value={cancelDateForm.date}
                                onChange={e => setCancelDateForm({...cancelDateForm, date: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                              />
                            </div>
                            <div className="flex-[2]">
                              <input 
                                type="text" placeholder="Reason (e.g., Instructor Ill, Holiday)"
                                value={cancelDateForm.reason}
                                onChange={e => setCancelDateForm({...cancelDateForm, reason: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                              />
                            </div>
                            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2">
                              <CalendarOff className="w-4 h-4" /> Cancel Class
                            </button>
                          </form>

                          {cancelledDates.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                  <tr>
                                    <th className="px-4 py-3">Cancelled Date</th>
                                    <th className="px-4 py-3">Reason</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {cancelledDates.map(c => (
                                    <tr key={c.id}>
                                      <td className="px-4 py-3 font-bold text-gray-900">{new Date(c.date).toLocaleDateString()}</td>
                                      <td className="px-4 py-3 text-gray-600">{c.reason || '-'}</td>
                                      <td className="px-4 py-3 text-right">
                                        <button 
                                          onClick={() => handleRestoreDate(c.id)}
                                          className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"
                                          title="Restore Date"
                                        >
                                          <RotateCcw className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                              No dates have been cancelled for this course.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!isConfirmingDelete && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                <div className="flex gap-2">
                  {formData.id && (
                    <button onClick={() => setIsConfirmingDelete(true)} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg font-bold transition-colors text-sm flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {formData.id && !formData.is_published && !formData.is_completed && (
                    <button onClick={handlePublish} className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold transition-colors text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Publish
                    </button>
                  )}
                  {formData.id && formData.is_published && !formData.is_completed && (
                    <button onClick={handleToggleCompletion} className="text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg font-bold transition-colors text-sm flex items-center gap-2">
                      <Award className="w-4 h-4" /> Mark as Completed
                    </button>
                  )}
                  {formData.id && formData.is_completed && (
                    <button onClick={handleToggleCompletion} className="text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg font-bold transition-colors text-sm flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Revert to Active
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button onClick={closeModal} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                  <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-70">
                    {isLoading ? 'Saving...' : formData.id ? 'Save Changes' : 'Create Course'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesTab;