const Booking = require("../models/Booking");

const ensureBookingNumbers = async () => {
  const latestBooking = await Booking.findOne({
    bookingNumber: { $exists: true },
  })
    .sort({ bookingNumber: -1 })
    .select("bookingNumber");
  let nextNumber = (latestBooking?.bookingNumber || 0) + 1;
  const legacyBookings = await Booking.find({
    bookingNumber: { $exists: false },
  })
    .sort({ createdAt: 1 })
    .select("_id");

  for (const booking of legacyBookings) {
    await Booking.updateOne(
      { _id: booking._id, bookingNumber: { $exists: false } },
      { $set: { bookingNumber: nextNumber } },
    );
    nextNumber += 1;
  }
};

const getNextBookingNumber = async () => {
  const latestBooking = await Booking.findOne({
    bookingNumber: { $exists: true },
  })
    .sort({ bookingNumber: -1 })
    .select("bookingNumber");
  return (latestBooking?.bookingNumber || 0) + 1;
};

module.exports = { ensureBookingNumbers, getNextBookingNumber };
