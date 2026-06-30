// backend/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getTeacherTimetable, 
  getStudentsInCourse, 
  markAttendance,
  getTeacherSubmissions,
  createAssignment,
  gradeSubmission
} = require('../controllers/teacherController');

// Import our security middleware
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// Apply middleware: User MUST be logged in AND have the 'teacher' role
router.use(protect, teacherOnly); 

router.get('/timetable', getTeacherTimetable);
router.get('/course/:courseId/students', getStudentsInCourse);
router.post('/attendance', markAttendance);
router.get('/submissions', getTeacherSubmissions);
router.post('/assignment', createAssignment);
router.put('/submission/:submissionId/grade', gradeSubmission);

module.exports = router;