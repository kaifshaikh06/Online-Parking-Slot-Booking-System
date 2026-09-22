const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const { isBookingActive, releaseExpiredBookings, syncSlotAvailability } = require('../services/bookingExpiryService');

const bookingPopulate = [
  { path: 'user', select: 'name email phone' },
  { path: 'parkingSlot', select: 'slotNumber location vehicleType price status' }
];

const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));

const validateBooking = ({ vehicleNumber, bookingDate, startTime, endTime }) => {
  if (!String(vehicleNumber || '').trim()) return 'Vehicle number is required.';
  if (!bookingDate || Number.isNaN(new Date(bookingDate).getTime())) return 'A valid booking date is required.';
  if (!validTime(startTime) || !validTime(endTime)) return 'Start and end time must be valid times.';
  if (startTime >= endTime) return 'End time must be later than start time.';
  return null;
};

const createBooking = async (req, res, next) => {
  try {
    const { parkingSlot, vehicleNumber, bookingDate, startTime, endTime } = req.body;
    const message = validateBooking({ vehicleNumber, bookingDate, startTime, endTime });
    if (message) return res.status(400).json({ message });
    if (!parkingSlot) return res.status(400).json({ message: 'Parking slot is required.' });

    await releaseExpiredBookings();
    const existingBookings = await Booking.find({ parkingSlot, status: 'Booked' }).select('bookingDate endTime status');
    if (existingBookings.some((booking) => isBookingActive(booking))) {
      return res.status(400).json({ message: 'This parking slot already has an active booking.' });
    }

    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: parkingSlot, status: 'Available' },
      { status: 'Booked' },
      { new: true }
    );
    if (!slot) return res.status(400).json({ message: 'This parking slot is not available.' });

    try {
      const booking = await Booking.create({
        user: req.user._id,
        parkingSlot: slot._id,
        vehicleNumber: vehicleNumber.trim(),
        bookingDate,
        startTime,
        endTime
      });
      await booking.populate(bookingPopulate);
      return res.status(201).json({ message: 'Parking slot booked successfully.', booking });
    } catch (creationError) {
      await ParkingSlot.findByIdAndUpdate(slot._id, { status: 'Available' });
      throw creationError;
    }
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Parking slot not found.' });
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate(bookingPopulate).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('parkingSlot', 'slotNumber location vehicleType price status').sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const searchBookings = async (req, res, next) => {
  try {
    const { slotNumber = '', vehicleNumber = '' } = req.query;
    if (!slotNumber.trim() && !vehicleNumber.trim()) return res.json({ bookings: [] });

    const conditions = [];
    if (slotNumber.trim()) {
      const slots = await ParkingSlot.find({ slotNumber: { $regex: slotNumber.trim(), $options: 'i' } }).select('_id');
      conditions.push({ parkingSlot: { $in: slots.map((slot) => slot._id) } });
    }
    if (vehicleNumber.trim()) conditions.push({ vehicleNumber: { $regex: vehicleNumber.trim(), $options: 'i' } });

    const bookings = await Booking.find({ $or: conditions }).populate(bookingPopulate).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status !== 'Cancelled') return res.status(400).json({ message: 'Only cancellation of a booking is supported.' });

    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const booking = await Booking.findOne(filter);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status === 'Cancelled') return res.status(400).json({ message: 'This booking is already cancelled.' });

    booking.status = 'Cancelled';
    await booking.save();
    await syncSlotAvailability(booking.parkingSlot);
    await booking.populate(bookingPopulate);
    return res.json({ message: 'Booking cancelled and slot made available.', booking });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Booking not found.' });
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const booking = await Booking.findOne(filter);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const parkingSlotId = booking.parkingSlot;
    await booking.deleteOne();
    await syncSlotAvailability(parkingSlotId);
    return res.json({ message: 'Booking deleted successfully. Slot availability was synchronized.' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Booking not found.' });
    next(error);
  }
};

module.exports = { createBooking, getBookings, getMyBookings, searchBookings, updateBooking, deleteBooking };
