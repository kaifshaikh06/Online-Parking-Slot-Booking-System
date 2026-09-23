require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { startBookingExpiryScheduler } = require('./services/bookingExpiryService');
const { ensureBookingNumbers } = require('./services/bookingNumberService');
const { normalizeParkingSlots } = require('./services/parkingConfigurationService');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ message: 'Parking Booking API is running.' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const port = process.env.PORT || 5000;
connectDatabase().then(async () => {
  await normalizeParkingSlots();
  await ensureBookingNumbers();
  startBookingExpiryScheduler();
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
