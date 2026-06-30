// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

import AdminNotificationsTab from './pages/adminTabs/AdminNotificationsTab';
import AdminLayout from './pages/AdminLayout';
import CourseAllocationTab from './pages/adminTabs/CourseAllocationTab';
import AdminFeesTab from './pages/adminTabs/AdminFeesTab';
import AdminReportsTab from './pages/adminTabs/AdminReportsTab';

// Imports... (Login, StudentLayout, etc. remain the same)
import Login from './pages/Login';
import StudentLayout from './pages/StudentLayout';
import HomeTab from './pages/studentTabs/HomeTab';
import AssignmentsTab from './pages/studentTabs/AssignmentsTab';
import AttendanceTab from './pages/studentTabs/AttendanceTab';
import CourseDetails from './pages/studentTabs/CourseDetails';
import FeesTab from './pages/studentTabs/FeesTab';

// NEW: Teacher Imports
import TeacherLayout from './pages/TeacherLayout';
import TeacherHomeTab from './pages/teacherTabs/TeacherHomeTab';
import SubmissionsTab from './pages/teacherTabs/SubmissionsTab';
import TeacherAttendanceTab from './pages/teacherTabs/TeacherAttendanceTab';
import TeacherCourseDetails from './pages/teacherTabs/TeacherCourseDetails';
import GradebookTab from './pages/teacherTabs/GradebookTab';

const EnrollmentsTab = () => <div><h1 style={{color: 'white'}}>New Enrollments</h1><p style={{color: '#94a3b8'}}>Catalog incoming...</p></div>;

function App() {
  const [enrollments, setEnrollments] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  
  // Teacher States
  const [schedule, setSchedule] = useState([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (role === 'student') {
      Promise.all([
        axios.get('http://localhost:5000/api/student/enrollments', config),
        axios.get('http://localhost:5000/api/student/assignments', config)
      ]).then(([enrRes, assRes]) => {
        setEnrollments(enrRes.data);
        setStudentAssignments(assRes.data);
      }).catch(err => console.log(err));
    } else if (role === 'teacher') {
      Promise.all([
        axios.get('http://localhost:5000/api/teacher/timetable', config),
        axios.get('http://localhost:5000/api/teacher/submissions', config)
      ]).then(([schRes, subRes]) => {
        setSchedule(schRes.data);
        setTeacherSubmissions(subRes.data);
      }).catch(err => console.log(err));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* STUDENT ROUTES */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<HomeTab enrollments={enrollments} />} />
          <Route path="assignments" element={<AssignmentsTab assignments={studentAssignments} />} />
          <Route path="attendance" element={<AttendanceTab enrollments={enrollments} />} />
          <Route path="enrollments" element={<EnrollmentsTab />} />
          <Route path="fees" element={<FeesTab />} />
          <Route path="course/:courseId" element={<CourseDetails />} />
        </Route>

        {/* TEACHER ROUTES */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherHomeTab schedule={schedule} submissions={teacherSubmissions} />} />
          <Route path="submissions" element={<SubmissionsTab submissions={teacherSubmissions} />} />
          <Route path="attendance" element={<TeacherAttendanceTab schedule={schedule} />} />
          <Route path="gradebook" element={<GradebookTab />} />
          <Route path="course/:courseId" element={<TeacherCourseDetails />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<CourseAllocationTab />} />
          <Route path="fees" element={<AdminFeesTab />} />
          <Route path="reports" element={<AdminReportsTab />} />
          <Route path="notifications" element={<AdminNotificationsTab />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;