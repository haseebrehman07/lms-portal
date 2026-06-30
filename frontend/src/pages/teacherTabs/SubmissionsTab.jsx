// frontend/src/pages/teacherTabs/SubmissionsTab.jsx
import { useNavigate } from 'react-router-dom';

const SubmissionsTab = ({ submissions }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: '#f8fafc' }}>Aggregate Submissions</h1>

      {submissions.length === 0 ? <p style={{ color: '#94a3b8' }}>No student submissions yet.</p> : submissions.map((sub) => (
        <div key={sub._id} className="horizontal-card" style={{ cursor: 'default' }}>
          <div className="card-info">
            <h3>{sub.assignment.title}</h3>
            <p>Student: <span style={{color: '#e2e8f0'}}>{sub.student.name}</span> | Status: {sub.grade ? <span style={{color: '#10b981'}}>Graded ({sub.grade}/100)</span> : <span style={{color: '#f59e0b'}}>Pending</span>}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="action-btn" style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>View File</a>
            <button 
              className="action-btn blue" 
              style={{ width: 'auto', padding: '8px 15px', margin: 0 }}
              onClick={() => navigate(`/teacher/course/${sub.assignment.course || sub.assignment.courseId}`)}
            >
              Go to Workspace
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubmissionsTab;