const jwt = require('jsonwebtoken')

const HttpError = require("../models/HttpError");

module.exports = (req, res, next) => {

    if (req.method === "OPTIONS") {
        return next()
    }
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            const error = new HttpError('Authentication failed')
            return next(error)
        }

        const decodedToken = jwt.verify(token, "supersecret_dont_share")

        req.userData = { userId: decodedToken.userId }
        next()

    } catch (err) {
        const error = new HttpError("authorization failed", 403)
        return next(error)
    }

}