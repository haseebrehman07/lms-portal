// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudentEnrollments, 
  getStudentTimetable, 
  checkAttendanceEligibility,
  submitAssignment,
  getStudentAssignments,
  getAvailableCourses,
  enrollInCourse,
  uploadFeeReceipt,
  getStudentFees,
  getUnreadNotifications,
  markNotificationRead
} = require('../controllers/studentController');

const { protect, studentOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

router.use(protect, studentOnly);

router.get('/enrollments', getStudentEnrollments);
router.get('/timetable', getStudentTimetable);
router.get('/attendance/:courseId', checkAttendanceEligibility);

// MUST BE ABOVE MODULE.EXPORTS
router.get('/assignments', getStudentAssignments); 
router.post('/submission', submitAssignment);

router.get('/courses/available', getAvailableCourses);
router.post('/enroll', enrollInCourse);
router.get('/fees/history', getStudentFees);
router.post('/fee/upload', upload.single('receipt'), uploadFeeReceipt);
router.get('/notifications/unread', getUnreadNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;