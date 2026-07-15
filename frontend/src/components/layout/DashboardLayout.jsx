import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

// Add 'role' to the accepted props
const DashboardLayout = ({ children, role }) => {
  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Pass the role explicitly to the Sidebar */}
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;