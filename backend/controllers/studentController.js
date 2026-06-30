// backend/controllers/studentController.js
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');

// @desc    Get all courses a student is enrolled in (Past & Present)
// @route   GET /api/student/enrollments
const getStudentEnrollments = async (req, res) => {
  try {
    // req.user._id comes from our protect middleware
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title courseCode credits semesterDesignated') // Pulls in course details
      .sort({ semesterEnrolled: -1 }); // Shows newest semesters first

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
  }
};

// @desc    Get student timetable based on their active enrollments
// @route   GET /api/student/timetable
const getStudentTimetable = async (req, res) => {
  try {
    // 1. Find the student's current enrollments (e.g., assuming semester '6' for SE-6th)
    const currentEnrollments = await Enrollment.find({ 
      student: req.user._id, 
      semesterEnrolled: '6' // In a full app, this would be dynamic based on the current term
    });

    // 2. Extract the Course IDs they are taking
    const courseIds = currentEnrollments.map(enrollment => enrollment.course);

    // 3. Find the timetable slots for those specific courses
    const schedule = await Timetable.find({ course: { $in: courseIds } })
      .populate('course', 'title courseCode')
      .populate('teacher', 'name')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable', error: error.message });
  }
};

// @desc    Calculate attendance percentage and 75% eligibility for a specific course
// @route   GET /api/student/attendance/:courseId
const checkAttendanceEligibility = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Count total lectures recorded for this student in this course
    const totalClasses = await Attendance.countDocuments({ 
      course: courseId, 
      student: studentId 
    });

    // Count only the 'Present' records
    const attendedClasses = await Attendance.countDocuments({ 
      course: courseId, 
      student: studentId, 
      status: 'Present' 
    });

    // Calculate percentage
    let percentage = 0;
    if (totalClasses > 0) {
      percentage = (attendedClasses / totalClasses) * 100;
    }

    res.json({
      courseId,
      totalClasses,
      attendedClasses,
      percentage: parseFloat(percentage.toFixed(2)),
      isEligible: percentage >= 75 // The strict boolean flag your frontend will use
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating attendance', error: error.message });
  }
};

// @desc    Get open assignments for a student's enrolled courses
// @route   GET /api/student/assignments
const getStudentAssignments = async (req, res) => {
  try {
    // 1. Find what courses the student is taking
    const enrollments = await Enrollment.find({ student: req.user._id });
    const courseIds = enrollments.map(e => e.course);

    // 2. Fetch assignments linked to those specific courses
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title courseCode');

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// @desc    Upload an assignment submission
// @route   POST /api/student/submission
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileUrl } = req.body;

    // In a real app, fileUrl would be a link from an S3 bucket or Cloudinary after an upload.
    // For now, it will be a string representing the file link.
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      fileUrl
    });

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

// @desc    Get available courses (courses the student is NOT enrolled in)
// @route   GET /api/student/courses/available
const getAvailableCourses = async (req, res) => {
  try {
    // 1. Find the IDs of courses the student is already taking
    const enrollments = await Enrollment.find({ student: req.user._id });
    const enrolledCourseIds = enrollments.map(e => e.course);

    // 2. Fetch all courses where the ID is NOT IN ($nin) the enrolled list
    const availableCourses = await Course.find({ _id: { $nin: enrolledCourseIds } });
    
    res.json(availableCourses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available courses', error: error.message });
  }
};

// @desc    Enroll in a new course
// @route   POST /api/student/enroll
const enrollInCourse = async (req, res) => {
  try {
    const { courseId, section } = req.body;

    // Safety Check: Prevent double enrollment
    const existingEnrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course.' });
    }

    const course = await Course.findById(courseId);

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      semesterEnrolled: course.semesterDesignated.toString(), // Pull semester from the course data
      section: section || 'A' // Default to Section A for now
    });

    res.status(201).json({ message: `Successfully enrolled in ${course.title}!` });
  } catch (error) {
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
};

const FeeVoucher = require('../models/FeeVoucher');

// ... your existing student controller functions ...

// POST: Upload Fee Receipt
const uploadFeeReceipt = async (req, res) => {
  try {
    // 1. Check if Multer actually caught a file
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    // DEBUG: This will print the exact Cloudinary object to your terminal so you can see the magic!
    console.log('Cloudinary File Object:', req.file);

    // 2. Safely extract the secure URL regardless of which label the package version uses
    const cloudinaryUrl = req.file.path || req.file.secure_url || req.file.url; 

    if (!cloudinaryUrl) {
      return res.status(500).json({ message: 'Upload succeeded, but no URL was returned.' });
    }

    // 3. Create the Fee Record in MongoDB
    const newVoucher = new FeeVoucher({
      student: req.user.id, 
      proofUrl: cloudinaryUrl,
      status: 'Pending Verification'
    });

    await newVoucher.save();

    res.status(201).json({ 
      message: 'Fee receipt uploaded and sent to Admin for verification.',
      voucher: newVoucher
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error processing fee upload.' });
  }
};
const getStudentFees = async (req, res) => {
  try {
    const fees = await FeeVoucher.find({ student: req.user.id }).sort({ submittedAt: -1 });
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching fee history.' });
  }
};

const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user.id, 
      isRead: false 
    }).sort({ createdAt: -1 }); // Newest first
    
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

// PUT: Mark a specific notification as read
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notification.' });
  }
};

module.exports = { 
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
};