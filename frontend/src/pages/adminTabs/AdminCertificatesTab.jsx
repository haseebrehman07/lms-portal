import React, { useState, useEffect } from 'react';
import { Award, Plus, Download, Trash2, Loader2, AlertCircle, X, Check, XCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminCertificatesTab = () => {
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCert, setNewCert] = useState({ user_id: '', course_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Added .catch() to prevent a single missing route from crashing the page
      const [certsRes, reqsRes, coursesRes] = await Promise.all([
        api.get('/certificates/admin/all').catch(() => ({ data: [] })),
        api.get('/certificate-requests').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] }))
      ]);
      
      setIssuedCerts(certsRes.data || []);
      setRequests(reqsRes.data || []);
      setCourses(coursesRes.data || []);

      try {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      } catch (e) {
        console.warn("Could not fetch users list.");
      }

    } catch (err) {
      console.error('Error fetching certificates data:', err);
      setError('Failed to load certificates. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // --- ACTIONS ---

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!newCert.user_id || !newCert.course_id) {
        return alert("Please select both a student and a course.");
    }
    
    try {
      setIsSubmitting(true);
      await api.post('/certificates/admin/issue', newCert);
      setIsModalOpen(false);
      setNewCert({ user_id: '', course_id: '' });
      fetchData(); 
    } catch (err) {
      console.error('Error issuing certificate:', err);
      alert(err.response?.data?.detail || 'Failed to issue certificate. Ensure the user is enrolled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (certId) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return;
    try {
      await api.delete(`/certificates/admin/${certId}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting certificate:', err);
      alert('Failed to revoke certificate.');
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      // Action is either 'approve' or 'reject'
      await api.patch(`/certificate-requests/${requestId}/${action}`, {
          admin_note: `Actioned by Admin`
      });
      fetchData();
    } catch (err) {
      console.error(`Error processing request:`, err);
      alert(err.response?.data?.detail || `Failed to ${action} request.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading certificate database...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 text-gray-800 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review requests, issue manually, and revoke certificates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Manual Issue
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- SECTION 1: PENDING REQUESTS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-orange-50/50 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-gray-900">Pending Requests ({pendingRequests.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Course Title</th>
                <th className="px-6 py-4 font-semibold">Requested Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.user_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{req.user_email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {req.course_title || 'Unknown Course'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(req.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleRequestAction(req.id, 'approve')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-semibold"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button 
                            onClick={() => handleRequestAction(req.id, 'reject')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-semibold"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No pending certificate requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SECTION 2: ALL ISSUED CERTIFICATES --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <h2 className="font-bold text-gray-900">All Issued Certificates</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Course Title</th>
                <th className="px-6 py-4 font-semibold">Issue Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {issuedCerts.length > 0 ? (
                issuedCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getUserName(cert.user_id)}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{cert.user_id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-800">{cert.course_title || 'Unknown Course'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <a href={cert.certificate_url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View/Download PDF">
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleDelete(cert.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No certificates have been issued yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MANUAL ISSUE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Manually Issue Certificate</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select 
                  required
                  value={newCert.user_id}
                  onChange={(e) => setNewCert({...newCert, user_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>-- Select a Student --</option>
                  {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                <select 
                  required
                  value={newCert.course_id}
                  onChange={(e) => setNewCert({...newCert, course_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>-- Select a Course --</option>
                  {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 italic">Note: The student must be enrolled in the course to manually issue a certificate.</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCertificatesTab;