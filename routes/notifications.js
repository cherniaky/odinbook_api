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
