const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');

const getBookingEndDateTime = (booking) => {
  const bookingDay = new Date(booking.bookingDate).toISOString().slice(0, 10);
  return new Date(`${bookingDay}T${booking.endTime}:00`);
};

const isBookingActive = (booking, now = new Date()) => (
  booking.status === 'Booked' && getBookingEndDateTime(booking) > now
);

const syncSlotAvailability = async (parkingSlotId, now = new Date()) => {
  const bookings = await Booking.find({ parkingSlot: parkingSlotId, status: 'Booked' }).select('bookingDate endTime status');
  const hasActiveBooking = bookings.some((booking) => isBookingActive(booking, now));
  await ParkingSlot.findByIdAndUpdate(parkingSlotId, { status: hasActiveBooking ? 'Booked' : 'Available' });
};

const releaseExpiredBookings = async () => {
  const now = new Date();
  const bookings = await Booking.find({ status: 'Booked' }).select('parkingSlot bookingDate endTime status');
  const expiredSlotIds = [...new Set(
    bookings.filter((booking) => !isBookingActive(booking, now)).map((booking) => booking.parkingSlot.toString())
  )];

  await Promise.all(expiredSlotIds.map((parkingSlotId) => syncSlotAvailability(parkingSlotId, now)));
  return expiredSlotIds.length;
};

const startBookingExpiryScheduler = () => {
  releaseExpiredBookings().catch((error) => console.error(`Initial booking expiry check failed: ${error.message}`));
  setInterval(() => {
    releaseExpiredBookings().catch((error) => console.error(`Booking expiry check failed: ${error.message}`));
  }, 60 * 1000);
};

module.exports = { isBookingActive, syncSlotAvailability, releaseExpiredBookings, startBookingExpiryScheduler };
