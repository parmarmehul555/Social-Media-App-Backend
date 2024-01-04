const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    groupName:{
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
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('Chat',chatSchema);