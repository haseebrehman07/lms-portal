import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Loader2, Filter } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminUsersTab = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterName, setFilterName] = useState('');

  // Fetch live enrollment data
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/admin/enrollment-details');
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching enrollments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(filterName.toLowerCase())
    );
  }, [filterName, users]);

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-gray-800">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Database</h1>
          <p className="text-sm text-gray-500">Managing all student enrollments.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-4">Student ID</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Enrolled Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs">{user.id.slice(0, 8)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4 text-gray-500">{user.phone}</td>
                <td className="px-6 py-4 text-gray-500">{user.enrolledDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersTab;