import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';

const StudentFees = () => {
  const columns = [
    { header: 'Transaction ID', key: 'id' },
    { header: 'Amount', key: 'amount' },
    { header: 'Date', key: 'date' },
    { header: 'Status', key: 'status' }
  ];

  const data = [
    { id: '#TXN-8821', amount: 'Rs. 15,000', date: 'June 01, 2026', status: 'Active' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700">
          <CreditCard className="w-5 h-5" /> Pay Now
        </button>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg">
        <p className="text-gray-400 text-sm">Current Outstanding Balance</p>
        <h2 className="text-4xl font-bold mt-1">Rs. 45,000</h2>
        <div className="flex items-center gap-2 mt-4 text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-lg w-fit text-sm">
          <AlertCircle className="w-4 h-4" /> Due by July 15, 2026
        </div>
      </div>

      <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />
    </div>
  );
};

export default StudentFees;