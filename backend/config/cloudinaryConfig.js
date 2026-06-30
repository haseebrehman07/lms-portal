// backend/config/cloudinaryConfig.js
const cloudinary = require('cloudinary'); // <-- Removed the .v2 from the import here!
const multer = require('multer');
require('dotenv').config();

const multerCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary;

// 1. Authenticate with Cloudinary (we manually add .v2 here for the config)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure the Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // We now pass the root object so Multer can find .v2 internally
  params: {
    folder: 'TechTitans_LMS/Fee_Receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, crop: 'limit' }] 
  }
});

// 3. Initialize Multer
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };