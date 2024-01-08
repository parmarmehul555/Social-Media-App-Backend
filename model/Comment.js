const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    commentedUser:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    commentData: {
        type: String,
        trim: true,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
},{timestamps:true});

module.exports = mongoose.model('Comment', commentSchema);