const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const addOnSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: Number, unique: true, sparse: true, min: 1 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parkingSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 25,
    },
    vehicleName: { type: String, trim: true, maxlength: 60 },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    parkingRate: { type: Number, min: 0 },
    parkingTotal: { type: Number, default: 0, min: 0 },
    bookingType: {
      type: String,
      enum: ["Hourly", "LongTerm"],
      default: "Hourly",
    },
    durationDays: { type: Number, min: 1, max: 30 },
    endDate: { type: Date },
    dailyRate: { type: Number, min: 0 },
    carWashDates: [{ type: Date }],
    addOns: { type: [addOnSchema], default: [] },
    addOnTotal: { type: Number, default: 0, min: 0 },
    actualExitTime: { type: Date },
    overstayHours: { type: Number, default: 0, min: 0 },
    overstayCharge: { type: Number, default: 0, min: 0 },
    review: reviewSchema,
    status: {
      type: String,
      enum: ["Booked", "Cancelled", "Completed"],
      default: "Booked",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
