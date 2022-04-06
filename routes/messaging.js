const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
let { cloudinary } = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Friend = require("../models/Friend");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

router.post(
    "/send/:userID",
    jwtMidd,
    body("text", "Message text cannot be empty").trim().not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const message = new Message({
                sender: req.user._id,
                text: req.body.text,
            });
            // console.log(message);
            const conversation = await Conversation.findOneAndUpdate(
                {
                    participants: {
                        $all: [
                            {
                                $elemMatch: {
                                    $eq: mongoose.Types.ObjectId(req.user._id),
                                },
                            },
                            {
                                $elemMatch: {
                                    $eq: mongoose.Types.ObjectId(
                                        req.params.userID
                                    ),
                                },
                            },
                        ],
                    },
                },
                {
                    $set: {
                        lastMessage: message._id,
                        lastUpdated: Date.now(),
                        //  participants: [req.user._id, req.params.userID],
                    },
                    $setOnInsert: {
                        participants: [req.user._id, req.params.userID],
                    },
                },
                { upsert: true, new: true }
            );

            message.conversation = conversation._id;

            await message.save();

            await Message.populate(message, {
                path: "sender",
                select: "firstName familyName profilePic",
            });

            res.json(message);
        } catch (err) {
            console.error(err);
            res.status(500).json("Server error messeging");
        }
    }
);

router.get("/", jwtMidd, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate("participants", ["firstName", "familyName", "profilePic"])
            .populate({
                path: "lastMessage",
                populate: [
                    {
                        path: "sender",
                        select: "firstName familyName profilePic",
                    },
                ],
            })
            .sort({ lastUpdated: -1 });
           // console.log(conversations);
        res.json(conversations);
    } catch (err) {
        console.error(err);
        res.status(500).json("Server error");
    }
});

router.get("/chats/:id", jwtMidd, async (req, res) => {
    try {
        await Message.updateMany(
            { conversation: req.params.id, sender: { $ne: req.user._id } },
            { $set: { seen: true } }
        );

        const messages = await Message.find({
            conversation: req.params.id,
        })
            .sort({ date: -1 })
            .limit(20)
            .populate("sender", ["firstName", "familyName", "profilePic"]);

        res.json(messages.reverse());
    } catch (err) {
        console.error(err);
        res.status(500).json("Server error");
    }
});

module.exports = router;
