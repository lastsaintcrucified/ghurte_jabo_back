const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
// const fileUpload = require("../middleware/file-upload");
const userController = require("../controllers/user-controller");

router.get("/", userController.getUsers);
router.post(
  "/signup",
  // fileUpload.single("image"),
  [
    check("name").isLength({ min: 5 }),
    check("email").isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userController.signUp
);
router.post(
  "/login",
  [check("email").isEmail(), check("password").isLength({ min: 6 })],
  userController.login
);

module.exports = router;
