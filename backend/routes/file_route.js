const express = require('express');
const app = express();
const router = express.Router();
const multer = require('multer');
const path = require('path');
const TwitterUser = require('../models/user_schema');
const protectedRoute = require('../middleware/protected');

//serving static files from uploads directory
app.use('/uploads/images/', express.static(path.join(__dirname, 'images')));

//defining storage for the images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/'); //save images to the 'images' folder
    },
    filename: (req, file, cb) => {
        cb(null, `profile-pic-${Date.now()}${path.extname(file.originalname)}`);
    }
});

//file filter to allow only certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpg, .jpeg, .png files are allowed!'), false);
    }
};

//initialize upload variable
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 100 } // 100 MB limit
});

module.exports = upload;
