// frontend/src/pages/studentTabs/CourseDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '20px' }}
      >
        ← Back
      </button>
      
      <h1 style={{ marginBottom: '10px' }}>Course Workspace</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Course ID: {courseId}</p>

      <div className="dashboard-grid">
        <div className="dashboard-card" style={{ borderColor: '#1d4ed8' }}>
          <h3 style={{ color: '#1d4ed8' }}>Submit Assignment</h3>
          <input type="url" placeholder="Paste URL here..." className="dashboard-input" />
          <button className="action-btn blue">Upload</button>
        </div>
        
        <div className="dashboard-card">
          <h3>Course Notes</h3>
          <p>Professor's uploaded materials will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;