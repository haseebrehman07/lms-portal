// backend/controllers/teacherController.js
const Timetable = require('../models/Timetable');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
// @desc    Get teacher's timetable and assigned subjects
// @route   GET /api/teacher/timetable
const getTeacherTimetable = async (req, res) => {
  try {
    // Notice the .populate('course') added right after the .find()
    const schedule = await Timetable.find({ teacher: req.user.id })
      .populate('course') 
      .sort({ dayOfWeek: 1 }); 

    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching timetable.' });
  }
};

// @desc    Get all students enrolled in a specific course (to take attendance)
// @route   GET /api/teacher/course/:courseId/students
const getStudentsInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email') // Pulls the student's name and email
      .select('student section semesterEnrolled'); // Only sends relevant data back

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};


// @desc    Mark attendance for a student
// @route   POST /api/teacher/attendance
const markAttendance = async (req, res) => {
  try {
    // The frontend is specifically sending courseId and studentId
    const { courseId, studentId, status } = req.body;

    // Safety Check: Make sure we have all the data
    if (!courseId || !studentId || !status) {
      return res.status(400).json({ message: 'Missing required attendance fields' });
    }

    // Create the attendance record
    const attendance = await Attendance.create({
      course: courseId,
      student: studentId,
      status: status,
      date: new Date() // Automatically logs today's date
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// @desc    Get all submissions for the teacher's assignments
// @route   GET /api/teacher/submissions
const getTeacherSubmissions = async (req, res) => {
  try {
    // 1. Find all assignments created by this specific teacher
    const assignments = await Assignment.find({ teacher: req.user._id });
    const assignmentIds = assignments.map(a => a._id);

    // 2. Find all submissions linked to those assignments
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate('student', 'name') // Get the student's name
      .populate('assignment', 'title'); // Get the assignment's title

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// @desc    Create a new assignment slot for a course
// @route   POST /api/teacher/assignment
const createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, deadline } = req.body;

    const assignment = await Assignment.create({
      course: courseId,
      teacher: req.user._id,
      title,
      description,
      deadline
    });

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// @desc    Grade a student's submission
// @route   PUT /api/teacher/submission/:submissionId/grade
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, teacherFeedback } = req.body;

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { grade, teacherFeedback },
      { new: true } // Returns the updated document
    ).populate('student', 'name');

    res.json({ message: 'Graded successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
};

module.exports = { 
  getTeacherTimetable, 
  getStudentsInCourse, 
  markAttendance,
  getTeacherSubmissions,
  createAssignment,
  gradeSubmission,
};