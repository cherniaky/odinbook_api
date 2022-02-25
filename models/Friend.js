const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FriendSchema = new Schema({
    friendId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    status: {
        type: String,
        enums: ["recieved", "seen", "pending", "accepted"],
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Friend = mongoose.model("friend", FriendSchema);
