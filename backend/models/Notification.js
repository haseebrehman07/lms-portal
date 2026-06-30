// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Who is receiving this?
  },
  title: {
    type: String,
    required: true,
    default: 'Portal Update'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false // Turns to true when the student clicks "Acknowledge"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);