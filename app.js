require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const cors = require("cors");

var apiRouter = require("./routes/api");

var passport = require("passport");
var FacebookStrategy = require("passport-facebook").Strategy;

const User = require("./models/User");

const server_url = "http://localhost:3000";
const CLIENT_URL = "http://localhost:5000";

var app = express();

require("./mongoDBConfig");

app.use(
    session({
        secret: "cats",
        resave: false,
        saveUninitialized: true,
        credentials: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 2,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: "http://localhost:3000",
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
    })
);
// // view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

passport.use(
    new FacebookStrategy(
        {
            clientID: "3201779453423648",
            clientSecret: "abf9c28805d5f991263ca2114beae96d",
            callbackURL: `${server_url}/oauth/redirect/facebook`,
            profileFields: ["id", "displayName", "photos", "email"],
        },
        function (accessToken, refreshToken, profile, done) {
            console.log(profile);
            //return done(null, profile);
            //check user table for anyone with a facebook ID of profile.id
            User.findOne(
                {
                    facebookId: profile.id,
                },
                function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    //No user was found... so create a new user with values from Facebook (all the profile. stuff)
                    if (!user) {
                        user = new User({
                            name: profile.displayName,
                            facebookId: profile.id,
                        });
                        user.save(function (err) {
                            if (err) console.log(err);
                            // console.log(user);

                            return done(err, user);
                        });
                    } else {
                        return done(err, user);
                    }
                }
            );
        }
    )
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get(
    "/auth/facebook",
    passport.authenticate("facebook" )
);

app.get(
    "/oauth/redirect/facebook",
    passport.authenticate("facebook", {
        //assignProperty: "user",
        failureRedirect: "/login/failure",
        //successRedirect: "/login/success",
    }),
    function (req, res) {
        // console.log('Userrrrr  ',req.user);
        // Successful authentication, redirect home.
        //res.json({ user: req.user });
        res.redirect("/login/success");
    }
);

app.get("/login/success", function (req, res, next) {
    //console.log(req.user);
    res.json({ user: req.user });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect(CLIENT_URL);
});

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, { userData: user, token: "hi" });
    });
});

app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
