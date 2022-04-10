const express = require("express");
const router = express.Router();
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Friend = require("../models/Friend");

// router.post("/file", upload.single("postImage"), async (req, res) => {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     try {

//         if (req.body.file) {
//             console.log("FILE", req.file);
//             //newPost.img = req.file.path;
//         }

//         //newPost.user = user;

//         res.json(req.file);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ errors: [{ msg: "500: Server error" }] });
//     }
// });

router.post(
    "/",
    jwtMidd,
    body("text", "Post text cannot be empty").trim().not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user._id);

            newPost = new Post({
                user: req.user._id,
                name: `${req.user.firstName} ${req.user.familyName}`,
                recipient: req.user._id,
                recipientName: `${req.user.firstName} ${req.user.familyName}`,
                text: req.body.text,
                profilePic: user.profilePic || "",
            });

            if (req.body.imgUrl) {
                newPost.img = req.body.imgUrl;
                newPost.imgName = req.body.imgName;
            }

            await newPost.save();

            //newPost.user = user;

            res.json(newPost);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [{ msg: "500: Server error" }] });
        }
    }
);

router.post(
    "/users/:user_id",
    jwtMidd,
    body("text", "Post text cannot be empty").trim().not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const recipient = await User.findById(req.params.user_id);

            const user = await User.findById(req.user._id);

            //console.log(user);

            newPost = new Post({
                profilePic: user.profilePic || "",
                user: req.user._id,
                name: `${req.user.firstName} ${req.user.familyName}`,
                recipient: recipient._id,
                recipientName: recipient.fullName,
                text: req.body.text,
            });
            //console.log(newPost);
            if (req.body.imgUrl) {
                newPost.img = req.body.imgUrl;
                newPost.imgName = req.body.imgName;
            }

            await newPost.save();

            //newPost.user = user;

            res.json(newPost);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [{ msg: "500: Server error" }] });
        }
    }
);

// Get friends' posts
router.get("/feed", jwtMidd, async (req, res) => {
    try {
        ///console.log(req.user);
        const user = await User.findById(req.user._id).populate("friends", [
            "status",
            "friendId",
        ]);

        const friends = user.friends.map((friend) => {
            if (friend.status === "accepted") {
                return friend.friendId;
            }
        });
        // console.log("🚀 ~ file: post.js ~ line 100 ~ friends ~ friends", friends)
        //console.log(user);
        friends.push(user._id);

        //const skip = parseInt(req.query.skip);

        const posts = await Post.find({ user: { $in: friends } })
            .sort({
                date: -1,
            })
            .populate("user", ["profilePic"])
            .limit(10);

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "500: Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("user", [
            "profilePic",
        ]);

        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: "500: Server error" }] });
    }
});

router.get("/users/:user_id", async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.user_id }).sort({
            date: -1,
        });

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: "500: Server error" }] });
    }
});

router.get("/users/:user_id/wall", async (req, res) => {
    try {
        const posts = await Post.find({ recipient: req.params.user_id })
            .populate("user", ["profilePic"])
            .sort({ date: -1 });

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: "500: Server error" }] });
    }
});

router.post("/:id/like", jwtMidd, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //console.log(post);
        // Unlike post if already liked
        if (post.likes.some((like) => like.user.toString() === req.user._id)) {
            post.likes = post.likes.filter(
                (like) => like.user.toString() !== req.user._id
            );

            await post.save();

            return res.json(post.likes);
        }

        post.likes.unshift({ user: req.user._id });

        await post.save();

        res.json(post.likes);
    } catch (err) {
        res.status(500);
        res.json({ errors: [{ msg: "500: Server error" }] });
    }
});

router.post(
    "/:id/comments",
    jwtMidd,
    body("text", "Comment text cannot be empty").trim().not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const post = await Post.findById(req.params.id);

            const comment = {
                user: req.user._id,
                name: `${req.user.firstName} ${req.user.familyName}`,
                text: req.body.text,
            };

            post.comments.push(comment);

            await post.save();

            res.json(post.comments);
        } catch (err) {
            res.status(500);
            //console.log(err);
            res.json({ errors: [{ msg: "500: Server error" }] });
        }
    }
);

router.post(
    "/:post_id/comments/:comment_id/like",
    jwtMidd,
    async (req, res) => {
        const post = await Post.findById(req.params.post_id);

        const comment = post.comments.find(
            (comment) => comment._id.toString() === req.params.comment_id
        );

        if (
            comment.likes.some((like) => like.user.toString() === req.user._id)
        ) {
            comment.likes = comment.likes.filter(
                (like) => like.user.toString() !== req.user._id
            );
            await post.save();

            return res.json(comment.likes);
        }

        comment.likes.unshift({ user: req.user._id });

        await post.save();

        res.json(comment.likes);
    }
);

router.delete("/:id", jwtMidd, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: "Post not found" });
        }

        if (post.user.toString() !== req.user._id) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        await post.remove();

        res.json({ msg: "Post removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "500: Server error" });
    }
});

router.delete("/:post_id/comments/:comment_id", jwtMidd, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        const comment = post.comments.find(
            (comment) => comment._id.toString() === req.params.comment_id
        );

        if (!comment) {
            return res
                .status(404)
                .json({ errors: [{ msg: "Comment not found" }] });
        }

        if (comment.user.toString() !== req.user._id) {
            return res
                .status(401)
                .json({ errors: [{ msg: "401: Unauthorised" }] });
        }

        post.comments = post.comments.filter(
            (comment) => comment._id.toString() !== req.params.comment_id
        );

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "500: Server error" });
    }
});

module.exports = router;
