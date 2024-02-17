const express = require('express');
const userLogedIn = require('../middlewares/userLogedIn');
const Chat = require('../model/Chat');
const Message = require('../model/Message');
const { default: mongoose } = require('mongoose');
const messaageRouter = express.Router();

messaageRouter.get('/chat/:chatId', userLogedIn, async (req, res) => {
    try {
        const { chatId } = req.params;

        const selectedChat = await Chat.findById({ _id: chatId });

        if (!selectedChat) return res.status(401).json({ "Message": "Chat not found!!" });

        if (!selectedChat.receivers.includes(req.user.id)) return res.status(401).json({ "Message": "User is not part of this chat!!" });

        const messages = await Message.find({ chatId: chatId }).sort({ createdAt: 1 });

        return res.status(200).json(messages );
    } catch (error) {
        return res.status(500).json({ "ERROR": "Error while getting your old chats :: " + error });
    }
});

messaageRouter.post('/sendmessage/:chatId', userLogedIn, async (req, res) => {
    console.log(req.body,"   ",req.params.chatId);
    try {
        const { content } = req.body;
        const { chatId } = req.params;

        const selectedChat = await Chat.findById({ _id: chatId });

        if (!selectedChat) return res.status(401).json({ "Message": "Chat not found!!" });

        const newMessaage = new Message({
            chatId: chatId,
            content: content || "",
            sender: new mongoose.Types.ObjectId(req.user.id)
        });

        await newMessaage.save();

        await Chat.findOneAndUpdate({_id:chatId},{$set:{latestMessage:new mongoose.Types.ObjectId(newMessaage._id)}},{new : true});

        // selectedChat.latestMessage = newMessaage._id;
        // await selectedChat.save();

        res.status(200).json({newMessaage});
    } catch (error) {
        return res.status(500).json({ "ERROR": "Error while sending message :: " + error });
    }
})

module.exports = messaageRouter;