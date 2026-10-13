const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const userMiddleware = require("../middleware/userMiddleware");
const {
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
} = require("../controllers/bookingController");

const router = express.Router();
router.get("/reviews", getReviews);
router.get("/services", getParkingServices);
router.use(authMiddleware);
router.post("/", userMiddleware, createBooking);
router.post("/long-term", userMiddleware, createLongTermBooking);
router.get("/my", userMiddleware, getMyBookings);
router.get("/analytics/my", userMiddleware, getUserAnalytics);
router.get("/analytics/admin", adminMiddleware, getAdminAnalytics);
router.get("/review-prompt", userMiddleware, getReviewPrompt);
router.get("/search", adminMiddleware, searchBookings);
router.get("/", adminMiddleware, getBookings);
router.post("/:id/review", userMiddleware, submitReview);
router.post("/:id/extend", userMiddleware, extendBooking);
router.post("/:id/checkout", userMiddleware, checkoutBooking);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

module.exports = router;
