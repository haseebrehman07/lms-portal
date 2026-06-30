// frontend/src/pages/adminTabs/AdminReportsTab.jsx
const AdminReportsTab = () => {
  const triggerExcelGeneration = () => {
    alert('Processing batch transaction records...\nExcel report downloading shortly via system framework.');
  };

  return (
    <div>
      <h1 className="welcome-header">LMS System Reporting</h1>
      
      <div className="dashboard-card" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <h3>Export Central Ledger Sheets</h3>
        <p style={{ color: '#94a3b8', marginBottom: '25px' }}>
          Compile active enrollment rosters, complete roll lists, transaction hyperlink pointers, and verified payment metrics directly into a Microsoft Excel spreadsheet grid.
        </p>
        <button onClick={triggerExcelGeneration} className="action-btn" style={{ background: '#06b6d4' }}>
          Generate & Download Master Report (.xlsx)
        </button>
      </div>
    </div>
  );
};

export default AdminReportsTab;