import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';

const AdminLayout = () => {
  return (
    <DashboardLayout role="admin">
      {/* Outlet acts as a placeholder where your specific tabs will render */}
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;