const express = require("express");
const router = express.Router();
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");

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
                name: req.user.firstName,
                recipient: req.user._id,
                recipientName: req.user.firstName,
                text: req.body.text,
                profilePic: user.profilePic || "",
            });

            await newPost.save();

            //newPost.user = user;

            res.json(newPost);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [{ msg: "500: Server error" }] });
        }
    }
);

module.exports = router;
