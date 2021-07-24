const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");
const { validationResult } = require("express-validator");
const httpError = require("../models/http-error");

// const DUMMY_USER = [
//   {
//     id: "u1",
//     name: "Mark Rufflao",
//     image:
//       "https://images.unsplash.com/photo-1502447533750-9860c1269ae3?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80",
//     places: 3,
//   },
//   {
//     id: "u2",
//     name: "Mark Rufflao",
//     image:
//       "https://images.unsplash.com/photo-1502447533750-9860c1269ae3?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80",
//     places: 3,
//   },
//   {
//     id: "u3",
//     name: "Mark Rufflao",
//     image:
//       "https://images.unsplash.com/photo-1502447533750-9860c1269ae3?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80",
//     places: 3,
//   },
//   {
//     id: "u4",
//     name: "Mark Rufflao",
//     image:
//       "https://images.unsplash.com/photo-1502447533750-9860c1269ae3?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=334&q=80",
//     places: 3,
//   },
// ];

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new httpError("User Fetching failed", 500);
    return next(error);
  }
  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new httpError("Invalid data passed,please check the inputs", 422)
    );
  }
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new httpError(
      "Signing Up failed ,please try again later",
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new httpError("User already exist!", 422);
    return next(error);
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new httpError(
      "Signing Up failed ,please try again later",
      500
    );
    return next(error);
  }
  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/images/`;
  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: `${basePath}${fileName}`,
    places: [],
  });
  try {
    await createdUser.save();
  } catch (err) {
    const error = new httpError("Signing Up failed!", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new httpError("Signing Up failed!", 500);
    return next(error);
  }

  res.status(201).json({ userId:createdUser.id,email:createdUser.email,token:token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new httpError("Invalid data passed,please check the inputs", 422);
  }
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new httpError(
      "logging in failed ,please try again later",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    return next(
      new httpError(
        "Couldn't identify user, credintials seems to be wrong",
        401
      )
    );
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new httpError(
      "Could not log you in,please check you credentials",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new httpError(
      "Could not log you in,please check you credentials",
      500
    );
    return next(error);
  }
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new httpError("Logging in failed!", 500);
    return next(error);
  }
  res.json({
    userId:existingUser.id,
    email:existingUser.email,
    token:token
  });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
