const ParkingSlot = require("../models/ParkingSlot");

const carTypes = [
  "Sedan",
  "SUV",
  "Coupe",
  "Muscle",
  "Hatchback",
  "Convertible",
];

const normalizeParkingSlots = async () => {
  await ParkingSlot.updateMany(
    { location: { $ne: "Level A" } },
    { $set: { location: "Level A" } },
  );
  await ParkingSlot.updateMany(
    { vehicleType: { $nin: carTypes } },
    { $set: { vehicleType: "Sedan" } },
  );
};

module.exports = { carTypes, normalizeParkingSlots };
