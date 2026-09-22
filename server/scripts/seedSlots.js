require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDatabase = require('../config/db');
const ParkingSlot = require('../models/ParkingSlot');

const defaultSlots = Array.from({ length: 20 }, (_, index) => ({
  slotNumber: `A-${String(index + 1).padStart(2, '0')}`,
  location: 'Level A',
  vehicleType: 'Car',
  price: 50,
  status: 'Available'
}));

const seedSlots = async () => {
  await connectDatabase();
  const result = await ParkingSlot.bulkWrite(
    defaultSlots.map((slot) => ({
      updateOne: {
        filter: { slotNumber: slot.slotNumber },
        update: { $setOnInsert: slot },
        upsert: true
      }
    }))
  );
  console.log(`${result.upsertedCount || 0} new parking slots added. A-01 to A-20 are ready.`);
  process.exit(0);
};

seedSlots().catch((error) => {
  console.error(`Unable to seed parking slots: ${error.message}`);
  process.exit(1);
});
