const express = require("express");
const router = express.Router();
const jwtMidd = require("../middleware/jwtAuth");
const { body, validationResult } = require("express-validator");
let { cloudinary } = require("../cloudinary");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const Friend = require("../models/Friend");

router.get("/", jwtMidd, async (req, res, next) => {
    try {
        const users = await User.find({});
        //.populate({ path: "friends", populate: "friendId" });

        res.json(users);
    } catch (e) {
        console.log(e);
        res.status(500).send("Cant get users");
        //next(e)
    }
});

router.get("/current", jwtMidd, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // .populate({ path: "friends", populate: "user" });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// router.get("/current/profile", jwtMidd, async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id);

//         res.json(user.profile);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Server error");
//     }
// });

router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            // .select("-password -notifications")
            .populate({
                path: "friends",
                populate: [
                    {
                        path: "friendId",
                        select: "firstName familyName profilePic profile",
                    },
                ],
            });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Get a user's friends
router.get("/:id/friends", async (req, res) => {
    try {
        const friends = await Friend.find({ user: req.params.id }).populate({
            path: "friendId",
            populate: "friends",
        });

        res.json(friends);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

router.put("/current/profile", jwtMidd, async (req, res) => {
    try {
        const {
            location,
            bio,
            occupation,
            imgUrl = "",
            profilePicName = "",
        } = req.body;
        // console.log(req.body);
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                profile: {
                    location,
                    bio,
                    occupation,
                },
                profilePic: imgUrl,
                profilePicName,
            },
            { new: true }
        );

        // if (image) {
        //     const fileString = req.body.image;
        //     const uploadResponse = await cloudinary.uploader.upload(
        //         fileString,
        //         {
        //             upload_preset: "odinbook-profile-pics",
        //         }
        //     );

        //     user.profilePic = uploadResponse.url;

        //     await user.save();
        // }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: [{ msg: err.message }] });
    }
});

module.exports = router;
