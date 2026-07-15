import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';

const StudentLayout = () => { // Or StudentLayout
  return (
    <DashboardLayout role="student">
      <Outlet />
    </DashboardLayout>
  );
};

export default StudentLayout; // Or StudentLayout