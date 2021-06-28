const axios = require("axios");
const httpError = require("../models/http-error");

const API_KEY =
  "pk.eyJ1IjoidGF3aGlkMzEzIiwiYSI6ImNra2Fqamw5MTAwdDAydm94aWd0OHBuZ2gifQ.vK7q9HprbQ8UqUMPSeOiZQ";

const getCoOrdForAddress = async (address) => {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?limit=2&access_token=${API_KEY}`
  );
  const data = response.data;
  if (!data) {
    throw new httpError(
      "Could not find the given location,please check the spelling",
      422
    );
  }
  const co_ordinates = [...data.features[0].geometry.coordinates];
  console.log(co_ordinates);
  return co_ordinates;
};

module.exports = getCoOrdForAddress;
