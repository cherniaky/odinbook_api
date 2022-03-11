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
        facebookId: { type: String },
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
    }
    // ,
    // { toJSON: { virtuals: true } }
);

UserSchema.virtual("fullName").get(function () {
    return this.firstName + " " + this.familyName;
});

UserSchema.virtual("posts", {
    ref: "post",
    foreignField: "user",
    localField: "_id",
});

module.exports = mongoose.model("user", UserSchema);
