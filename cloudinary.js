require("dotenv").config();

var cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: "969838447445233",
    api_secret: process.env.API_SECRET,
});

module.exports = { cloudinary };
