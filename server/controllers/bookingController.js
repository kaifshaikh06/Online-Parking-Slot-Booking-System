const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const {
  getBookingEndDateTime,
  releaseExpiredBookings,
  syncSlotAvailability,
} = require("../services/bookingExpiryService");
const { getNextBookingNumber } = require("../services/bookingNumberService");
const {
  getSelectedAddOns,
  parkingAddOns,
} = require("../services/parkingAddOnService");

const LONG_TERM_DAILY_RATE = 1000;
const OVERSTAY_HOURLY_RATE = 1000;
const longTermSlotPattern = /^A-(1[6-9]|20)$/;
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

const isValidBookingDay = (bookingDate) =>
  bookingDatePattern.test(String(bookingDate || "")) &&
  !Number.isNaN(new Date(`${bookingDate}T00:00:00.000Z`).getTime());

const getTodayDay = () => new Date().toISOString().slice(0, 10);

const addDays = (bookingDate, days) => {
  const date = new Date(`${bookingDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const validateVehicle = ({ vehicleNumber, vehicleName }) => {
  if (!String(vehicleNumber || "").trim()) return "Vehicle number is required.";
  if (!String(vehicleName || "").trim()) return "Car name is required.";
  if (String(vehicleName).trim().length > 60)
    return "Car name must be 60 characters or fewer.";
  return null;
};

const validateBooking = ({
  vehicleNumber,
  vehicleName,
  bookingDate,
  startTime,
  endTime,
}) => {
  const vehicleMessage = validateVehicle({ vehicleNumber, vehicleName });
  if (vehicleMessage) return vehicleMessage;
  if (!isValidBookingDay(bookingDate)) return "A valid booking date is required.";
  if (!validTime(startTime) || !validTime(endTime))
    return "Start and end time must be valid times.";
  if (startTime >= endTime) return "End time must be later than start time.";
  if (new Date(`${bookingDate}T${startTime}:00`) <= new Date())
    return "Booking start time must be in the future.";
  return null;
};

const validateLongTermBooking = ({
  vehicleNumber,
  vehicleName,
  bookingDate,
  durationDays,
}) => {
  const vehicleMessage = validateVehicle({ vehicleNumber, vehicleName });
  if (vehicleMessage) return vehicleMessage;
  if (!isValidBookingDay(bookingDate)) return "A valid start date is required.";
  if (bookingDate < getTodayDay())
    return "Long-term parking cannot start in the past.";

  const days = Number(durationDays);
  if (!Number.isInteger(days) || days < 2 || days > 30)
    return "Long-term parking duration must be from 2 to 30 days.";
  return null;
};

const lockAvailableSlot = async (parkingSlotId) => {
  await releaseExpiredBookings();
  const slotExists = await ParkingSlot.exists({ _id: parkingSlotId });
  if (!slotExists) {
    const error = new Error("Parking slot not found.");
    error.statusCode = 404;
    throw error;
  }

  const slot = await ParkingSlot.findOneAndUpdate(
    { _id: parkingSlotId, status: "Available" },
    { status: "Booked" },
    { new: true },
  );
  if (!slot) {
    const error = new Error(
      "This parking slot is already booked and unavailable.",
    );
    error.statusCode = 400;
    throw error;
  }
  return slot;
};

const createNumberedBooking = async (details) => {
  let booking;
  for (let attempt = 0; attempt < 3 && !booking; attempt += 1) {
    try {
      booking = await Booking.create({
        ...details,
        bookingNumber: await getNextBookingNumber(),
      });
    } catch (error) {
      if (
        error.code !== 11000 ||
        !error.keyPattern?.bookingNumber ||
        attempt === 2
      ) {
        throw error;
      }
    }
  }
  return booking;
};

const createBooking = async (req, res, next) => {
  try {
    const {
      parkingSlot,
      vehicleNumber,
      vehicleName,
      bookingDate,
      startTime,
      endTime,
      addOnCodes = [],
    } = req.body;
    const message = validateBooking({
      vehicleNumber,
      vehicleName,
      bookingDate,
      startTime,
      endTime,
    });
    if (message) return res.status(400).json({ message });
    if (!parkingSlot)
      return res.status(400).json({ message: "Parking slot is required." });

    const addOns = getSelectedAddOns(addOnCodes);
    const addOnTotal = addOns.reduce((total, addOn) => total + addOn.price, 0);

    const slot = await lockAvailableSlot(parkingSlot);
    try {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const durationHours =
        (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
      const parkingTotal = slot.price * durationHours;
      const booking = await createNumberedBooking({
        user: req.user._id,
        parkingSlot: slot._id,
        vehicleNumber: vehicleNumber.trim(),
        vehicleName: vehicleName.trim(),
        bookingDate,
        startTime,
        endTime,
        bookingType: "Hourly",
        parkingRate: slot.price,
        parkingTotal,
        addOns,
        addOnTotal,
      });
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
    if (error.name === "CastError" || error.statusCode === 404)
      return res.status(404).json({ message: "Parking slot not found." });
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

const getParkingServices = (req, res) => {
  res.json({ services: parkingAddOns });
};

const getBookingAmount = (booking) =>
  Number(booking.parkingTotal || 0) +
  Number(booking.addOnTotal || 0) +
  Number(booking.overstayCharge || 0);

const extendBooking = async (req, res, next) => {
  try {
    const newEndTime = String(req.body.endTime || "");
    if (!validTime(newEndTime))
      return res.status(400).json({ message: "Choose a valid new end time." });

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "Booked",
      bookingType: "Hourly",
    }).populate("parkingSlot", "price");
    if (!booking)
      return res.status(404).json({ message: "Active hourly booking not found." });
    if (getBookingEndDateTime(booking) <= new Date()) {
      return res.status(400).json({
        message: "This booking has already ended and can no longer be extended.",
      });
    }
    if (newEndTime <= booking.endTime) {
      return res.status(400).json({
        message: "The new end time must be later than the current end time.",
      });
    }

    const [oldHour, oldMinute] = booking.endTime.split(":").map(Number);
    const [newHour, newMinute] = newEndTime.split(":").map(Number);
    const extraHours = (newHour * 60 + newMinute - oldHour * 60 - oldMinute) / 60;
    const hourlyRate = Number(booking.parkingRate ?? booking.parkingSlot?.price ?? 0);
    const extraCharge = hourlyRate * extraHours;

    booking.endTime = newEndTime;
    booking.parkingRate = hourlyRate;
    booking.parkingTotal = Number(booking.parkingTotal || 0) + extraCharge;
    await booking.save();
    await syncSlotAvailability(booking.parkingSlot._id || booking.parkingSlot);
    await booking.populate(bookingPopulate);
    return res.json({
      message: `Booking extended by ${extraHours} hour${extraHours === 1 ? "" : "s"}.`,
      booking,
      extraCharge,
    });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Booking not found." });
    next(error);
  }
};

const checkoutBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "Booked",
    });
    if (!booking) return res.status(404).json({ message: "Active booking not found." });

    const exitTime = new Date();
    const scheduledEnd = getBookingEndDateTime(booking);
    const extraMilliseconds = Math.max(0, exitTime - scheduledEnd);
    const overstayHours = extraMilliseconds
      ? Math.ceil(extraMilliseconds / (60 * 60 * 1000))
      : 0;
    booking.actualExitTime = exitTime;
    booking.overstayHours = overstayHours;
    booking.overstayCharge = overstayHours * OVERSTAY_HOURLY_RATE;
    booking.status = "Completed";
    await booking.save();
    await syncSlotAvailability(booking.parkingSlot);
    await booking.populate(bookingPopulate);
    return res.json({
      message:
        overstayHours > 0
          ? `Parking checked out. ₹${booking.overstayCharge} overstay charge was added.`
          : "Parking checked out successfully.",
      booking,
    });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Booking not found." });
    next(error);
  }
};

const createLongTermBooking = async (req, res, next) => {
  try {
    const { parkingSlot, vehicleNumber, vehicleName, bookingDate, durationDays } =
      req.body;
    const message = validateLongTermBooking({
      vehicleNumber,
      vehicleName,
      bookingDate,
      durationDays,
    });
    if (message) return res.status(400).json({ message });
    if (!parkingSlot)
      return res.status(400).json({ message: "Parking slot is required." });

    const eligibleSlot = await ParkingSlot.findOne({
      _id: parkingSlot,
      slotNumber: longTermSlotPattern,
    }).select("_id");
    if (!eligibleSlot) {
      return res.status(400).json({
        message: "Long-term parking is available only in slots A-16 to A-20.",
      });
    }

    const days = Number(durationDays);
    const slot = await lockAvailableSlot(parkingSlot);
    try {
      const carWashDates = Array.from(
        { length: Math.floor(days / 3) },
        (_, index) => addDays(bookingDate, (index + 1) * 3),
      );
      const booking = await createNumberedBooking({
        user: req.user._id,
        parkingSlot: slot._id,
        vehicleNumber: vehicleNumber.trim(),
        vehicleName: vehicleName.trim(),
        bookingDate,
        startTime: "00:00",
        endTime: "00:00",
        bookingType: "LongTerm",
        durationDays: days,
        endDate: addDays(bookingDate, days),
        dailyRate: LONG_TERM_DAILY_RATE,
        parkingTotal: days * LONG_TERM_DAILY_RATE,
        carWashDates,
      });
      await syncSlotAvailability(slot._id);
      await booking.populate(bookingPopulate);
      return res.status(201).json({
        message: "Long-term parking booked successfully.",
        booking,
      });
    } catch (creationError) {
      await syncSlotAvailability(slot._id);
      throw creationError;
    }
  } catch (error) {
    if (error.name === "CastError" || error.statusCode === 404)
      return res.status(404).json({ message: "Parking slot not found." });
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
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

const createMonthSeries = (bookings, amountSelector) => {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    date.setHours(0, 0, 0, 0);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-IN", { month: "short" }),
      value: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  bookings.forEach((booking) => {
    const date = new Date(booking.bookingDate);
    const month = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (month) month.value += amountSelector(booking);
  });
  return months;
};

const createRevenueSeries = (bookings) => {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    date.setHours(0, 0, 0, 0);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-IN", { month: "short" }),
      parking: 0,
      services: 0,
      overstay: 0,
      total: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  bookings.forEach((booking) => {
    const date = new Date(booking.bookingDate);
    const month = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (!month) return;
    month.parking += Number(booking.parkingTotal || 0);
    month.services += Number(booking.addOnTotal || 0);
    month.overstay += Number(booking.overstayCharge || 0);
    month.total += getBookingAmount(booking);
  });
  return months;
};

const getUserAnalytics = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $ne: "Cancelled" },
    }).select(
      "bookingDate parkingTotal addOnTotal overstayCharge status",
    );
    const monthlySpend = createMonthSeries(bookings, getBookingAmount);
    return res.json({
      monthlySpend,
      totalSpend: monthlySpend.reduce((total, month) => total + month.value, 0),
    });
  } catch (error) {
    next(error);
  }
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const bookings = await Booking.find().select(
      "bookingDate vehicleName status parkingTotal addOnTotal overstayCharge",
    );
    const revenueBookings = bookings.filter(
      (booking) => booking.status !== "Cancelled",
    );
    const cancelledBookings = bookings.filter(
      (booking) => booking.status === "Cancelled",
    );
    const carNameCounts = new Map();
    revenueBookings.forEach((booking) => {
      const name = booking.vehicleName?.trim() || "Unnamed car";
      carNameCounts.set(name, (carNameCounts.get(name) || 0) + 1);
    });
    const carBookings = [...carNameCounts.entries()]
      .sort(([, first], [, second]) => second - first)
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    return res.json({
      totalRevenue: revenueBookings.reduce(
        (total, booking) => total + getBookingAmount(booking),
        0,
      ),
      cancelledValue: cancelledBookings.reduce(
        (total, booking) => total + getBookingAmount(booking),
        0,
      ),
      cancelledCount: cancelledBookings.length,
      monthlyRevenue: createRevenueSeries(revenueBookings),
      carBookings,
    });
  } catch (error) {
    next(error);
  }
};

const searchBookings = async (req, res, next) => {
  try {
    const { slotNumber = "", vehicleNumber = "", vehicleName = "" } = req.query;
    if (!slotNumber.trim() && !vehicleNumber.trim() && !vehicleName.trim())
      return res.json({ bookings: [] });

    const conditions = [];
    if (slotNumber.trim()) {
      const slots = await ParkingSlot.find({
        slotNumber: { $regex: slotNumber.trim(), $options: "i" },
      }).select("_id");
      conditions.push({ parkingSlot: { $in: slots.map((slot) => slot._id) } });
    }
    if (vehicleNumber.trim()) {
      conditions.push({
        vehicleNumber: { $regex: vehicleNumber.trim(), $options: "i" },
      });
    }
    if (vehicleName.trim()) {
      conditions.push({
        vehicleName: { $regex: vehicleName.trim(), $options: "i" },
      });
    }

    const bookings = await Booking.find({ $or: conditions })
      .populate(bookingPopulate)
      .sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const reviews = await Booking.find({ "review.rating": { $exists: true } })
      .populate([
        { path: "user", select: "name" },
        { path: "parkingSlot", select: "slotNumber" },
      ])
      .sort({ "review.createdAt": -1 });
    return res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

const findPendingReviewBooking = async (userId) => {
  const bookings = await Booking.find({
    user: userId,
    status: "Booked",
    "review.rating": { $exists: false },
  })
    .populate("parkingSlot", "slotNumber")
    .sort({ bookingDate: -1, createdAt: -1 });

  return bookings.find((booking) => getBookingEndDateTime(booking) <= new Date());
};

const getReviewPrompt = async (req, res, next) => {
  try {
    const booking = await findPendingReviewBooking(req.user._id);
    return res.json({ booking: booking || null });
  } catch (error) {
    next(error);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Choose a rating from 1 to 5." });
    if (!comment) return res.status(400).json({ message: "A review comment is required." });
    if (comment.length > 500)
      return res.status(400).json({ message: "Review comments can be up to 500 characters." });

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.review?.rating)
      return res.status(400).json({ message: "You have already reviewed this booking." });
    if (
      !["Booked", "Completed"].includes(booking.status) ||
      getBookingEndDateTime(booking) > new Date()
    )
      return res.status(400).json({
        message: "A review can be submitted after the parking period has ended.",
      });

    booking.review = { rating, comment, createdAt: new Date() };
    await booking.save();
    await booking.populate(bookingPopulate);
    return res.status(201).json({ message: "Thank you for your review.", booking });
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Booking not found." });
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
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "Cancelled")
      return res.status(400).json({ message: "This booking is already cancelled." });

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
    if (!booking) return res.status(404).json({ message: "Booking not found." });

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
  createLongTermBooking,
  getParkingServices,
  getBookings,
  getMyBookings,
  extendBooking,
  checkoutBooking,
  getUserAnalytics,
  getAdminAnalytics,
  searchBookings,
  getReviews,
  getReviewPrompt,
  submitReview,
  updateBooking,
  deleteBooking,
};
