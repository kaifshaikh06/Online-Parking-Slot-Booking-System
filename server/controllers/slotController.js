const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const {
  isBookingReserved,
  releaseExpiredBookings,
} = require("../services/bookingExpiryService");
const { carTypes } = require("../services/parkingConfigurationService");

const slotNumberPattern = /^A-(0[1-9]|1[0-9]|20)$/;

const validateSlot = ({ slotNumber, location, vehicleType, price, status }) => {
  const formattedSlotNumber = String(slotNumber || "")
    .trim()
    .toUpperCase();
  if (!formattedSlotNumber || !String(vehicleType || "").trim()) {
    return "Slot number and vehicle type are required.";
  }
  if (!slotNumberPattern.test(formattedSlotNumber))
    return "Slot number must be between A-01 and A-20.";
  if (!carTypes.includes(vehicleType))
    return "Choose one of the supported car types.";
  if (
    price === "" ||
    price === undefined ||
    Number.isNaN(Number(price)) ||
    Number(price) < 0
  ) {
    return "Hourly rate must be a valid non-negative amount.";
  }
  if (!["Available", "Booked"].includes(status))
    return "Status must be Available or Booked.";
  return null;
};

const hasReservedBooking = async (parkingSlotId) => {
  const bookings = await Booking.find({
    parkingSlot: parkingSlotId,
    status: "Booked",
  }).select("bookingDate startTime endTime status");
  return bookings.some((booking) => isBookingReserved(booking));
};

const createSlot = async (req, res, next) => {
  try {
    const message = validateSlot(req.body);
    if (message) return res.status(400).json({ message });
    const slot = await ParkingSlot.create({
      slotNumber: req.body.slotNumber.trim().toUpperCase(),
      location: "Level A",
      vehicleType: req.body.vehicleType.trim(),
      price: Number(req.body.price),
      status: req.body.status,
    });
    return res
      .status(201)
      .json({ message: "Parking slot added successfully.", slot });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(400)
        .json({ message: "This slot number already exists." });
    next(error);
  }
};

const getSlots = async (req, res, next) => {
  try {
    await releaseExpiredBookings();
    const filter = {};
    if (req.query.status) {
      if (!["Available", "Booked"].includes(req.query.status))
        return res.status(400).json({ message: "Invalid slot status filter." });
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
    await releaseExpiredBookings();
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot)
      return res.status(404).json({ message: "Parking slot not found." });
    const reservationLocked = await hasReservedBooking(slot._id);
    return res.json({ slot: { ...slot.toObject(), reservationLocked } });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Parking slot not found." });
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const message = validateSlot(req.body);
    if (message) return res.status(400).json({ message });
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot)
      return res.status(404).json({ message: "Parking slot not found." });
    const requestedSlotNumber = req.body.slotNumber.trim().toUpperCase();
    const reservationLocked = await hasReservedBooking(slot._id);

    if (reservationLocked) {
      const changedProtectedDetails =
        req.body.vehicleType !== slot.vehicleType ||
        Number(req.body.price) !== slot.price ||
        req.body.status !== slot.status;
      if (changedProtectedDetails) {
        return res
          .status(400)
          .json({
            message:
              "This slot has a current or upcoming reservation. Only its slot number can be changed.",
          });
      }
      slot.slotNumber = requestedSlotNumber;
      await slot.save();
      return res.json({
        message:
          "Booked slot number updated successfully. Other slot details remain locked.",
        slot,
      });
    }

    slot.slotNumber = requestedSlotNumber;
    slot.location = "Level A";
    slot.vehicleType = req.body.vehicleType.trim();
    slot.price = Number(req.body.price);
    slot.status = req.body.status;
    await slot.save();
    return res.json({ message: "Parking slot updated successfully.", slot });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(400)
        .json({ message: "This slot number already exists." });
    if (error.name === "CastError")
      return res.status(404).json({ message: "Parking slot not found." });
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot)
      return res.status(404).json({ message: "Parking slot not found." });
    const existingBooking = await Booking.exists({ parkingSlot: slot._id });
    if (existingBooking)
      return res
        .status(400)
        .json({
          message: "This slot has booking history and cannot be deleted.",
        });
    await slot.deleteOne();
    return res.json({ message: "Parking slot deleted successfully." });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Parking slot not found." });
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    await releaseExpiredBookings();
    const currentDate = new Date();
    const startOfMonth = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1),
    );
    const startOfNextMonth = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1),
    );
    const [
      totalSlots,
      availableSlots,
      bookedSlots,
      totalBookings,
      monthlyBookings,
    ] = await Promise.all([
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ status: "Available" }),
      ParkingSlot.countDocuments({ status: "Booked" }),
      Booking.countDocuments(),
      Booking.countDocuments({
        bookingDate: { $gte: startOfMonth, $lt: startOfNextMonth },
        status: "Booked",
      }),
    ]);
    return res.json({
      totalSlots,
      availableSlots,
      bookedSlots,
      totalBookings,
      monthlyBookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlot,
  getSlots,
  getSlot,
  updateSlot,
  deleteSlot,
  getAdminStats,
};
