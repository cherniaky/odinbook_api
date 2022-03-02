const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    participants: [
        {
            type: mongoose.Types.ObjectId,
            ref: "user",
        },
    ],
    lastMessage: {
        type: mongoose.Types.ObjectId,
        ref: "message",
    },
    lastUpdated: {
        type: Date,
    },
});

module.exports = Conversation = mongoose.model(
    "conversation",
    ConversationSchema
);
    