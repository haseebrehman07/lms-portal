// frontend/src/pages/adminTabs/CourseAllocationTab.jsx
import { useState } from 'react';
import axios from 'axios';

const CourseAllocationTab = () => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [semesterDesignated, setSemesterDesignated] = useState('6');
  const [section, setSection] = useState('A'); // New Section State

  const handleAllocate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Include section in the payload
      await axios.post('http://localhost:5000/api/admin/allocate', {
        title, courseCode, teacherEmail, roomNo, dayOfWeek, semesterDesignated, section
      }, config);
      
      alert('Allocation successfully completed!');
      setTitle(''); setCourseCode(''); setTeacherEmail(''); setRoomNo(''); setSection('A');
    } catch (error) {
      alert(error.response?.data?.message || 'Error managing allocation');
    }
  };

  return (
    <div>
      <h1 className="welcome-header">Course & Timetable Allocation</h1>
      
      <div className="dashboard-card" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <h3>Assign Course to Trainer</h3>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Create an active course module and tie it directly to a trainer's live timeline.</p>
        
        <form onSubmit={handleAllocate}>
          <input type="text" placeholder="Course Title (e.g., Database Systems)" value={title} onChange={(e)=>setTitle(e.target.value)} required className="dashboard-input" />
          <input type="text" placeholder="Course Code (e.g., SE-309)" value={courseCode} onChange={(e)=>setCourseCode(e.target.value)} required className="dashboard-input" />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" placeholder="Semester" value={semesterDesignated} onChange={(e)=>setSemesterDesignated(e.target.value)} required className="dashboard-input" />
            <input type="text" placeholder="Section (e.g., A)" value={section} onChange={(e)=>setSection(e.target.value)} required className="dashboard-input" />
          </div>
          
          <input type="email" placeholder="Trainer Registered Email" value={teacherEmail} onChange={(e)=>setTeacherEmail(e.target.value)} required className="dashboard-input" />
          <input type="text" placeholder="Room Number (e.g., Lab 3 or Room 15)" value={roomNo} onChange={(e)=>setRoomNo(e.target.value)} required className="dashboard-input" />
          
          <select value={dayOfWeek} onChange={(e)=>setDayOfWeek(e.target.value)} className="dashboard-input" style={{ background: '#1e293b' }}>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>

          <button type="submit" className="action-btn" style={{ background: '#06b6d4' }}>
            Authorize & Allocate Course
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseAllocationTab;