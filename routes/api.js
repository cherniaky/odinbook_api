var express = require("express");
const jwtMidd = require("../middleware/jwtAuth");
var router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

router.post("/login", async (req, res, next) => {
    //console.log(req.body.username);
    const user = await User.findOne({ email: req.body.email }).select("+password");

    if (!user) {
        return res.status(404).send("User not found!");
    }

    const validate = bcrypt.compareSync(req.body.password, user.password);
    //req.body.password === user.password;

    if (!validate) {
        return res.status(400).send("Wrong Password");
    }

    try {
        const body = {
            _id: user._id,
            firstName: user.firstName,
            email: user.email,
        };

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

router.get("/logout", async function (req, res) {
    const { refreshToken } = req.cookies;

    await Token.deleteOne({ token: refreshToken });

    res.clearCookie("refreshToken");
    res.json({
        status: "logout",
        msg: "Please Log In again",
    });
});

router.get("/refresh", async function (req, res, next) {
    const { refreshToken } = req.cookies;
    //console.log(refreshToken)
    if (!refreshToken) {
        return res.status(404).send("No refresh token");
    }

    const tokenData = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH);
    //console.log(tokenData.user);
    const dbToken = await Token.findOne({ token: refreshToken });
    // console.log(dbToken , tokenData.user);
    if (!tokenData.user) {
        return res.status(404).send("No token in database or token invalid");
    }
    const user = await User.findById(tokenData.user._id);

    const userData = {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
    };

    const accessToken = jwt.sign({ user: userData }, process.env.SECRET_KEY, {
        expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign(
        { user: userData },
        process.env.SECRET_KEY_REFRESH,
        {
            expiresIn: "15d",
        }
    );

    await saveToken(userData._id, newRefreshToken);

    // res.setHeader("set-cookie", [
    //     `refreshToken=${newRefreshToken}; Max-Age=1296000; Path=/;  SameSite=None;Secure `,
    // ]);
    res.cookie("refreshToken", newRefreshToken, {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        //httpOnly: true,
        // sameSite: "none",
        //secure: true,
    });

    // console.log(accessToken , newRefreshToken , userData);
    return res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: userData,
    });
});

router.post(
    "/sign-up",
    body("firstName", "Empty firstName").trim().isLength(1).escape(),
    body("familyName", "Empty familyName").trim().isLength(1).escape(),
    body("email", "Empty email")
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: req.body.email });
            //console.log(user);
            if (user !== {}) {
                return false;
            }

            return true;
        })
        .withMessage("email already exist")
        .trim()
        .isLength(1)
        .escape(),
    body("password").isLength(6).withMessage("Minimum length 6 characters"),
    body("password2")
        .isLength(6)
        .withMessage("Minimum length 6 characters")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                return false;
            }

            return true;
        })
        .withMessage("Password confirmation does not match password"),

    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                name: req.body.name,
                errors: errors.array(),
            });
        }
        const emailExist = await User.findOne({ email: req.body.email });
        //console.log(user);
        if (emailExist) {
           return res.json({
                errors: [
                    {
                        value: req.body.email,
                        msg: "Email already exist",
                        param: "email",
                        location: "body",
                    },
                ],
            });
           // return next(new Error("email already exist"));
        }

        // const equalPass = req.body.password === req.body.password2;
        
        // if (!equalPass) {
        //     return next(new Error("confirm password not equal"));
        // }

        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        const user = {
            firstName: req.body.firstName,
            familyName: req.body.familyName,
            email: req.body.email,
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
