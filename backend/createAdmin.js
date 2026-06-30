// backend/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Replace with your exact User model path if different
const User = require('./models/User'); 

const createSuperAdmin = async () => {
  try {
    // 1. Connect to your LIVE database using the .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to Live Database');

    // 2. Check if an admin already exists to prevent duplicates
    const existingAdmin = await User.findOne({ email: 'admin@techtitans.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists! Use email: admin@techtitans.com');
      process.exit();
    }

    // 3. Hash the master password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TechTitansAdmin2026!', salt);

    // 4. Create the Admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@techtitans.com',
      password: hashedPassword,
      role: 'admin' // Make sure this matches exactly what your login route expects
    });

    await adminUser.save();
    console.log('🎉 MASTER KEY CREATED!');
    console.log('Email: admin@techtitans.com');
    console.log('Password: TechTitansAdmin2026!');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();