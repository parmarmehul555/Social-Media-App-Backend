const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const userLogedIn = require('../middlewares/userLogedIn');
const upload = require('../middlewares/multer');
const uploadCloudinary = require('../middlewares/cloudnery');
const { default: mongoose } = require('mongoose');

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

//Get User : 
userRouter.get('/userdetails', userLogedIn, async (req, res) => {
    try {
        const isUser = await User.findOne({ _id: req.user.id });

        if (!isUser) return res.status(404).json("User not found!!");

        res.status(200).json({ isUser });
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
});

//Follow User :
userRouter.put('/follow/:userId', userLogedIn, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ "ERROR": "Invalid user id!!" });

        if (req.params.userId == req.user.id) return res.status(400).json({ "ERROR": "You can not follow your self!!" });

        const newFollowing = await User.findOne({ _id: req.user.id });

        if (!newFollowing) return res.status(400).json({ "ERROR": "Can not find user!!" });

        newFollowing.following.push(req.params.userId);
        newFollowing.followingCount = newFollowing.following.length;
        await newFollowing.save();

        const newFollower = await User.findOne({ _id: req.params.userId });

        if (!newFollower) return res.status(400).json({ "ERROR": "Can not find user!!" });

        newFollower.followers.push(req.user.id);
        newFollower.followerCount = newFollower.followers.length;
        await newFollower.save();

        const updatedUser = await newFollowing
            .populate('following', '-password')
        // .populate('followers', '-password');
        res.status(200).json(updatedUser);
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error while following :: ${error}` });
    }
});

//Unfollow User :
userRouter.put('/unfollow/:userId', userLogedIn, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ "ERROR": "Invalid user id!!" });

        if (req.params.userId == req.user.id) return res.status(400).json({ "ERROR": "You can not unfollow your self!!" });

        const user = await User.findOne({ _id: req.user.id });

        if (!user) return res.status(400).json({ "ERROR": "can not find user!!" });

        for (i in user.following) {
            if (user.following[i] == req.params.userId) {
                user.following.splice(i, 1);
                user.followingCount = user.following.length;
                await user.save();
                const updatedUser = await user.populate('following', '-password');
                return res.status(200).json(updatedUser);
            }
        }

        res.status(401).json({ "Message": "you are not following this user!!" });
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error while following :: ${error}` });
    }
});

//Remove Follower :
userRouter.put('/removefollower/:userId', userLogedIn, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ "ERROR": "Invalid user id!!" });

        if (req.params.userId == req.user.id) return res.status(400).json({ "ERROR": "You can not unfollow your self!!" });

        const user = await User.findOne({ _id: req.user.id });

        if (!user) return res.status(400).json({ "ERROR": "can not find user!!" });

        for (i in user.followers) {
            if (user.followers[i] == req.params.userId) {
                user.followers.splice(i, 1);
                user.followerCount = user.followers.length;
                await user.save();
                const updatedUser = await user.populate('followers', '-password');
                return res.status(200).json(updatedUser);
            }
        }

        res.status(401).json({ "Message": "you have not this follower!!" });
    } catch (error) {
        return res.status(500).json({ "ERROR": `Internal server error while removing follower :: ${error}` });
    }
});

//get All user which is followed by LOGED IN user:
userRouter.get('/getAllmyUsers', userLogedIn, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id });

        if (!user) return res.status(400).json({ "ERROR": "User not found!!" });

        const data = await user.populate('following')

        res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal server error " + error });
    }
})

module.exports = userRouter;