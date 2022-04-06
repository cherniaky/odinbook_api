const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    name: {
        type: String,
    },
    img: {
        type: String,
    },
    recipient: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    recipientName: {
        type: String,
    },
    text: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
    },
    likes: [
        {
            user: {
                type: mongoose.Types.ObjectId,
                ref: "user",
            },
        },
    ],
    comments: [
        {
            user: {
                type: mongoose.Types.ObjectId,
                ref: "user",
                //required: true,
            },
            name: {
                type: String,
            },
            text: {
                type: String,
                required: true,
            },
            likes: [
                {
                    user: {
                        type: mongoose.Types.ObjectId,
                        ref: "user",
                    },
                },
            ],
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Post = mongoose.model("post", PostSchema);
