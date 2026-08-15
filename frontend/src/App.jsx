// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api/axiosConfig';

// Import the Route Guard
import ProtectedRoute from './components/ProtectedRoute';

import ChatLayout from './pages/chat/ChatLayout';

import AdminLayout from './pages/AdminLayout';
import CourseAllocationTab from './pages/adminTabs/CourseAllocationTab';
import AdminCoursesTab from './pages/adminTabs/AdminCoursesTab';
import AdminEnrollmentsTab from './pages/adminTabs/AdminEnrollmentsTab';
import AdminAnnouncementsTab from './pages/adminTabs/AdminAnnouncementsTab';
import AdminUsersTab from './pages/adminTabs/AdminUsersTab';
import AdminReportsTab from './pages/adminTabs/AdminReportsTab';
import AdminScheduleTab from './pages/adminTabs/AdminScheduleTab';
import AdminCertificatesTab from './pages/adminTabs/AdminCertificatesTab';
import AdminAttendanceTab from './pages/adminTabs/AdminAttendanceTab';
import AdminFeesTab from './pages/adminTabs/AdminFeesTab'; // NEW IMPORT

import Login from './pages/Login';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPassword from './pages/ForgotPassword';
import StudentLayout from './pages/StudentLayout';
import HomeTab from './pages/studentTabs/HomeTab';
import StudentCourses from './pages/studentTabs/StudentCourses';
import StudentAttendance from './pages/studentTabs/StudentAttendance';
import StudentFees from './pages/studentTabs/StudentFees';
import StudentTimetable from './pages/studentTabs/StudentTimetable';
import StudentGradebook from './pages/studentTabs/StudentGradebook';
import StudentLearning from './pages/studentTabs/StudentLearning';
import StudentCertificates from './pages/studentTabs/StudentCertificates';
import StudentNotifications from './pages/studentTabs/StudentNotifications';
import StudentDeadlines from './pages/studentTabs/StudentDeadlines';

const EnrollmentsTab = () => <div><h1 className="text-white">New Enrollments</h1><p className="text-slate-400">Catalog incoming...</p></div>;

function App() {
  const [enrollments, setEnrollments] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  
  // Teacher States
  const [schedule, setSchedule] = useState([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState([]);

  useEffect(() => {
    const role = sessionStorage.getItem('role'); 

    // Checking for both 'student' and 'learner' to match your backend RoleEnum
    if (role === 'student' || role === 'learner') {
      api.get('/enrollments/me')
        .then((enrRes) => {
          setEnrollments(enrRes.data);
          setStudentAssignments([]); 
        })
        .catch(err => {
          console.error("Failed to fetch student data:", err);
        });
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* PROTECTED STUDENT ROUTES */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRoles={['learner', 'student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeTab enrollments={enrollments} />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="gradebook" element={<StudentGradebook/>} />
          <Route path="learning" element={<StudentLearning />} />
          <Route path="certificates" element={<StudentCertificates/>}/>
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="deadlines" element={<StudentDeadlines />} />
          <Route path="chat" element={<ChatLayout />} />
        </Route>

        {/* PROTECTED ADMIN ROUTES */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CourseAllocationTab />} />
          <Route path="courses" element={<AdminCoursesTab />} />
          <Route path="enrollments" element={<AdminEnrollmentsTab />} />
          <Route path="announcements" element={<AdminAnnouncementsTab />} />
          <Route path="attendance" element={<AdminAttendanceTab />} />
          <Route path="users" element={<AdminUsersTab />} />
          <Route path="reports" element={<AdminReportsTab />} />
          <Route path="schedule" element={<AdminScheduleTab />} />
          <Route path="certificates" element={<AdminCertificatesTab/>}/>
          <Route path="fees" element={<AdminFeesTab />} /> {/* NEW ROUTE */}
          <Route path="chat" element={<ChatLayout />} />
        </Route>

        {/* CATCH-ALL ROUTE (Redirects unknown URLs to login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;