// frontend/src/pages/teacherTabs/TeacherCourseDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const TeacherCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/teacher/assignment', {
        courseId, title, description: "Upload submission.", deadline
      }, config);
      alert('Assignment Published!');
      setTitle(''); setDeadline('');
    } catch (error) {
      alert('Error creating assignment');
    }
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '20px' }}>← Back</button>
      <h1 style={{ marginBottom: '10px', color: '#f8fafc' }}>Course Workspace</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Course ID: {courseId}</p>

      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ borderColor: '#3b82f6' }}>
          <h3 style={{ color: '#3b82f6' }}>Publish New Assignment</h3>
          <form onSubmit={handleCreateAssignment}>
            <input type="text" placeholder="Assignment Title" value={title} onChange={(e)=>setTitle(e.target.value)} required className="dashboard-input" />
            <input type="date" value={deadline} onChange={(e)=>setDeadline(e.target.value)} required className="dashboard-input" />
            <button type="submit" className="action-btn blue">Publish to Class</button>
          </form>
        </div>
        
        <div className="dashboard-card">
          <h3>Course Notes & Material</h3>
          <p style={{ color: '#94a3b8' }}>Upload syllabus and lecture notes here. (Cloud integration pending).</p>
          <button className="action-btn" disabled style={{ opacity: 0.5 }}>Upload PDF</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseDetails;