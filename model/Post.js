const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    postURL: {
        type: String,
        required: true
    },
    postCaption: {
        type: String,
    },
    postLikes: {
        userLiked: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                isLiked: {
                    type: Boolean,
                    required: true,
                    default: false
                }
            }
        ],
        likeCount: {
            type: Number,
            default: 0
        }
    },
    postComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);