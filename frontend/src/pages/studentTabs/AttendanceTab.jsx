// frontend/src/pages/studentTabs/AttendanceTab.jsx
const AttendanceTab = ({ enrollments }) => {
  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: 'white' }}>Attendance Records</h1>
      
      <div className="excel-table-container">
        <table className="excel-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Classes Held</th>
              <th>Classes Attended</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enr) => (
              <tr key={enr._id}>
                <td>{enr.course.courseCode}</td>
                <td>{enr.course.title}</td>
                {/* Dummy data mapping - we will connect the real endpoints later */}
                <td>10</td>
                <td>8</td>
                <td>80%</td>
                <td style={{ color: 'green', fontWeight: 'bold' }}>Eligible</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTab;