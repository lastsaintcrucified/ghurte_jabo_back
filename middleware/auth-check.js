const jwt = require("jsonwebtoken");
const httpError = require("../models/http-error");

module.exports = (req, res, next) => {
    if(req.method === "OPTIONS"){
        return next()
    }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Authorization failed!");
    }
    const decodedToken = jwt.verify(token, "secret_within_secret");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new httpError("Authorization failed!", 401);
    return next(error);
  }
};
