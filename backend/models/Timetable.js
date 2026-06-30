// backend/models/Timetable.js
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  semesterDesignated: { 
    type: Number, 
    required: true 
  },
  section: { 
    type: String, 
    required: true 
  },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true // e.g., "09:00 AM"
  },
  endTime: { 
    type: String, 
    required: true // e.g., "10:30 AM"
  },
  roomNo: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;