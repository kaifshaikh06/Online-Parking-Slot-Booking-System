import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Message from '../components/Message';

const UserDashboard = () => {
  const { user } = useAuth(); const [stats, setStats] = useState(null); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.get('/slots?status=Available'), api.get('/bookings/my')]).then(([slotResponse, bookingResponse]) => setStats({ available: slotResponse.data.slots.length, active: bookingResponse.data.bookings.filter((booking) => booking.status === 'Booked').length })).catch((err) => setError(getErrorMessage(err))); }, []);
  return <main className="container page"><p className="eyebrow">Your dashboard</p><h1>Welcome, {user.name}</h1><Message>{error}</Message>{!stats ? <Loading /> : <><div className="stats-grid"><article className="stat-card"><span>Available Parking Slots</span><strong>{stats.available}</strong></article><article className="stat-card"><span>My Active Bookings</span><strong>{stats.active}</strong></article></div><div className="quick-links"><Link to="/book-slot">Book a Slot</Link><Link to="/my-bookings">My Bookings</Link></div></>}</main>;
};

export default UserDashboard;
