import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';

const TeacherLayout = () => { // Or StudentLayout
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default TeacherLayout; // Or StudentLayout