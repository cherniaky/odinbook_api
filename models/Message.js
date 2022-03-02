const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    conversation: {
        type: mongoose.Types.ObjectId,
        ref: "conversation",
    },
    text: {
        type: String,
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    seen: {
        type: Boolean,
        default: false,
    },
});

module.exports = Message = mongoose.model("message", MessageSchema);
