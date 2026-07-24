import React, { useState, useEffect } from 'react';
import { Plus, Settings, X, Upload, Clock, User, BookOpen, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
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
  
  // Added 'id' and 'is_published' to track the exact course state securely
  const [formData, setFormData] = useState({ id: null, title: '', instructor: '', timings: '', startDate: '', endDate: '', thumbnailUrl: '', is_published: false });

  // 1. FETCH COURSES ON LOAD
  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Timer logic for delete confirmation
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

    if (course) {
      setFormData({ 
        id: course.id,
        title: course.title || '', 
        instructor: course.instructor_name || '', 
        timings: course.timings || '',
        startDate: course.start_date || '',
        endDate: course.end_date || '',
        thumbnailUrl: course.thumbnail_url || '',
        is_published: course.is_published || false
      });
      setIsModalOpen(true);
    } else {
      setFormData({ id: null, title: '', instructor: '', timings: '', startDate: '', endDate: '', thumbnailUrl: '', is_published: false });
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

      const res = await api.post('/upload/image', uploadData, {
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
      thumbnail_url: formData.thumbnailUrl
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

  // --- PUBLISH COURSE LOGIC ---
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
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group hover:border-blue-300 transition-colors cursor-pointer">
            
            {/* Draft / Published Badge */}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold z-10 shadow-sm border ${course.is_published ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
              {course.is_published ? 'Published' : 'Draft'}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); openModal(course); }}
              className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur text-gray-500 hover:text-blue-600 rounded-lg shadow border border-gray-100 z-10 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center border-b border-gray-200">
              <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center border-b border-gray-200 overflow-hidden w-full">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-10 h-10 text-gray-300" />
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col h-[220px]">
              <h3 className="font-bold text-lg text-gray-900 mb-3 pr-8 truncate">{course.title}</h3>
              <div className="space-y-2 text-sm text-gray-600 flex-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{course.instructor_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{course.timings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    {course.start_date ? new Date(course.start_date).toLocaleDateString() : 'TBD'} - 
                    {course.end_date ? new Date(course.end_date).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setEditingCourse(course)}
                className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition-colors mt-4 cursor-pointer shrink-0"
              >
                Edit Curriculum
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {isConfirmingDelete ? 'Confirm Deletion' : formData.title ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {isConfirmingDelete ? (
              <div className="p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Are you absolutely sure?</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                  Deleting <span className="font-bold text-gray-900">"{formData.title}"</span> will erase all uploads in it, enrolled students, assignment records, and etc. This action cannot be undone.
                </p>
                
                <div className="flex gap-4 w-full max-w-sm">
                  <button 
                    onClick={() => {
                      setIsConfirmingDelete(false);
                      setDeleteCountdown(5);
                    }}
                    className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    disabled={deleteCountdown > 0}
                    onClick={executeDelete}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                      deleteCountdown > 0 
                        ? 'bg-red-300 cursor-not-allowed opacity-80' 
                        : 'bg-red-600 hover:bg-red-700 shadow-md cursor-pointer' 
                    }`}
                  >
                    {deleteCountdown > 0 ? `Yes, Delete (${deleteCountdown}s)` : 'Yes, Delete'}
                  </button>
                </div>
              </div>

            ) : (
              <>
                <div className="p-6 flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 flex flex-col items-center">
                    {rawImage ? (
                      // THE CROPPER UI
                      <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
                        <div className="relative w-full aspect-[4/5] bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                          <Cropper
                            image={rawImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 5} 
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        </div>
                        <div className="px-2">
                          <label className="text-xs text-gray-500 mb-1 block font-medium">Zoom</label>
                          <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRawImage(null)}
                            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCropAndUpload}
                            disabled={isUploading}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:bg-blue-400"
                          >
                            {isUploading ? 'Saving...' : 'Crop & Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // THE STANDARD PREVIEW / UPLOAD UI
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

                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageSelect}
                            disabled={isUploading}
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-3 text-center">Recommended: Portrait (4:5 ratio)</p>
                      </>
                    )}
                  </div>

                  <div className="w-full md:w-2/3 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                      <input 
                        placeholder="e.g., Introduction to Programming"
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
                      <input 
                        placeholder="e.g., Dr. Alan Turing"
                        type="text" 
                        value={formData.instructor}
                        onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timings</label>
                      <input 
                        placeholder="e.g., 01:00 PM - 03:00 PM"
                        type="text" 
                        value={formData.timings}
                        onChange={(e) => setFormData({...formData, timings: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <div className="relative group cursor-pointer">
                                <input 
                                    type="date" 
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-700 bg-transparent relative z-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 group-hover:text-blue-600 group-hover:bg-gray-100 group-hover:shadow-sm transition-all pointer-events-none z-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Finish Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                            <div className="relative group cursor-pointer">
                                <input 
                                    type="date" 
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-700 bg-transparent relative z-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 group-hover:text-blue-600 group-hover:bg-gray-100 group-hover:shadow-sm transition-all pointer-events-none z-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                  
                  {/* Left Side Buttons (Delete & Publish) */}
                  <div className="flex gap-3">
                    {formData.id && (
                      <button 
                        onClick={() => setIsConfirmingDelete(true)}
                        className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer"
                      >
                        Delete Course
                      </button>
                    )}
                    {formData.id && !formData.is_published && (
                      <button 
                        onClick={handlePublish}
                        className="text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Publish Course
                      </button>
                    )}
                  </div>
                  
                  {/* Right Side Buttons (Cancel & Save) */}
                  <div className="flex gap-3">
                    <button 
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                    >
                      {formData.id ? 'Save Changes' : 'Create Course'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesTab;