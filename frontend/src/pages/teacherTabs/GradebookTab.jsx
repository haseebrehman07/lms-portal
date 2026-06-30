// frontend/src/pages/teacherTabs/GradebookTab.jsx
const GradebookTab = () => (
  <div>
    <h1 style={{ color: '#f8fafc' }}>Final Gradebook</h1>
    <div className="dashboard-card" style={{ maxWidth: '600px', marginTop: '20px' }}>
      <h3>End of Semester Reporting</h3>
      <p style={{ color: '#94a3b8' }}>Compile results and export master sheets. (Admin integration pending).</p>
      <button className="action-btn blue" disabled style={{ opacity: 0.5 }}>Export to Excel</button>
    </div>
  </div>
);
export default GradebookTab;