const express = require('express');
const userLogedIn = require('../middlewares/userLogedIn');
const Chat = require('../model/Chat');
const upload = require('../middlewares/multer');
const uploadCloudinary = require('../middlewares/cloudnery');
const chatRouter = express.Router();

//access chats : 
chatRouter.post('/accesschat', userLogedIn, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) return res.status(401).json({ "MSG": "User id not found!!" });

        const isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { receivers: { $elemMatch: { $eq: req.user.id } } },
                { receivers: { $elemMatch: { $eq: userId } } },
            ]
        }).populate("receivers", "-password").populate('latestMessage');;

        if (isChat.length > 0) {
            return res.status(200).send(isChat);
        }
        else {
            var newChat = new Chat({ name: "one on one chat", receivers: [req.user.id, userId] });
        }
        const fullChat = await newChat.populate("receivers", "-password").populate('latestMessage');
        await fullChat.save();
        res.status(200).json(fullChat);
    } catch (error) {
        return res.status(500).json(error.message);
    }
});

//fetch all chats of user : 
chatRouter.get('/fetchchats', userLogedIn, async (req, res) => {
    try {
        const allChats = await Chat.find({ receivers: { $elemMatch: { $eq: req.user.id } } }).populate('receivers', '-password').populate('latestMessage');
        res.status(200).json(allChats)
    } catch (error) {
        return res.status(500).json(error.message);
    }
});

//GET Existing Chat :
chatRouter.get('/existingchat/:chatId', userLogedIn, async (req, res) => {
    try {
        const { chatId } = req.params;

        if (!chatId) return res.status(401).json({ "ERROR": "please enter all data!!" });

        const myChat = await Chat.findOne({ _id: chatId }).populate('receivers', '-password');

        res.status(200).send(myChat);
    } catch (error) {
        return res.status(500).json(error.message);
    }
});

//create group : 
chatRouter.post('/creategroup', userLogedIn, upload.single('group-img'), async (req, res) => {
    console.log("=====================", req.body);
    try {
        if (req.file) {
            if (!(req.body.groupName)) return res.status(400).send("Can not create group!!");

            let groupMembers = await JSON.parse(req.body.groupMembers);

            groupMembers.push(req.user.id);

            const groupImage = await uploadCloudinary(req.file.path);

            if (groupMembers.length > 2) {
                const newGroup = await new Chat({
                    name: req.body.groupName,
                    isGroupChat: true,
                    groupAdmin: req.user.id,
                    receivers: groupMembers,
                    groupImage
                })
                await newGroup.save();
                const fullNewGroup = await Chat.find({ _id: newGroup._id })
                    .populate("receivers", "-password")
                    .populate("groupAdmin", "-password")

                res.status(200).json(fullNewGroup);
            }
        }
        else {
            if (!(req.body.groupName)) return res.status(400).send("Can not create group!!");

            let groupMembers = await JSON.parse(req.body.groupMembers);

            groupMembers.push(req.user.id);

            if (groupMembers.length > 2) {
                const newGroup = await new Chat({
                    name: req.body.groupName,
                    isGroupChat: true,
                    groupAdmin: req.user.id,
                    receivers: groupMembers,

                })
                await newGroup.save();
                const fullNewGroup = await Chat.find({ _id: newGroup._id })
                    .populate("receivers", "-password")
                    .populate("groupAdmin", "-password")

                res.status(200).json(fullNewGroup);
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(error.message);
    }
})

//add member in group :
chatRouter.put('/addgroupmember', userLogedIn, async (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId) return res.status(400).json("group not found!!");

        const newMember = JSON.parse(req.body.newMember);

        const isChat = await Chat.findOne({ _id: chatId });

        let isMemberFound = false;
        newMember.forEach((element) => {
            isChat.receivers.some((user) => {
                if (user._id == element) {
                    isMemberFound = true;
                }
            })
            if (!isMemberFound) {
                isChat.receivers.push(element);
            }
        });

        await isChat.save();
        await isChat.populate("receivers", "-password");
        res.status(200).send(isChat);
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

//remove group member : 
chatRouter.delete('/removegroupmember/:deleteId-:chatId', userLogedIn, async (req, res) => {
    try {
        const isChat = await Chat.findOne({ _id: req.params.chatId });

        if (!isChat) return res.status(401).json("Group not found!!");

        for (i in isChat.receivers) {
            if (isChat.receivers[i] == req.params.deleteId) {
                await isChat.receivers.splice(i, 1);
                break;
            }
        }
        await isChat.save();
        res.status(200).send("Member deleted successfully!!");
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

//rename group name:
chatRouter.put('/updategroup/:chatId', userLogedIn, upload.single('group-profile-picture'), async (req, res) => {
    try {
        if (req.file) {
            const { chatId } = req.params;
            const { groupNewName } = req.body;
            if (!chatId) return res.status(401).json({ "ERROR": "can not change group picture!! chat id not found!" });
            const imgURL = await uploadCloudinary(req.file.path);
            const groupChat = await Chat.findOne({ _id: chatId });
            groupChat.name = groupNewName;
            groupChat.groupImage = imgURL;
            await groupChat.save();
            return res.status(200).send(groupChat);
        } else {
            const { chatId } = req.params;
            const { groupNewName } = req.body;

            const isChat = await Chat.findOne({ _id: chatId });

            if (!isChat) return res.status(401).json("Group not found!!");

            isChat.name = groupNewName;
            isChat.save();
            res.status(200).send("name changed successfully!!");
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});

//GET all members of group 
chatRouter.get('/getallmembers/:groupId', userLogedIn, async (req, res) => {
    try {
        console.log(req.params.groupId);
        const groupMembrs = await Chat.findOne({ _id: req.params.groupId }).populate('receivers','-password');
        res.status(200).send(groupMembrs);
    } catch (error) {
        return res.status(500).json({ "ERROR": "Internal server error ==>> ", error });
    }
});

module.exports = chatRouter