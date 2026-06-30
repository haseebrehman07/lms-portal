// backend/models/FeeVoucher.js
const mongoose = require('mongoose');

const feeVoucherSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: String,
    required: true,
    default: '6' // Defaulting to your current semester
  },
  amount: {
    type: Number,
    required: true,
    default: 45000 // Standard semester fee
  },
  amountApproved: {
    type: Number,
    default: 0 // New field! How much the admin actually verified
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Pending Verification', 'Approved', 'Rejected'],
    default: 'Pending Verification'
  },
  proofUrl: {
    type: String, // This is where the Cloudinary link goes!
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FeeVoucher', feeVoucherSchema);