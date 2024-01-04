const express = require('express');
const userLogedIn = require('../middlewares/userLogedIn');
const Chat = require('../model/Chat');
const chatRouter = express.Router();

//access chats : 
chatRouter.post('/accesschat', userLogedIn, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) return res.status(401).json({ "MSG": "User id not found!!" });

        const isChat = await Chat.find({
            $and: [
                { receivers: { $elemMatch: { $eq: req.user.id } } },
                { receivers: { $elemMatch: { $eq: userId } } },
            ]
        }).populate("receivers", "-password");

        if (isChat.length > 0) {
            return res.status(200).send(isChat);
        }
        else {
            var newChat = new Chat({ receivers: [req.user.id, userId] });
        }
        const fullChat = await newChat.populate("receivers", "-password")
        await fullChat.save();
        res.status(200).json(fullChat);
    } catch (error) {
        return res.status(500).json(error.message);
    }
});

//fetch all chats of user : 
chatRouter.get('/fetchchats', userLogedIn, async (req, res) => {
    try {
        const allChats = await Chat.find({ receivers: { $elemMatch: { $eq: req.user.id } } }).populate('receivers', '-password');
        res.status(200).json(allChats)
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

//create group : 
chatRouter.post('/creategroup', userLogedIn, async (req, res) => {
    try {
        if (!(req.body.groupName)) return res.status(400).send("Can not create group!!");

        let groupMembers = await JSON.parse(req.body.groupMembers);

        groupMembers.push(req.user.id);

        if (groupMembers.length > 2) {

            const newGroup = await new Chat({
                groupName: req.body.groupName,
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
    } catch (error) {
        console.log(error.message)
        return res.status(500).json(error.message);
    }
})

//add member in group :
chatRouter.put('/addgroupmember', userLogedIn, async (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId) return res.status(400).json("group not found!!");

        const newMember = JSON.parse(req.body.newMember);

        await Chat.findOneAndUpdate({ _id: chatId }, { receivers: { $push: newMember } })
            .then((data) => {
                res.status(200).json(data);
            });
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

module.exports = chatRouter