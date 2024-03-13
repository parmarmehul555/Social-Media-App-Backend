const express = require('express');
const postRouter = express.Router();
const userLogedIn = require('../middlewares/userLogedIn');
const upload = require('../middlewares/multer');
const uploadCloudinary = require('../middlewares/cloudnery');
const Post = require('../model/Post');
const mongoose = require('mongoose');
const Comment = require('../model/Comment');

//create new post : 
postRouter.post('/createpost', userLogedIn, upload.single('my-post'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ "ERROR": "File not found!!" });

        const postURL = await uploadCloudinary(req.file.path);

        const newPost = new Post({
            userId: req.user.id,
            postURL: postURL,
            postCaption: req.body.postCaption,
        });

        await newPost.save();
        res.status(200).json({ "Message": "Posted successfully!!" });
    } catch (error) {
        console.error('Error uploading post:', error.message);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//Get post by id: For user profile page ==>> Post details
postRouter.get('/getpost/:postId',userLogedIn,async (req,res)=>{
    try {
        const post = await Post.findOne({_id:req.params.postId});

        if(!post) return res.status(400).json({"ERROR":"Can not find post!!"});

        res.status(200).send(post);
    } catch (error) {
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//get all post of user :
postRouter.get('/getallpost', userLogedIn, async (req, res) => {
    try {
        if (!req.user.id) return res.status(401).json({ "ERROR": "User not exists!!" });
        const posts = await Post.find({ userId: req.user.id }).populate('userId', '-password').populate({ path: 'postComments', populate: { path: 'commentedUser', select: '-password' } });
        res.status(200).send(posts);
    } catch (error) {
        console.error('Error getting post:', error.message);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//get all psots :
postRouter.get('/getposts', userLogedIn, async (req, res) => {
    try {
        const posts = await Post.find().populate('userId', '-password').populate({ path: 'postComments', populate: { path: 'commentedUser', select: '-password' } });
        if (!posts) return res.status(400).json({ "ERROR": "Can not get posts!!" });

        res.status(200).send(posts);
    } catch (error) {
        console.error('Error getting post:', error.message);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//update existing post : 
postRouter.put('/updatepost', userLogedIn, async (req, res) => {
    try {
        const { postId, postCaption } = req.body;

        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ "ERROR": "Post not found!!" });

        if (!postCaption) return res.status(400).json({ "ERROR": "new caption not found!!" });

        await Post.findByIdAndUpdate({ _id: postId }, { $set: { postCaption } });

        res.status(200).json({ "Message": "Post updated successfully!!" });
    } catch (error) {
        console.error('Error updating post:', error.message);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//delete post :
postRouter.delete('/deletepost/:postId', userLogedIn, async (req, res) => {
    try {
        if (!req.user.id) return res.status(401).json({ "ERROR": "User not exists!!" });

        if (!req.params.postId || !mongoose.Types.ObjectId.isValid(req.params.postId)) return res.status(401).json({ "ERROR": "can not delete post!!" });

        await Post.deleteOne({ _id: req.params.postId });

        res.status(200).json({ "Message": "Post deleted successfully!!" });
    } catch (error) {
        console.error('Error getting post:', error.message);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//add likes or comments :
postRouter.put('/addlikesorcomments/:postId', userLogedIn, async (req, res) => {
    console.log("body is ", req.body);
    try {
        const { userId, commentData } = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.postId)) return res.status(400).json({ "ERROR": "Can not find post" });

        const userPost = await Post.findById(req.params.postId);
        console.log(userPost);

        if (!userPost) return res.status(400).json({ "ERROR": "Can not find post!!" });

        if (userId && !commentData) {
            await userPost.postLikes.userLiked.push(userId);
            userPost.postLikes.likeCount = (userPost.postLikes.userLiked.length);

            await userPost.save();

            if (userPost.postComments.length > 0) {
                const fullUpdatedPost = await userPost
                    .populate({ path: 'postLikes.userLiked', select: '-password' })
                // .populate('postComments');

                return res.status(200).send(fullUpdatedPost);
            }
            else {
                const fullUpdatedPost = await userPost
                    .populate({ path: 'postLikes.userLiked', select: '-password' });

                return res.status(200).send(fullUpdatedPost);
            }
        }
        else if (userId && commentData) {
            console.log("someone commented!!");
            const newComment = new Comment({
                postId: req.params.postId,
                commentedUser: userId,
                commentData,
            })

            await newComment.save();

            userPost.postComments.push(newComment._id);
            await userPost.save();

            if ((userPost.postComments.length) > 0) {
                const fullUpdatedPost = await userPost
                    // .populate({ path: 'postLikes.userLiked', select: '-password' }).execPopulate()
                    .populate({ path: 'postComments', select: '-date' });

                return res.status(200).send(fullUpdatedPost);
            }
            else {
                const fullUpdatedPost = await userPost
                    .populate({ path: 'postLikes.userLiked', select: '-password' });

                return res.status(200).send(fullUpdatedPost);
            }
        }
    } catch (error) {
        console.error('Error adding like or comment to post:', error);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//delete comment :
postRouter.delete('/deletecommet/:commentId', userLogedIn, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) return res.status(400).json({ "ERROR": "comment not found!!" });


        const post = await Post.findOne({ _id: req.body.postId });

        if (!post) return res.status(400).json({ "ERROR": "Can not find post to delete comment!!" });

        post.postComments.some((item, i) => {
            if (item == req.params.commentId) {
                console.log(true);
                post.postComments.splice(i, 1);
            }
        });

        await Comment.deleteOne({ _id: req.params.commentId });
        await post.save();

        res.status(200).json({ "Message": "comment deleted successfully!!" });
    } catch (error) {
        console.error('Error while deleting comment of post:', error);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

//unlike post
postRouter.put('/unlikepost/:userId', userLogedIn, async (req, res) => {
    try {
        if (!req.params.userId || !mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ "ERROR": "can not get userId!!" });

        if (!req.body.postId) return res.status(400).json({ "ERROR": "Can not get post!!" });

        const post = await Post.findOne({ _id: req.body.postId });

        if (!post) return res.status(400).json({ "ERROR": "Can not find post to delete comment!!" });

        post.postLikes.userLiked.some(async (item, i) => {
            if (item == req.params.userId) {
                post.postLikes.userLiked.splice(i, 1);
                post.postLikes.likeCount = post.postLikes.userLiked.length
                await post.save();

                return res.status(200).json({ "Message": "Unliked successfully!!" });
            }
        });

        res.status(400).json({ "ERROR": "some error occured!!" });
    } catch (error) {
        console.error('Error while unlike post:', error);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
});

module.exports = postRouter;