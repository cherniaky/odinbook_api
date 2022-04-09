require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const cors = require("cors");
const Notification = require("./models/Notification");

var authRouter = require("./routes/auth");
var postRouter = require("./routes/post");
var userRouter = require("./routes/users");
var requestRouter = require("./routes/requests");
let notificationRouter = require("./routes/notifications");
let messagesRouter = require("./routes/messaging");

var passport = require("passport");
var FacebookStrategy = require("passport-facebook").Strategy;

const User = require("./models/User");

const server_url = "http://localhost:3000";
const CLIENT_URL = "http://localhost:4000";

var app = express();
const http = require("http").createServer(app);

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

var whitelist = [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:4000",
    "https://web.postman.co",
    "https://cherniakyura.github.io",
];
//let server = require("./bin/www");
//var server = http.createServer(app);

// const io = require("socket.io")(server, {
//     cors: {
//         origin: [...whitelist],
//     },
// });
const io = require("socket.io")(http, {
    cors: {
        origin: [...whitelist],
    },
});
var corsOptions = {
    
    origin: function (origin, callback) {
        //  console.log(origin);
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

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

app.get("/auth/facebook", passport.authenticate("facebook"));

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

app.use("/auth", authRouter);
app.use("/posts", postRouter);
app.use("/users", userRouter);
app.use("/requests", requestRouter);
app.use("/notifications", notificationRouter);
app.use("/messages", messagesRouter);

http.listen(process.env.PORT || 3000, () => {
    // console.log(`server listening on port ${PORT}`);
});

let users = {};
io.on("connection", (socket) => {
     console.log("User connected");

    socket.on("userID", (userID) => {
        users[userID] = socket.id;
    });

    socket.on("friendRequest", (request) => {
        const userSocket = users[request.user];

        userSocket &&
            socket.broadcast.to(userSocket).emit("recieveRequest", request);
    });

    socket.on("notification", async (recipientID) => {
        // if (notification.sender === notification.recipient) return;

        // const newNotification = await Notification.findOneAndUpdate(
        //     notification,
        //     { $setOnInsert: notification },
        //     { upsert: true, new: true }
        // ).populate("sender", ["firstName", "familyName", "profilePic"]);

        //const recipientID = notification.recipient;
        const userSocket = users[recipientID];

        userSocket &&
            socket.broadcast.to(userSocket).emit("recieveNotification", "new");
    });

    socket.on("message", (message, recipientID) => {
        const userSocket = users[recipientID];

        userSocket &&
            socket.broadcast.to(userSocket).emit("recieveMessage", message);
    });

    socket.on("disconnect", (socket) => {
        const keys = Object.keys(users);

        keys.forEach((key, index) => {
            if (users[key] === socket.id) delete users[key];
            // console.log(`${key}: ${users[key]}`);
        });
         console.log("disonect");
    });
});

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
