const jwt = require("jsonwebtoken");

const jwtMidd = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
        // console.log(authorizationHeader);
        if (!authorizationHeader) {
            return res.status(401).send("Autorization");
        }
        //console.log(req.headers.autorization);

        const accessToken = authorizationHeader.split(" ")[1];

        //console.log(accessToken);
        if (!accessToken) {
            return res.status(402).send("Autorization");
        }

        // const userData = tokenService.validateAccessToken(accessToken);
        const { user: userData } = jwt.verify(
            accessToken,
            process.env.SECRET_KEY
        );
        //console.log(userData);
        if (!userData) {
            return res.status(403).send("Autorization");
        }

        req.user = userData;
        next();
    } catch (e) {
        return res.status(401).send("Autorization");
    }
};

module.exports = jwtMidd;
