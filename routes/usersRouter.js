const express = require('express');
const router = express.Router();
const isLoggedin = require('../middlewares/isLoggedin');
const multerUpload = require('../config/multer-config'); // adjust path to where multer is defined

const {
    registerUser,
    loginUser,
    upload: uploadProfileImage,
    logout,
} = require('../controller/authController');

// Routes
router.get('/', (req, res) => {
    res.send('Hey it is working');
});

router.post('/register', registerUser);
router.post('/login', loginUser);

// ✅ Fix here: add multer middleware before controller
router.post('/profile', isLoggedin, multerUpload.single('profileImage'), uploadProfileImage);

router.get('/logout', logout);

module.exports = router;
