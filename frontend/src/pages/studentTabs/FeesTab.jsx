// frontend/src/pages/studentTabs/FeesTab.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const FeesTab = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Ledger State
  const [history, setHistory] = useState([]);
  const semesterTotal = 45000;

  // Fetch financial history on load
  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/student/fees/history', config);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch fee history');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Calculate Ledger Math
  const totalPaid = history
    .filter(v => v.status === 'Approved' && v.semester === '6') // Filter by semester 6
    .reduce((sum, v) => sum + (v.amountApproved || 0), 0);
    
  const remainingBalance = semesterTotal - totalPaid;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatusMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setStatusMessage('Please select a file first.');

    setIsUploading(true);
    setStatusMessage('Uploading to secure cloud storage...');

    const formData = new FormData();
    formData.append('receipt', file);

    const token = localStorage.getItem('token');
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      await axios.post('http://localhost:5000/api/student/fee/upload', formData, config);
      setStatusMessage('✅ Success! Receipt sent to Admin for verification.');
      setFile(null);
      fetchHistory(); // Refresh the history table!
    } catch (error) {
      setStatusMessage('❌ Upload failed: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1 className="welcome-header">Financial Ledger</h1>
      
      {/* LEDGER SUMMARY METRICS */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div className="dashboard-card" style={{ flex: 1, minWidth: '200px', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ color: '#94a3b8', margin: 0 }}>Total Semester Fee</p>
          <h2 style={{ margin: '10px 0 0 0' }}>Rs. {semesterTotal.toLocaleString()}</h2>
        </div>
        <div className="dashboard-card" style={{ flex: 1, minWidth: '200px', borderLeft: '4px solid #10b981' }}>
          <p style={{ color: '#94a3b8', margin: 0 }}>Total Approved Paid</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#10b981' }}>Rs. {totalPaid.toLocaleString()}</h2>
        </div>
        <div className="dashboard-card" style={{ flex: 1, minWidth: '200px', borderLeft: remainingBalance <= 0 ? '4px solid #10b981' : '4px solid #ef4444' }}>
          <p style={{ color: '#94a3b8', margin: 0 }}>Remaining Balance</p>
          <h2 style={{ margin: '10px 0 0 0', color: remainingBalance <= 0 ? '#10b981' : '#ef4444' }}>
            Rs. {remainingBalance <= 0 ? '0 (Cleared)' : remainingBalance.toLocaleString()}
          </h2>
        </div>
      </div>
      
      <div className="dashboard-card" style={{ maxWidth: '600px', marginTop: '30px', borderColor: '#10b981' }}>
        <h3 style={{ color: '#f8fafc', marginBottom: '10px' }}>Submit Installment / Payment</h3>
        <p style={{ color: '#94a3b8', marginBottom: '25px' }}>
          Upload a clear screenshot of your transaction receipt below.
        </p>
        
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '20px' }}>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="dashboard-input" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <button type="submit" className="action-btn" style={{ background: isUploading ? '#64748b' : '#10b981', cursor: isUploading ? 'wait' : 'pointer' }} disabled={isUploading}>
            {isUploading ? 'Processing Upload...' : 'Submit Proof of Payment'}
          </button>
        </form>
        {statusMessage && <p style={{ marginTop: '20px', color: statusMessage.includes('✅') ? '#10b981' : '#ef4444' }}>{statusMessage}</p>}
      </div>
    </div>
  );
};

export default FeesTab;