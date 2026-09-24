const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const {
  isBookingReserved,
  releaseExpiredBookings,
  syncSlotAvailability,
} = require("../services/bookingExpiryService");
const { getNextBookingNumber } = require("../services/bookingNumberService");

const bookingPopulate = [
  { path: "user", select: "name email phone" },
  {
    path: "parkingSlot",
    select: "slotNumber location vehicleType price status",
  },
];

const validTime = (value) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
const bookingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const getDayBounds = (bookingDate) => {
  const start = new Date(`${bookingDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const validateBooking = ({
  vehicleNumber,
  bookingDate,
  startTime,
  endTime,
}) => {
  if (!String(vehicleNumber || "").trim()) return "Vehicle number is required.";
  if (
    !bookingDate ||
    !bookingDatePattern.test(bookingDate) ||
    Number.isNaN(new Date(`${bookingDate}T00:00:00.000Z`).getTime())
  )
    return "A valid booking date is required.";
  if (!validTime(startTime) || !validTime(endTime))
    return "Start and end time must be valid times.";
  if (startTime >= endTime) return "End time must be later than start time.";
  if (new Date(`${bookingDate}T${startTime}:00`) <= new Date())
    return "Booking start time must be in the future.";
  return null;
};

const createBooking = async (req, res, next) => {
  try {
    const { parkingSlot, vehicleNumber, bookingDate, startTime, endTime } =
      req.body;
    const message = validateBooking({
      vehicleNumber,
      bookingDate,
      startTime,
      endTime,
    });
    if (message) return res.status(400).json({ message });
    if (!parkingSlot)
      return res.status(400).json({ message: "Parking slot is required." });

    const { start: dayStart, end: dayEnd } = getDayBounds(bookingDate);
    const slot = await ParkingSlot.findById(parkingSlot);
    if (!slot)
      return res.status(404).json({ message: "Parking slot not found." });

    await releaseExpiredBookings();
    const conflictingBooking = await Booking.findOne({
      parkingSlot: slot._id,
      status: "Booked",
      bookingDate: { $gte: dayStart, $lt: dayEnd },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflictingBooking)
      return res
        .status(400)
        .json({
          message: `This slot is reserved until ${conflictingBooking.endTime}. Choose a time after it ends.`,
        });

    try {
      let booking;
      for (let attempt = 0; attempt < 3 && !booking; attempt += 1) {
        try {
          booking = await Booking.create({
            bookingNumber: await getNextBookingNumber(),
            user: req.user._id,
            parkingSlot: slot._id,
            vehicleNumber: vehicleNumber.trim(),
            bookingDate,
            startTime,
            endTime,
          });
        } catch (creationError) {
          if (
            creationError.code !== 11000 ||
            !creationError.keyPattern?.bookingNumber ||
            attempt === 2
          )
            throw creationError;
        }
      }
      await syncSlotAvailability(slot._id);
      await booking.populate(bookingPopulate);
      return res
        .status(201)
        .json({ message: "Parking slot booked successfully.", booking });
    } catch (creationError) {
      await syncSlotAvailability(slot._id);
      throw creationError;
    }
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Parking slot not found." });
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate(bookingPopulate)
      .sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("parkingSlot", "slotNumber location vehicleType price status")
      .sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getBookingSchedule = async (req, res, next) => {
  try {
    const { bookingDate } = req.query;
    if (!bookingDate || !bookingDatePattern.test(bookingDate))
      return res
        .status(400)
        .json({ message: "A valid booking date is required." });
    const { start, end } = getDayBounds(bookingDate);
    const schedule = await Booking.find({
      bookingDate: { $gte: start, $lt: end },
      status: "Booked",
    })
      .select("parkingSlot startTime endTime bookingDate status")
      .sort({ startTime: 1 });
    return res.json({
      bookings: schedule
        .filter((booking) => isBookingReserved(booking))
        .map((booking) => ({
          parkingSlot: booking.parkingSlot,
          startTime: booking.startTime,
          endTime: booking.endTime,
        })),
    });
  } catch (error) {
    next(error);
  }
};

const searchBookings = async (req, res, next) => {
  try {
    const { slotNumber = "", vehicleNumber = "" } = req.query;
    if (!slotNumber.trim() && !vehicleNumber.trim())
      return res.json({ bookings: [] });

    const conditions = [];
    if (slotNumber.trim()) {
      const slots = await ParkingSlot.find({
        slotNumber: { $regex: slotNumber.trim(), $options: "i" },
      }).select("_id");
      conditions.push({ parkingSlot: { $in: slots.map((slot) => slot._id) } });
    }
    if (vehicleNumber.trim())
      conditions.push({
        vehicleNumber: { $regex: vehicleNumber.trim(), $options: "i" },
      });

    const bookings = await Booking.find({ $or: conditions })
      .populate(bookingPopulate)
      .sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status !== "Cancelled")
      return res
        .status(400)
        .json({ message: "Only cancellation of a booking is supported." });

    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user._id };
    const booking = await Booking.findOne(filter);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "Cancelled")
      return res
        .status(400)
        .json({ message: "This booking is already cancelled." });

    booking.status = "Cancelled";
    await booking.save();
    await syncSlotAvailability(booking.parkingSlot);
    await booking.populate(bookingPopulate);
    return res.json({
      message: "Booking cancelled and slot made available.",
      booking,
    });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Booking not found." });
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user._id };
    const booking = await Booking.findOne(filter);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    const parkingSlotId = booking.parkingSlot;
    await booking.deleteOne();
    await syncSlotAvailability(parkingSlotId);
    return res.json({
      message:
        "Booking deleted successfully. Slot availability was synchronized.",
    });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Booking not found." });
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  getBookingSchedule,
  searchBookings,
  updateBooking,
  deleteBooking,
};
