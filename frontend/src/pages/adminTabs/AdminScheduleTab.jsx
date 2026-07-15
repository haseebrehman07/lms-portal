import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Edit, Plus, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminScheduleTab = () => {
  // --- MOCK DATABASE ---
  const [courses, setCourses] = useState([
    { id: 1, title: 'Software Quality Engineering', code: 'SE-401', status: 'Not Scheduled', scheduleData: null },
    { id: 2, title: 'Full-Stack Web Development', code: 'CS-305', status: 'Not Scheduled', scheduleData: null },
    { id: 3, title: 'Data Structures & Algorithms', code: 'CS-201', status: 'Schedule Created', 
      scheduleData: {
        selectedDays: ['Monday', 'Wednesday'],
        sameTime: true,
        globalTime: { start: '09:00', end: '11:00' },
        individualTimes: {},
        instructor: 'Dr. Emily Chen',
        location: 'Room 304 - Main Campus',
        notes: 'Bring laptops for live coding sessions.'
      }
    },
    { id: 4, title: 'Computer Networks', code: 'IT-302', status: 'Not Scheduled', scheduleData: null },
    { id: 5, title: 'Introduction to Artificial Intelligence', code: 'CS-411', status: 'Not Scheduled', scheduleData: null },
  ]);

  // --- UI & FORM STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    selectedDays: [],
    sameTime: true,
    globalTime: { start: '', end: '' },
    individualTimes: {},
    instructor: '',
    location: '',
    notes: ''
  });

  // --- MODAL HANDLERS ---
  const openModal = (course) => {
    setActiveCourse(course);
    if (course.scheduleData) {
      // Preload existing data
      setFormData({ ...course.scheduleData });
    } else {
      // Reset to defaults
      setFormData({
        selectedDays: [],
        sameTime: true,
        globalTime: { start: '', end: '' },
        individualTimes: {},
        instructor: '',
        location: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveCourse(null);
  };

  // --- FORM INPUT HANDLERS ---
  const toggleDay = (day) => {
    setFormData(prev => {
      const isSelected = prev.selectedDays.includes(day);
      let newDays = isSelected ? prev.selectedDays.filter(d => d !== day) : [...prev.selectedDays, day];
      
      // Initialize individual time for newly selected day if it doesn't exist
      let newIndividualTimes = { ...prev.individualTimes };
      if (!isSelected && !newIndividualTimes[day]) {
        newIndividualTimes[day] = { start: '', end: '' };
      }

      return { ...prev, selectedDays: newDays, individualTimes: newIndividualTimes };
    });
  };

  const handleGlobalTime = (field, value) => {
    setFormData(prev => ({
      ...prev,
      globalTime: { ...prev.globalTime, [field]: value }
    }));
  };

  const handleIndividualTime = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      individualTimes: {
        ...prev.individualTimes,
        [day]: { ...prev.individualTimes[day], [field]: value }
      }
    }));
  };

  const handleSave = () => {
    // Validation
    if (formData.selectedDays.length === 0) {
      return alert("Please select at least one day for the schedule.");
    }

    if (formData.sameTime) {
      if (!formData.globalTime.start || !formData.globalTime.end) {
        return alert("Please select both start and end times.");
      }
    } else {
      for (let day of formData.selectedDays) {
        if (!formData.individualTimes[day]?.start || !formData.individualTimes[day]?.end) {
          return alert(`Please complete the time slots for ${day}.`);
        }
      }
    }

    // Save Data to Course
    const updatedCourses = courses.map(c => {
      if (c.id === activeCourse.id) {
        return {
          ...c,
          status: 'Schedule Created',
          scheduleData: { ...formData }
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    closeModal();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800 relative">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Training Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage class timetables and sync with student calendars.</p>
        </div>
      </div>

      {/* --- COURSE LIST --- */}
      <div className="space-y-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-colors">
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-lg text-gray-900">{course.title}</h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  {course.code}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                {course.status === 'Schedule Created' ? (
                  <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600 font-medium">{course.status}</span></>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-orange-400" /><span className="text-orange-500 font-medium">{course.status}</span></>
                )}
              </div>
            </div>

            <button 
              onClick={() => openModal(course)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors sm:w-auto w-full border ${
                course.status === 'Schedule Created' 
                  ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
              }`}
            >
              {course.status === 'Schedule Created' ? (
                <><Edit className="w-4 h-4" /> Edit Schedule</>
              ) : (
                <><Plus className="w-4 h-4" /> Schedule</>
              )}
            </button>
            
          </div>
        ))}
      </div>

      {/* --- SCHEDULE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          {/* MODAL CONTAINER: Fixed max-height with flex-col layout */}
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* MODAL HEADER: Locked at top (shrink-0) */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeCourse.status === 'Schedule Created' ? 'Edit Schedule' : 'Create Schedule'}
                </h2>
                <p className="text-sm font-medium text-blue-600 mt-0.5">{activeCourse.title}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* MODAL BODY: Scrollable area (overflow-y-auto flex-1) */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              
              {/* 1. Days of the Week */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                  Select Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        formData.selectedDays.includes(day)
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Time Scheduling */}
              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Time Scheduling
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input 
                      type="checkbox"
                      checked={formData.sameTime}
                      onChange={(e) => setFormData({...formData, sameTime: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    Use same time for all days
                  </label>
                </div>

                {formData.selectedDays.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-2">Select days above to set timings.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {formData.sameTime ? (
                      /* Global Time Inputs */
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-sm font-bold text-gray-700 sm:w-24 shrink-0">All Days</span>
                        <div className="flex flex-1 items-center gap-3">
                          <input 
                            type="time" 
                            value={formData.globalTime.start}
                            onChange={(e) => handleGlobalTime('start', e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-gray-400 text-sm font-medium">to</span>
                          <input 
                            type="time" 
                            value={formData.globalTime.end}
                            onChange={(e) => handleGlobalTime('end', e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Individual Time Inputs */
                      formData.selectedDays.map(day => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-lg border border-gray-200 animate-in fade-in duration-200">
                          <span className="text-sm font-bold text-gray-700 sm:w-24 shrink-0">{day}</span>
                          <div className="flex flex-1 items-center gap-3">
                            <input 
                              type="time" 
                              value={formData.individualTimes[day]?.start || ''}
                              onChange={(e) => handleIndividualTime(day, 'start', e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-gray-400 text-sm font-medium">to</span>
                            <input 
                              type="time" 
                              value={formData.individualTimes[day]?.end || ''}
                              onChange={(e) => handleIndividualTime(day, 'end', e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 3. Additional Information */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" /> Instructor
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., Dr. Alan Smith"
                      value={formData.instructor}
                      onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" /> Classroom / Location
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., Lab 4, Main Campus"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-400" /> Additional Notes
                  </label>
                  <textarea 
                    placeholder="Instructions for students, prerequisites, or specific class information..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>
              </div>

            </div>

            {/* MODAL FOOTER: Locked at bottom (shrink-0) */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button 
                onClick={closeModal}
                className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm"
              >
                Save Schedule
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScheduleTab;