// frontend/src/pages/teacherTabs/TeacherAttendanceTab.jsx
import { useState } from 'react';
import axios from 'axios';

const TeacherAttendanceTab = ({ schedule }) => {
  const [activeCourse, setActiveCourse] = useState(null);
  const [roster, setRoster] = useState([]);

  const loadRoster = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`http://localhost:5000/api/teacher/course/${courseId}/students`, { headers: { Authorization: `Bearer ${token}` }});
      setRoster(data);
      setActiveCourse(courseId);
    } catch (error) {
      alert('Error fetching roster');
    }
  };

  const markAttendance = async (studentId, status) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/teacher/attendance', { courseId: activeCourse, studentId, status }, { headers: { Authorization: `Bearer ${token}` }});
      alert(`Marked ${status}`);
    } catch (error) {
      alert('Error marking attendance');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#f8fafc' }}>Attendance Roster</h1>
      
      {/* Selection Row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {schedule.map(slot => (
          <button 
            key={slot._id} 
            onClick={() => loadRoster(slot.course._id)}
            className="action-btn" 
            style={{ width: 'auto', background: activeCourse === slot.course._id ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: activeCourse === slot.course._id ? '#fff' : '#94a3b8' }}
          >
            {slot.course.courseCode} Roster
          </button>
        ))}
      </div>

      {/* Excel Table */}
      {activeCourse && (
        <div className="excel-table-container">
          <table className="excel-table">
            <thead>
              <tr>
                <th>Participant Name</th>
                <th>Email Address</th>
                <th>Today's Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? <tr><td colSpan="4">No students enrolled.</td></tr> : roster.map((enr) => (
                <tr key={enr._id}>
                  <td style={{ fontWeight: '500' }}>{enr.student.name}</td>
                  <td style={{ color: '#94a3b8' }}>{enr.student.email}</td>
                  <td>Pending</td>
                  <td>
                    <button onClick={() => markAttendance(enr.student._id, 'Present')} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>P</button>
                    <button onClick={() => markAttendance(enr.student._id, 'Absent')} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}>A</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceTab;