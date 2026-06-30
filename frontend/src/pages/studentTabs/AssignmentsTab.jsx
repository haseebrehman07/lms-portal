// frontend/src/pages/studentTabs/AssignmentsTab.jsx
import { useNavigate } from 'react-router-dom';

const AssignmentsTab = ({ assignments }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>All Assignments</h1>

      {assignments.length === 0 ? <p>No pending assignments.</p> : assignments.map((assignment) => (
        <div key={assignment._id} className="horizontal-card" style={{ cursor: 'default' }}>
          <div className="card-info">
            <h3>{assignment.title}</h3>
            <p>Subject: {assignment.course?.title || 'Course Name'} | Teacher: {assignment.course?.teacherName || 'TBA'}</p>
          </div>
          <button 
            className="action-btn blue" 
            style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
            onClick={() => navigate(`/student/course/${assignment.course || assignment.courseId}`)}
          >
            Check Assignment
          </button>
        </div>
      ))}
    </div>
  );
};

export default AssignmentsTab;