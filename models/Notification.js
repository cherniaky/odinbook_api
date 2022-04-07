const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    sender: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    recipient: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    post: {
        type: mongoose.Types.ObjectId,
        ref: "post",
    },
    senderName: {
        type: String,
    },
    text: {
        type: String,
    },
    seen: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = Notification = mongoose.model(
    "notification",
    NotificationSchema
);
