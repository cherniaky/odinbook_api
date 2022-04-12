const express = require("express");
const router = express.Router();
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
let { cloudinary } = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Friend = require("../models/Friend");
const Notification = require("../models/Notification");

router.post(
    "/",
    jwtMidd,
    body("text", "Post text cannot be empty").trim().not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.user._id == req.body.recipientId) {
           return res.status(200).json({ msg: "userId is equal recipientId" });
        }
        // console.log(req.body.recipientId);
        try {
            newNotification = new Notification({
                sender: req.user._id,
                senderName: `${req.user.firstName} ${req.user.familyName}`,
                recipient: req.body.recipientId,
                post: req.body.postId,
                text: req.body.text,
            });

            await newNotification.save();

            res.json(newNotification);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [{ msg: "500: Server error" }] });
        }
    }
);

router.get("/", jwtMidd, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
        })
            .limit(20)
            .populate("sender", ["firstName", "familyName", "profilePic"])
            .sort({ date: -1 });

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: "500: Server error notify" }] });
    }
});

// Set notifications as seen
router.put("/seen", jwtMidd, async (req, res) => {
    try {
        const notifications = await Notification.updateMany(
            { recipient: req.user._id },
            {
                $set: { seen: true },
            }
        )
            .populate("sender", ["firstName", "familyName", "profilePic"])
            .sort({ date: -1 });

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: "500: Server error notify" }] });
    }
});

module.exports = router;
