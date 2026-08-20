import React, { useState, useEffect } from 'react';
import { Plus, Check, XCircle, Search, Loader2 } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminFeesTab = () => {
  const [activeTab, setActiveTab] = useState('vouchers'); // 'vouchers' or 'structures'
  const [structures, setStructures] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({ student_id: '', semester: '', total_amount: '', due_date: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, structsRes, vouchRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/fees/structures').catch(() => ({ data: [] })),
        api.get('/fees').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setStructures(structsRes.data);
      setVouchers(vouchRes.data);
    } catch (error) {
      console.error("Failed to load fee data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/structure', {
        ...newStructure,
        total_amount: parseInt(newStructure.total_amount)
      });
      setIsModalOpen(false);
      setNewStructure({ student_id: '', semester: '', total_amount: '', due_date: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to create fee structure.");
    }
  };

  const handleReviewVoucher = async (voucherId, status, amount_approved = null) => {
    try {
      await api.put(`/fees/${voucherId}`, { status, amount_approved });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to review voucher.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading financial records...</p>
      </div>
    );
  }

  const pendingVouchers = vouchers.filter(v => v.status === 'pending');
  const pastVouchers = vouchers.filter(v => v.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review student payments and assign fee structures.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1.5 rounded-lg shadow-inner">
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'vouchers' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
            >
              Receipts
            </button>
            <button 
              onClick={() => setActiveTab('structures')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'structures' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
            >
              Fee Structures
            </button>
          </div>
          {activeTab === 'structures' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" /> New Structure
            </button>
          )}
        </div>
      </div>

      {activeTab === 'vouchers' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-orange-50/50 flex items-center gap-2">
                <h2 className="font-bold text-gray-900">Pending Approvals ({pendingVouchers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Course/Semester</th>
                    <th className="px-6 py-4 font-semibold">Expected Amount</th>
                    <th className="px-6 py-4 font-semibold">Receipt</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingVouchers.map((v) => (
                    <tr key={v.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{v.student_name}</div>
                        <div className="text-xs text-gray-500">{v.student_email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{v.semester}</td>
                      <td className="px-6 py-4 font-medium">Rs. {v.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <a href={v.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Receipt</a>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            const val = prompt(`Enter exact amount approved (Expected: Rs. ${v.amount}):`, v.amount);
                            if (val && !isNaN(val)) handleReviewVoucher(v.id, 'approved', parseInt(val));
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReviewVoucher(v.id, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-semibold"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingVouchers.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No pending receipts to review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student ID</th>
                  <th className="px-6 py-4 font-semibold">Course/Semester</th>
                  <th className="px-6 py-4 font-semibold">Total Assigned</th>
                  <th className="px-6 py-4 font-semibold">Total Paid</th>
                  <th className="px-6 py-4 font-semibold">Remaining</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {structures.map((s) => {
                  // Calculate total paid for this specific fee structure
                  const totalPaid = vouchers
                    .filter(v => v.fee_structure_id === s.id && v.status === 'approved')
                    .reduce((sum, v) => sum + (v.amount_approved || 0), 0);
                  
                  const remainingBalance = Math.max(s.total_amount - totalPaid, 0);

                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-500">{s.student_id.split('-')[0]}...</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{s.semester}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">Rs. {s.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">Rs. {totalPaid.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-orange-600">Rs. {remainingBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {s.due_date ? new Date(s.due_date).toLocaleDateString() : 'N/A'}
                        {remainingBalance > 0 && s.due_date && new Date(s.due_date) < new Date() && (
                           <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Overdue</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Assign Fee Structure</h3>
            </div>
            <form onSubmit={handleCreateStructure} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select 
                  required value={newStructure.student_id} onChange={(e) => setNewStructure({...newStructure, student_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="" disabled>-- Select a Student --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name / Semester</label>
                <input type="text" required placeholder="e.g., CHRMP, CHRPE" value={newStructure.semester} onChange={(e) => setNewStructure({...newStructure, semester: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee Amount (Rs.)</label>
                <input type="number" required min="1" placeholder="e.g., 45000" value={newStructure.total_amount} onChange={(e) => setNewStructure({...newStructure, total_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" required value={newStructure.due_date} onChange={(e) => setNewStructure({...newStructure, due_date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeesTab;