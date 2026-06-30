// backend/models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  courseCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  semesterDesignated: { 
    type: Number, 
    required: true 
  },
  credits: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;