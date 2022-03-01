const express = require("express");
const router = express.Router();
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
let { cloudinary } = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Friend = require("../models/Friend");

router.get("/", jwtMidd, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "friends",
            populate: { path: "friendId" },
        });

        const requests = user.friends.filter(
            (friend) => friend.status === "recieved"
        );

        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

router.post("/:id", jwtMidd, async (req, res) => {
    try {
        const sender = req.user._id;
        const recipient = req.params.id;

        if (sender === recipient) {
            return res.status(400).json({
                errors: [{ msg: "Cannot add yourself as a friend!" }],
            });
        }

        const toRecipient = await Friend.findOneAndUpdate(
            {
                user: recipient,
                friendId: sender,
                // status: "recieved",
            },
            { $set: { status: "recieved" } },
            { upsert: true, new: true }
        );

        const toSender = await Friend.findOneAndUpdate(
            {
                user: sender,
                friendId: recipient,
                // status: "pending",
            },
            { $set: { status: "pending" } },
            { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(sender, {
            $push: { friends: toSender },
        });

        await User.findByIdAndUpdate(recipient, {
            $push: { friends: toRecipient },
        });

        res.json(toRecipient);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

router.post("/:id/accept", jwtMidd, async (req, res) => {
    try {
        await Friend.findOneAndUpdate(
            {
                friendId: req.params.id,
                user: req.user._id,
                $or: [{ status: "recieved" }, { status: "seen" }],
            },
            { $set: { status: "accepted" } }
        );

        await Friend.findOneAndUpdate(
            {
                friendId: req.user._id,
                user: req.params.id,
                status: "pending",
            },
            { $set: { status: "accepted" } }
        );

        res.json({ msg: "Friend accepted" });
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
