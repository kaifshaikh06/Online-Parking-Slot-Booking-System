const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "Level A",
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
      enum: ["Sedan", "SUV", "Coupe", "Muscle", "Hatchback", "Convertible"],
    },
    status: {
      type: String,
      enum: ["Available", "Booked"],
      default: "Available",
    },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "parking_slots" },
);

module.exports = mongoose.model("ParkingSlot", parkingSlotSchema);
