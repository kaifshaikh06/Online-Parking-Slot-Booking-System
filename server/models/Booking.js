const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parkingSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 25 },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ['Booked', 'Cancelled'], default: 'Booked' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
