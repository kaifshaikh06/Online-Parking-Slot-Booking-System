import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Message from '../components/Message';

const isBookingActive = (booking, now) => {
  const bookingDay = new Date(booking.bookingDate).toISOString().slice(0, 10);
  return booking.status === 'Booked' && new Date(`${bookingDay}T${booking.endTime}:00`) > now;
};

const UserDashboard = () => {
  const { user } = useAuth(); const [stats, setStats] = useState(null); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.get('/slots'), api.get('/bookings/my')]).then(([slotResponse, bookingResponse]) => {
    const now = new Date();
    const bookings = bookingResponse.data.bookings;
    setStats({
      available: slotResponse.data.slots.filter((slot) => slot.status === 'Available').length,
      active: bookings.filter((booking) => isBookingActive(booking, now)).length,
      monthly: bookings.filter((booking) => booking.status === 'Booked' && new Date(booking.bookingDate).getMonth() === now.getMonth() && new Date(booking.bookingDate).getFullYear() === now.getFullYear()).length
    });
  }).catch((err) => setError(getErrorMessage(err))); }, []);
  return <main className="container page"><p className="eyebrow">Your dashboard</p><h1>Welcome, {user.name}</h1><p className="page-subtitle">Find a space, reserve it by the hour, and keep track of your parking.</p><Message>{error}</Message>{!stats ? <Loading /> : <><div className="stats-grid dashboard-stats user-dashboard-stats"><article className="stat-card"><span>Available Parking Slots</span><strong>{stats.available}</strong><small>Choose your space on the parking map</small></article><article className="stat-card"><span>My Active Bookings</span><strong>{stats.active}</strong><small>Bookings you can currently manage</small></article><article className="stat-card"><span>My Bookings This Month</span><strong>{stats.monthly}</strong><small>Bookings scheduled this month</small></article></div><section className="dashboard-panel user-dashboard-panel"><div><p className="eyebrow">Ready to park?</p><h2>Choose from 20 marked parking spaces.</h2><p>Each parking space shows its current availability and hourly booking rate.</p></div><Link className="button" to="/book-slot">Open Parking Map</Link></section><div className="quick-links"><Link to="/book-slot">Book a Slot</Link><Link to="/my-bookings">My Bookings</Link></div></>}</main>;
};

export default UserDashboard;
