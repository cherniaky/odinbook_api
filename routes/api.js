var express = require("express");
const jwtMidd = require("../middleware/jwtAuth");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Token = require("../models/Token");
const User = require("../models/User");

async function saveToken(userid, refreshToken) {
    const tokenData = await Token.findOne({ user: userid });
    if (tokenData) {
        tokenData.token = refreshToken;
        return tokenData.save();
    }
    const token = Token.create({ user: userid, token: refreshToken });
    return token;
}

/* GET home page. */
router.get("/", function (req, res, next) {
    // console.log(req.user);
    res.json({ hi: "ds" });
});

router.get("/login", async (req, res, next) => {
    //console.log(req.body.username);
    const user = await User.findOne({ name: req.body.name });

    if (!user) {
        return res.status(404).send("User not found!");
    }

    if (user.password) {
        const validate = bcrypt.compareSync(req.body.password, user.password);
        //req.body.password === user.password;

        if (!validate) {
            return res.status(400).send("Wrong Password");
        }
    }

    try {
        const body = { _id: user._id, username: user.username };

        const accessToken = jwt.sign({ user: body }, process.env.SECRET_KEY, {
            expiresIn: "15m",
        });
        const refreshToken = jwt.sign(
            { user: body },
            process.env.SECRET_KEY_REFRESH,
            {
                expiresIn: "15d",
            }
        );

        await saveToken(user._id, refreshToken);

        // res.setHeader("set-cookie", [
        //     `refreshToken=${refreshToken}; Max-Age=1296000; Path=/; SameSite=None;Secure `,
        // ]);
        res.cookie("refreshToken", refreshToken, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            //httpOnly: true,
            // sameSite: "none",
        });

        return res.json({ accessToken, refreshToken, user: body });
    } catch (error) {
        return next(error);
    }
});

router.get(
    "/sign-up",
    body("name", "Empty name")
        .custom(async (value, { req }) => {
            const user = await User.findOne({ name: req.body.name });
            //console.log(user);
            if (user !== {}) {
                return false;
            }

            return false;
        })
        .withMessage("Username already exist")
        .isLength(1)
        .trim()
        .escape(),
    body("password").isLength(6).withMessage("Minimum length 6 characters"),

    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                name: req.body.name,
                errors: errors.array(),
            });
        }
        const userValid = await User.findOne({ name: req.body.name });
        //console.log(user);
        if (userValid) {
            return next(new Error("Username already exist"));
        }
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        const user = {
            name: req.body.name,
            password: hash,
        };
        await User.create({ ...user });
        res.json({
            message: "Signed-up sucessfuly",
            user,
        });
    }
);

module.exports = router;
