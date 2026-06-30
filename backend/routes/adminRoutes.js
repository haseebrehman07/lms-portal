// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Course = require('../models/Course'); 
const Timetable = require('../models/Timetable');
const FeeVoucher = require('../models/FeeVoucher');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// POST: Allocate a new course and bind it to a teacher
router.post('/allocate', async (req, res) => {
  try {
    const { title, courseCode, teacherEmail, roomNo, dayOfWeek, semesterDesignated, section } = req.body;

    const teacher = await User.findOne({ email: teacherEmail, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Trainer with this email not found.' });
    }

    const newCourse = new Course({
      title,
      courseCode,
      credits: 3, 
      semesterDesignated 
    });
    const savedCourse = await newCourse.save();

    const newTimetable = new Timetable({
      course: savedCourse._id,
      teacher: teacher._id,
      roomNo,
      dayOfWeek,
      startTime: '09:00 AM', 
      endTime: '12:00 PM',
      section: section || 'A', 
      semesterDesignated       
    });
    await newTimetable.save();

    res.status(201).json({ message: 'Course successfully allocated!' });
  } catch (error) {
    console.error(error);
    // Catch MongoDB Duplicate Key Error (Prevents the app from crashing!)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Allocation failed: A course with this exact Course Code already exists.' });
    }
    res.status(500).json({ message: 'Server error during allocation.' });
  }
});

router.get('/fees', async (req, res) => {
  try {
    // .populate() grabs the actual student's name and email using their ID
    const vouchers = await FeeVoucher.find()
      .populate('student', 'name email') 
      .sort({ submittedAt: -1 }); // Sorts by newest first
      
    res.status(200).json(vouchers);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Server error fetching fee records.' });
  }
});

// PUT: Update the status of a specific voucher (Approve/Reject)
router.put('/fees/:id', async (req, res) => {
  try {
    // Extract both status and the approved amount from the frontend
    const { status, amountApproved } = req.body;
    
    const updatedVoucher = await FeeVoucher.findByIdAndUpdate(
      req.params.id,
      { 
        status: status,
        amountApproved: amountApproved || 0 // Save the amount (or 0 if rejected)
      },
      { returnDocument: 'after' }
    );

    if (!updatedVoucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    res.status(200).json({ message: `Voucher successfully marked as ${status}` });
  } catch (error) {
    console.error('Error updating fee status:', error);
    res.status(500).json({ message: 'Server error updating voucher.' });
  }
});

router.post('/notify/all', async (req, res) => {
  try {
    const { title, message } = req.body;

    // 1. Find every single user who has the role of 'student'
    const students = await User.find({ role: 'student' });

    // 2. Create an array of notification objects
    const notifications = students.map(student => ({
      recipient: student._id,
      title: title,
      message: message,
      isRead: false
    }));

    // 3. Insert them all into the database at once (much faster than a loop!)
    await Notification.insertMany(notifications);

    res.status(201).json({ message: `Successfully sent notification to ${students.length} students.` });
  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ message: 'Server error sending notifications.' });
  }
});

router.post('/provision', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // 2. Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase() // Ensure it saves as 'student' or 'teacher'
    });

    if (user) {
      res.status(201).json({
        message: `${role} account created successfully for ${name}!`,
        userId: user._id
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error('Provisioning error:', error);
    res.status(500).json({ message: 'Server Error during account creation' });
  }
});

module.exports = router;