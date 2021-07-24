const httpError = require("../models/http-error");
const fs = require("fs");
const Place = require("../models/places.schema");
const User = require("../models/user.schema");
const getCoOrdForAddress = require("../utils/location");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// let DUMMY_PLACES = [
//   {
//     id: "p1",
//     title: "Sajek",
//     address: "bandarban sajek chittagong",
//     image:
//       "https://lh5.googleusercontent.com/p/AF1QipMTZWalB_R23PxKdMsYaxHW7uyvmS137XzSBGkU=w408-h271-k-no",
//     description:
//       "This is one of the best hilltracks in Bangladesh, that is being visited by tourists",
//     co_ordinantes: [23.3819926, 92.2938229],
//     creator: "u1",
//   },
// ];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new httpError(
      "Could find the place, something went wrong",
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new httpError("Could not find the place with given id", 404);
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new httpError("Could not find any place for user", 404);
    return next(error);
  }
  if (!userWithPlaces || userWithPlaces.places.length == 0) {
    return next(Error("Could not find places with given user id", 404));
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const { title, description, address } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new httpError("Invalid data passed,please check the inputs", 422)
    );
  }
  let co_ordinates;
  try {
    co_ordinates = await getCoOrdForAddress(address);
  } catch (error) {
    return next(error);
  }
  console.log(co_ordinates);
  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/images/`;
  const createdPlace = new Place({
    title,
    description,
    co_ordinates: co_ordinates,
    address,
    image: `${basePath}${fileName}`,
    creator:req.userData.userId,
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new httpError("Creating place failed,please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new httpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log("created_place->", createdPlace);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new httpError("Creating place failed!", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const { title, description } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new httpError("Invalid data passed,please check the inputs", 422)
    );
  }
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new httpError("Could not find place", 404);
    return next(error);
  }
  if (place.creator.toString() !== req.userData.userId) {
    const error = new httpError("You are not allowed to edit this place!", 401);
    return next(error);
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new httpError("Something went wrong", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new httpError("Could not delete", 500);
    return next(error);
  }
  const imagePath = place.image;
  if (!place) {
    const error = new httpError("Could not find place", 404);
    return next(error);
  }
  if (place.creator.id !== req.userData.userId) {
    const error = new httpError("You are not allowed to delete this place!", 401);
    return next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new httpError("Something went wrong", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "Place deleted" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
