const express = require("express");
const adminRouter = express.Router();
const jwt = require('jsonwebtoken');
const jwt_sec = 'Admin';
const bcrypt = require('bcryptjs');
const Admin = require("../model/Admin");
const adminLogedIn = require("../middlewares/adminLogedIn");
const { default: mongoose } = require("mongoose");
const User = require("../model/User");
const Post = require("../model/Post");

//Admin Login
adminRouter.post('/login', async (req, res) => {
    try {
        const { adminEmail, adminPassword } = req.body;

        if (!adminEmail || !adminPassword) return res.status(400).json({ "ERROR": "Please enter all field!!" });

        const admin = await Admin.findOne({ adminEmail });

        if (!admin) return res.status(400).json({ "ERROR": "Invalid Email!!" });

        const chechPass = bcrypt.compare(adminPassword, admin.adminPassword);

        if (!chechPass) return res.status(400).json({ "ERROR": "Invalid password!!" });

        const payload = {
            id: admin._id
        }

        const token = jwt.sign(payload, jwt_sec);

        console.log(payload);

        res.status(200).json({ token, "Message": "Log in successfull!" });

    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal Server Error ", error });
    }
});

//Admin signup
adminRouter.post('/signup', async (req, res) => {
    try {
        const { adminName, adminEmail, adminPassword } = req.body;

        if (!adminEmail || !adminName || !adminPassword) return res.status(400).json({ "ERROR": "Please enter all field!!" });

        const admin = await Admin.findOne({ adminEmail });

        if (admin) return res.status(400).json({ "ERROR": "Invalid Email!!" });

        const hashedPass = bcrypt.hashSync(adminPassword, 10);

        const newAdmin = await new Admin({
            adminName,
            adminEmail,
            adminPassword: hashedPass
        });

        const payload = {
            id: newAdmin._id
        }

        await newAdmin.save();

        const token = jwt.sign(payload, jwt_sec);

        res.status(200).json({ token });

    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal Server Error ", error });
    }
});

//Get admin
adminRouter.get('/getadmin', adminLogedIn, async (req, res) => {
    try {
        const admin = await Admin.findOne({ _id: req.admin.id });

        if (!admin) return res.status(401).json({ "ERROR": "Unauthorized!!!!" });

        res.status(200).json(admin);
    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal Server Error " + error });
    }
});

//Get all USERS : 
adminRouter.get('/getallusers', adminLogedIn, async (req, res) => {
    try {
        const data = await User.find();

        if (!data) return res.status(400).json({ "ERROR": "Can not get all user!!" });

        res.status(200).send(data);
    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal servar error ===>>> " + error });
    }
});

//Get User By Id :
adminRouter.get('/getuser/:userId',adminLogedIn,async (req,res)=>{
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(401).json({"ERROR":"Can not get user!! Invalied user Id!!"});

        const data = await User.findOne({_id:req.params.userId});
        const postData = await Post.find({userId:data._id});

        if(!data) return res.status(400).json({"ERROR":"Can not get user!!"});

        res.status(200).send({data,postData});
    } catch (error) {
        return res.status(500).json({"ERROR":"Internal server error ==>> "+error});
    }
})

//Delete User
adminRouter.delete('/deleteuser/:userId',adminLogedIn,async (req,res)=>{
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(401).json({"ERROR":"Can not get user!! Invalied user Id!!"});

        await User.deleteOne({_id:req.params.userId});

        res.status(200).json({"Message":"User deleted successfully!!"});
    } catch (error) {
        return res.status(500).json({"ERROR":"Internal server error ==>> "+error});
    }
})

adminRouter.delete('/deletepost/:postId',adminLogedIn,async (req,res)=>{
    try {
        await Post.deleteOne({_id:req.params.postId});

        res.status(200).json({"Message":"Post deleted successfully!"});
    } catch (error) {
        return res.status(500).json({"ERROR":"Internal server error ==>> "+error})
    }
});

module.exports = adminRouter