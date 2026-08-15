import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertCircle, Loader2, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentFees = () => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchFeeData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        api.get('/fees/me/summary'),
        api.get('/fees/history')
      ]);
      setSummary(summaryRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Failed to fetch fee data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const handleUploadReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      await api.post('/fees/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Receipt uploaded successfully. Waiting for admin approval.');
      fetchFeeData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to upload receipt.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Track your fee structures and payment history.</p>
        </div>
        
        {summary?.fee_structure_id && summary.remaining_balance > 0 && (
          <div>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUploadReceipt} 
              disabled={isUploading}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Submit Receipt
            </button>
          </div>
        )}
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <p className="text-gray-400 font-medium mb-1">Outstanding Balance</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Rs. {summary?.remaining_balance?.toLocaleString() || '0'}
            </h2>
            
            {summary?.status === 'Overdue' && (
              <div className="flex items-center gap-2 mt-4 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg w-fit text-sm font-bold border border-red-500/20">
                <AlertCircle className="w-4 h-4" /> Overdue since {new Date(summary.due_date).toLocaleDateString()}
              </div>
            )}
            {summary?.status === 'Unpaid' && summary?.due_date && (
              <div className="flex items-center gap-2 mt-4 text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-lg w-fit text-sm font-bold border border-orange-500/20">
                <Clock className="w-4 h-4" /> Due by {new Date(summary.due_date).toLocaleDateString()}
              </div>
            )}
            {summary?.status === 'Paid' && (
              <div className="flex items-center gap-2 mt-4 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg w-fit text-sm font-bold border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" /> Fully Paid
              </div>
            )}
            {summary?.status === 'No Fee Structure Set' && (
              <div className="flex items-center gap-2 mt-4 text-gray-300 bg-gray-400/10 px-3 py-1.5 rounded-lg w-fit text-sm font-bold border border-gray-500/20">
                No fee structure currently assigned.
              </div>
            )}
          </div>

          <div className="flex gap-8 text-right bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Fee</p>
              <p className="text-xl font-bold">Rs. {summary?.total_amount?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-emerald-400">Rs. {summary?.total_paid?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Payment Submissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Date Submitted</th>
                <th className="px-6 py-4 font-semibold">Semester</th>
                <th className="px-6 py-4 font-semibold">Amount Covered</th>
                <th className="px-6 py-4 font-semibold">Receipt</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.length > 0 ? history.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(voucher.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {voucher.semester}
                  </td>
                  <td className="px-6 py-4">
                    {voucher.status === 'approved' ? (
                      <span className="font-bold text-emerald-600">Rs. {voucher.amount_approved?.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-500">Rs. {voucher.amount?.toLocaleString()} (Pending)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <a href={voucher.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                      View Receipt
                    </a>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                    {voucher.status === 'pending' && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 font-bold rounded text-xs"><Clock className="w-3 h-3" /> Pending</span>}
                    {voucher.status === 'approved' && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-xs"><CheckCircle className="w-3 h-3" /> Approved</span>}
                    {voucher.status === 'rejected' && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded text-xs"><XCircle className="w-3 h-3" /> Rejected</span>}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No payment receipts submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFees;