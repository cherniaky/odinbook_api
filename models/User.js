const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    password: { type: String },
    facebookId: { type: Number },
});

module.exports = mongoose.model("User", UserSchema);
