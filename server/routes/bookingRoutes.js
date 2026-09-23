const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const { createBooking, getBookings, getMyBookings, getBookingSchedule, searchBookings, updateBooking, deleteBooking } = require('../controllers/bookingController');

const router = express.Router();
router.use(authMiddleware);
router.post('/', userMiddleware, createBooking);
router.get('/my', userMiddleware, getMyBookings);
router.get('/schedule', userMiddleware, getBookingSchedule);
router.get('/search', adminMiddleware, searchBookings);
router.get('/', adminMiddleware, getBookings);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router;
