// frontend/src/pages/adminTabs/AdminFeesTab.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminFeesTab = () => {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // We wrap this in a function so we can call it again after an edit!
  const fetchVouchers = async () => {
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/admin/fees', config);
      // We grab ALL vouchers now, no filtering, so the Admin sees the full history
      setVouchers(response.data); 
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const verifyStatus = async (id, choice) => {
    let finalAmount = 0;

    if (choice === 'Approved') {
      const input = window.prompt('Enter the exact Rs. amount verified on this receipt (Numbers only):');
      
      if (input === null) return; 
      
      finalAmount = Number(input);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        alert('Invalid amount entered. Approval cancelled.');
        return;
      }
    }

    const token = localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`http://localhost:5000/api/admin/fees/${id}`, { 
        status: choice, 
        amountApproved: finalAmount 
      }, config);
      
      // INSTEAD of deleting it from the screen, we refresh the data so it updates to 'Approved'
      fetchVouchers(); 
      alert(`Voucher updated! Amount credited: Rs. ${finalAmount}`);
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  return (
    <div>
      <h1 className="welcome-header">Fee Transaction Auditing</h1>
      
      <div className="excel-table-container" style={{ marginTop: '20px' }}>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Student Identity</th>
              <th>Academic Cycle</th>
              <th>Ledger Amount</th>
              <th>Transaction Audit</th>
              <th>Administrative Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ color: '#06b6d4', textAlign: 'center', padding: '20px' }}>Loading financial streams...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan="5" style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No fee records found in the database.</td></tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v._id}>
                  <td style={{ fontWeight: '500' }}>
                    {v.student?.name || 'Unknown Student'} <br/>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{v.student?.email}</span>
                  </td>
                  <td>Semester {v.semester}</td>
                  <td>
                    Rs. {v.amount.toLocaleString()} <br/>
                    {v.status === 'Approved' && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
                        Verified Paid: Rs. {v.amountApproved?.toLocaleString() || 0}
                      </span>
                    )}
                  </td>
                  <td>
                    <a href={v.proofUrl} target="_blank" rel="noreferrer" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: '600' }}>
                      View Receipt ↗
                    </a>
                  </td>
                  <td>
                    {v.status === 'Approved' ? (
                      <button 
                        onClick={() => verifyStatus(v._id, 'Approved')} 
                        style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Edit Amount
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => verifyStatus(v._id, 'Approved')} 
                          style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}>
                          Approve
                        </button>
                        <button 
                          onClick={() => verifyStatus(v._id, 'Rejected')} 
                          style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFeesTab;