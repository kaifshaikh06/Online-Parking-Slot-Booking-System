const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");

const getBookingDay = (booking) =>
  new Date(booking.bookingDate).toISOString().slice(0, 10);

const getBookingStartDateTime = (booking) => {
  const bookingDay = getBookingDay(booking);
  return new Date(`${bookingDay}T${booking.startTime}:00`);
};

const getBookingEndDateTime = (booking) => {
  const bookingDay = getBookingDay(booking);
  return new Date(`${bookingDay}T${booking.endTime}:00`);
};

const isBookingActive = (booking, now = new Date()) =>
  booking.status === "Booked" &&
  getBookingStartDateTime(booking) <= now &&
  getBookingEndDateTime(booking) > now;

const isBookingReserved = (booking, now = new Date()) =>
  booking.status === "Booked" && getBookingEndDateTime(booking) > now;

const syncSlotAvailability = async (parkingSlotId, now = new Date()) => {
  const bookings = await Booking.find({
    parkingSlot: parkingSlotId,
    status: "Booked",
  }).select("bookingDate startTime endTime status");
  const hasActiveBooking = bookings.some((booking) =>
    isBookingActive(booking, now),
  );
  await ParkingSlot.findByIdAndUpdate(parkingSlotId, {
    status: hasActiveBooking ? "Booked" : "Available",
  });
};

const releaseExpiredBookings = async () => {
  const now = new Date();
  const bookings = await Booking.find({ status: "Booked" }).select(
    "parkingSlot bookingDate startTime endTime status",
  );
  const scheduledSlotIds = [
    ...new Set(bookings.map((booking) => booking.parkingSlot.toString())),
  ];

  await Promise.all(
    scheduledSlotIds.map((parkingSlotId) =>
      syncSlotAvailability(parkingSlotId, now),
    ),
  );
  return scheduledSlotIds.length;
};

const startBookingExpiryScheduler = () => {
  releaseExpiredBookings().catch((error) =>
    console.error(`Initial booking expiry check failed: ${error.message}`),
  );
  setInterval(() => {
    releaseExpiredBookings().catch((error) =>
      console.error(`Booking expiry check failed: ${error.message}`),
    );
  }, 60 * 1000);
};

module.exports = {
  getBookingDay,
  getBookingStartDateTime,
  getBookingEndDateTime,
  isBookingActive,
  isBookingReserved,
  syncSlotAvailability,
  releaseExpiredBookings,
  startBookingExpiryScheduler,
};
