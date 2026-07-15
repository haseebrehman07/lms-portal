// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import api from './api/axiosConfig';

import AdminLayout from './pages/AdminLayout';
import CourseAllocationTab from './pages/adminTabs/CourseAllocationTab';
import AdminCoursesTab from './pages/adminTabs/AdminCoursesTab';
import AdminEnrollmentsTab from './pages/adminTabs/AdminEnrollmentsTab';
import AdminAnnouncementsTab from './pages/adminTabs/AdminAnnouncementsTab';
import AdminUsersTab from './pages/adminTabs/AdminUsersTab';
import AdminReportsTab from './pages/adminTabs/AdminReportsTab';
import AdminScheduleTab from './pages/adminTabs/AdminScheduleTab';
import AdminCertificatesTab from './pages/adminTabs/AdminCertificatesTab';

// Imports... (Login, StudentLayout, etc. remain the same)
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

const EnrollmentsTab = () => <div><h1 style={{color: 'white'}}>New Enrollments</h1><p style={{color: '#94a3b8'}}>Catalog incoming...</p></div>;

function App() {
  const [enrollments, setEnrollments] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  
  // Teacher States
  const [schedule, setSchedule] = useState([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem('role'); 

    if (role === 'student') {
      // We only fetch enrollments for now since assignments doesn't exist yet
      api.get('/enrollments/me')
        .then((enrRes) => {
          setEnrollments(enrRes.data);
          // If you need assignments, you can set it to an empty array for now
          // to prevent UI crashes until you build the backend route for it.
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
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* STUDENT ROUTES */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<HomeTab enrollments={enrollments} />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="attendance" element={<StudentAttendance />} /> {/* Add this */}
          <Route path="fees" element={<StudentFees />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="gradebook" element={<StudentGradebook/>} />
          <Route path="learning" element={<StudentLearning />} />
          <Route path="certificates" element={<StudentCertificates/>}/>
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="deadlines" element={<StudentDeadlines />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<CourseAllocationTab />} />
          <Route path="courses" element={<AdminCoursesTab />} />
          <Route path="enrollments" element={<AdminEnrollmentsTab />} />
          <Route path="announcements" element={<AdminAnnouncementsTab />} />
          <Route path="users" element={<AdminUsersTab />} />
          <Route path="reports" element={<AdminReportsTab />} />
          <Route path="schedule" element={<AdminScheduleTab />} />
          <Route path="certificates" element={<AdminCertificatesTab/>}/>
        </Route>

      </Routes>
    </Router>
  );
}

export default App;