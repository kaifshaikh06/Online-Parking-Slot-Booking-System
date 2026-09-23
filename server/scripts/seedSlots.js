require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDatabase = require('../config/db');
const ParkingSlot = require('../models/ParkingSlot');

const defaultSlots = Array.from({ length: 20 }, (_, index) => ({
  slotNumber: `A-${String(index + 1).padStart(2, '0')}`,
  price: 50,
  status: 'Available'
}));

const seedSlots = async () => {
  await connectDatabase();
  const result = await ParkingSlot.bulkWrite(
    defaultSlots.map((slot) => ({
      updateOne: {
        filter: { slotNumber: slot.slotNumber },
        update: { $set: { location: 'Level A', vehicleType: 'Sedan' }, $setOnInsert: slot },
        upsert: true
      }
    }))
  );
  await ParkingSlot.updateMany({ vehicleType: { $nin: ['Sedan', 'SUV', 'Coupe', 'Muscle', 'Hatchback', 'Convertible'] } }, { $set: { vehicleType: 'Sedan' } });
  console.log(`${result.upsertedCount || 0} new parking slots added. A-01 to A-20 are ready at Level A.`);
  process.exit(0);
};

seedSlots().catch((error) => {
  console.error(`Unable to seed parking slots: ${error.message}`);
  process.exit(1);
});
