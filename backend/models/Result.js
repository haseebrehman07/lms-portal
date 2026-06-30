// backend/models/Result.js
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  semester: { 
    type: Number, 
    required: true 
  },
  totalMarks: { 
    type: Number, 
    required: true 
  },
  obtainedMarks: { 
    type: Number, 
    required: true 
  },
  gpa: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;