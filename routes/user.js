const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const userLogedIn = require('../middlewares/userLogedIn');
const upload = require('../middlewares/multer');
const uploadCloudinary = require('../middlewares/cloudnery');

//Sign-up Route :
userRouter.post('/signup', async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        const isUser = await User.findOne({ $or: [{ userName }, { email }] });

        if (isUser) return res.status(401).json("User already exists!!");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            userName: userName,
            email: email,
            password: hashedPassword
        })

        await newUser.save();

        const payload = {
            id: newUser._id
        }

        const token = jwt.sign(payload, process.env.PRIVATE_KEY);

        res.status(200).json({ token });
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
    }
});

//Log-in Route : 
userRouter.post('/login', async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        const isUser = await User.findOne({ $or: [{ userName }, { email }] });

        if (!isUser) return res.status(401).json("Please login with valied credentials!!");

        const checkPass = await bcrypt.compare(password, isUser.password);

        if (!checkPass) return res.status(401).json("Please login with valied credentials!!");

        const payload = {
            id: isUser._id
        }

        const token = jwt.sign(payload, process.env.PRIVATE_KEY);

        res.status(200).json({ token })
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
    }
});

//Get User details : 
userRouter.get('/userdetails', userLogedIn, async (req, res) => {
    try {
        const isUser = await User.findOne({ _id: req.user.id });

        if (!isUser) return res.status(404).json("User not found!!");

        res.status(200).json({ "User": isUser });
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
    }
});

//Change Password : 
userRouter.put('/changepassword', userLogedIn, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const isUser = await User.findOne({ _id: req.user.id });

        if (!isUser) return res.status(401).json("Something wents wrong!!");

        const checkPass = bcrypt.compareSync(oldPassword, isUser.password);

        if (!checkPass) return res.status(401).json("Something wents wrong!!");

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        isUser.password = hashedPassword;
        await isUser.save();

        res.status(200).json("Password changed successfully!!");
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
    }
});

//Forgot password :
userRouter.put('/forgotpassword', async (req, res, next) => {
    try {
        const { userName, email, newPassword } = req.body;

        const isUser = await User.findOne({ $or: [{ userName }, { email }] });

        if (!isUser) return res.status(401).json("can not enter new password user not found!!");

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        isUser.password = hashedPassword;
        await isUser.save();

        res.status(200).json("Password saved successfully!!");
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
    }
});

//Edit User profile :
userRouter.put('/edituserprofile', userLogedIn, upload.single('user-profile-img'), async (req, res) => {
    try {
        if (!(req.file)) {
            try {
                const { bio } = req.body;
                const isUser = await User.findOne({ _id: req.user.id });
                isUser.bio = bio;
                await isUser.save();
                res.status(200).json("Data updated successfully!!");
            } catch (error) {
                return res.status(500).json({ "ERROR": `Internal server error while changeing profile :: ${error}` });
            }
        }
        else {
            try {
                const img = await uploadCloudinary(req.file.path);
                const isUser = await User.findOne({ _id: req.user.id });
                isUser.userImg = img;
                await isUser.save();
                res.status(200).json("Profile updaed successfully!!");
            } catch (error) {
                return res.status(500).json({ "ERROR": `Internal server error :: ${error}` });
            }
        }
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error while changeing profile :: ${error}` });
    }
})

module.exports = userRouter;