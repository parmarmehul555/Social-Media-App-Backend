const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    isGroupChat : {
        type:Boolean,
        default:false
    },
    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    }],
    latestMessage:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'Message'
    },
    groupImage:{
        type:String,
        default:'https://res.cloudinary.com/de0punalk/image/upload/v1707397450/paslibbfdsgtyxe5rqhu.png'
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('Chat',chatSchema);