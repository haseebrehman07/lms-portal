import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const StudentTimetable = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await api.get('/student/timetable');
        // Handle both array and wrapped object formats just in case
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching timetable:", err);
        setError('Failed to load timetable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  // Helper function to group the schedule by day
  const groupedSchedule = schedule.reduce((acc, curr) => {
    const day = curr.dayOfWeek || 'TBA';
    if (!acc[day]) acc[day] = [];
    acc[day].push(curr);
    return acc;
  }, {});

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Weekly Timetable</h1>
      
      {Object.keys(groupedSchedule).length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">No classes scheduled for this semester yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {daysOrder.map((day) => {
            if (!groupedSchedule[day]) return null;
            
            return (
              <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 px-4 py-3">
                  <h2 className="text-lg font-semibold text-white">{day}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedSchedule[day].map((slot, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {slot.course?.title || 'Unknown Course'}
                        </h3>
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {slot.course?.courseCode}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <span>🕒</span> {slot.startTime} - {slot.endTime || 'TBA'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span>👨‍🏫</span> {slot.teacher?.name || 'Staff'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;