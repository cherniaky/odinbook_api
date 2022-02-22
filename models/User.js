const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const UserSchema = new Schema({
//     name: { type: String, required: true },
//     password: { type: String },
//     facebookId: { type: Number },
// });

const UserSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        familyName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        facebookId: { type: Number },
        password: {
            type: String,
            required: true,
            select: false,
        },
        profilePic: {
            type: String,
        },
        friends: [
            {
                type: mongoose.Types.ObjectId,
                ref: "friend",
            },
        ],
        profile: {
            location: {
                type: String,
                default: "",
            },
            bio: {
                type: String,
                default: "",
            },
            occupation: {
                type: String,
                default: "",
            },
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { toJSON: { virtuals: true } }
);

module.exports = mongoose.model("User", UserSchema);
