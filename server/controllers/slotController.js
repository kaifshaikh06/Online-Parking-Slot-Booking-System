const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

const validateSlot = ({ slotNumber, location, vehicleType, price, status }) => {
  if (!String(slotNumber || '').trim() || !String(location || '').trim() || !String(vehicleType || '').trim()) {
    return 'Slot number, location, and vehicle type are required.';
  }
  if (price === '' || price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
    return 'Price must be a valid non-negative amount.';
  }
  if (!['Available', 'Booked'].includes(status)) return 'Status must be Available or Booked.';
  return null;
};

const createSlot = async (req, res, next) => {
  try {
    const message = validateSlot(req.body);
    if (message) return res.status(400).json({ message });
    const slot = await ParkingSlot.create({
      slotNumber: req.body.slotNumber.trim(),
      location: req.body.location.trim(),
      vehicleType: req.body.vehicleType.trim(),
      price: Number(req.body.price),
      status: req.body.status
    });
    return res.status(201).json({ message: 'Parking slot added successfully.', slot });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'This slot number already exists.' });
    next(error);
  }
};

const getSlots = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!['Available', 'Booked'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid slot status filter.' });
      filter.status = req.query.status;
    }
    const slots = await ParkingSlot.find(filter).sort({ slotNumber: 1 });
    return res.json({ slots });
  } catch (error) {
    next(error);
  }
};

const getSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Parking slot not found.' });
    return res.json({ slot });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Parking slot not found.' });
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const message = validateSlot(req.body);
    if (message) return res.status(400).json({ message });
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Parking slot not found.' });

    if (slot.status === 'Booked' && req.body.status === 'Available') {
      const activeBooking = await Booking.exists({ parkingSlot: slot._id, status: 'Booked' });
      if (activeBooking) return res.status(400).json({ message: 'Cancel the active booking before making this slot available.' });
    }

    slot.slotNumber = req.body.slotNumber.trim();
    slot.location = req.body.location.trim();
    slot.vehicleType = req.body.vehicleType.trim();
    slot.price = Number(req.body.price);
    slot.status = req.body.status;
    await slot.save();
    return res.json({ message: 'Parking slot updated successfully.', slot });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'This slot number already exists.' });
    if (error.name === 'CastError') return res.status(404).json({ message: 'Parking slot not found.' });
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Parking slot not found.' });
    const existingBooking = await Booking.exists({ parkingSlot: slot._id });
    if (existingBooking) return res.status(400).json({ message: 'This slot has booking history and cannot be deleted.' });
    await slot.deleteOne();
    return res.json({ message: 'Parking slot deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Parking slot not found.' });
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [totalSlots, availableSlots, bookedSlots, totalBookings] = await Promise.all([
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ status: 'Available' }),
      ParkingSlot.countDocuments({ status: 'Booked' }),
      Booking.countDocuments()
    ]);
    return res.json({ totalSlots, availableSlots, bookedSlots, totalBookings });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSlot, getSlots, getSlot, updateSlot, deleteSlot, getAdminStats };
