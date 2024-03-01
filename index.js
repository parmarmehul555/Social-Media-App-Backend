const connectDB = require('./db');
const express = require('express');
const cors = require('cors');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const postRouter = require('./routes/post');
const { Server } = require('socket.io');
const messaageRouter = require('./routes/message');
const dotenv = require('dotenv').config();

connectDB()
    .then(() => {
        const app = express();

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(cors());

        app.use('/user',   userRouter);
        app.use('/user/chat', chatRouter);
        app.use('/user/post', postRouter);
        app.use('/user/oldchat', messaageRouter);

        expressServer = app.listen(process.env.PORT || 2005, () => {
            console.log(`Server started @ ${process.env.PORT || 2005}`);
        });

        const io = new Server(expressServer, {
            cors: 'http://localhost:3000'
        });

        io.on('connection', (socket) => {
            console.log(`socket connected socket id ${socket.id}`);
            
            socket.on('join chat',(chatId)=>{
                socket.join(chatId)
                console.log('user join the chat :: ',chatId);
            });

            socket.on('send message',(data)=>{
                io.to(data.chatId).emit('new message',data);
            });

            socket.on('typing',(chatId)=>{
                console.log("===================",chatId);
                socket.broadcast.in(chatId).emit('typing');
            })

            socket.on('stop typing',(chatId)=>{
                console.log("===================",chatId);
                socket.broadcast.in(chatId).emit('stop typing');
            })

            socket.on('send comment',(comment)=>{
                io.emit('new comment',comment);
            })

        })

    }).catch((error) => {
        console.log(`app buliding failed ${error}`);
        process.exit(1);
    })