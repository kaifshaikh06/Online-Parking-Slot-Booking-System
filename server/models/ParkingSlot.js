const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    vehicleType: { type: String, required: true, trim: true, maxlength: 30 },
    status: { type: String, enum: ['Available', 'Booked'], default: 'Available' },
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, collection: 'parking_slots' }
);

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
