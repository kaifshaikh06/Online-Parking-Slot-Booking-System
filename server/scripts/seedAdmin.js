require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDatabase = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  await connectDatabase();
  const email = 'admin@example.com';
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log('Existing admin account verified.');
  } else {
    await User.create({
      name: 'System Admin',
      email,
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin'
    });
    console.log('Admin account created: admin@example.com / Admin@123');
  }
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error(`Unable to seed admin: ${error.message}`);
  process.exit(1);
});
