// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Attendance = require('./models/Attendance');
const Timetable = require('./models/Timetable');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');

dotenv.config();
connectDB();

const seedDatabase = async () => {
  try {
    // 1. Wipe everything clean
    await User.deleteMany();
    await Course.deleteMany();
    await Enrollment.deleteMany();
    await Attendance.deleteMany();
    await Timetable.deleteMany();
    await Assignment.deleteMany();
    await Submission.deleteMany();

    // 2. Create Users
    const studentUser = await User.create({
      name: 'Haseeb Ur Rehman',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    });

    const teacherUser = await User.create({
      name: 'Professor Zubair Sultan',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });

    // 3. Create Courses (Adding the missing SQE course!)
    const course1 = await Course.create({
      title: 'Full Stack Web Development',
      courseCode: 'SE-311',
      semesterDesignated: 6,
      credits: 3
    });

    const course2 = await Course.create({
      title: 'Software Quality Engineering',
      courseCode: 'SE-312',
      semesterDesignated: 6,
      credits: 3
    });

    // 4. Create Enrollment (Student is ONLY enrolled in Web Dev)
    await Enrollment.create({
      student: studentUser._id,
      course: course1._id,
      semesterEnrolled: '6',
      section: 'A'
    });

    // 5. Create Timetable
    await Timetable.create({
      course: course1._id,
      teacher: teacherUser._id, 
      semesterDesignated: 6,
      section: 'A',
      dayOfWeek: 'Monday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      roomNo: 'Lab 1'
    });

    // 6. Create Dummy Attendance (The missing math!)
    // 3 total classes. 2 Present, 1 Absent = 66.67%
    await Attendance.create({ student: studentUser._id, course: course1._id, status: 'Present' });
    await Attendance.create({ student: studentUser._id, course: course1._id, status: 'Present' });
    await Attendance.create({ student: studentUser._id, course: course1._id, status: 'Absent' });

    console.log('✅ Database Seeded Successfully with BOTH Courses and Attendance Math!');
    process.exit();
  } catch (error) {
    console.error('❌ Error Seeding Data:', error);
    process.exit(1);
  }
};

seedDatabase();