import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/slots/stats').then(({ data }) => setStats(data)).catch((err) => setError(getErrorMessage(err))); }, []);
  if (error) return <main className="container page"><Message>{error}</Message></main>;
  if (!stats) return <main className="container page"><Loading /></main>;
  const cards = [
    ['Total Parking Slots', stats.totalSlots, 'Configured spaces'],
    ['Available Now', stats.availableSlots, 'Ready to reserve'],
    ['Booked Now', stats.bookedSlots, 'Currently occupied'],
    ['Bookings This Month', stats.monthlyBookings, 'Bookings scheduled this month'],
    ['Total Bookings', stats.totalBookings, 'All booking records']
  ];
  const occupancy = stats.totalSlots ? Math.round((stats.bookedSlots / stats.totalSlots) * 100) : 0;
  return <main className="container page"><div className="page-heading"><div><p className="eyebrow">Admin area</p><h1>Parking overview</h1><p className="page-subtitle">Monitor capacity and monthly booking activity in one place.</p></div><Link to="/admin/slots/new" className="button">Add Parking Slot</Link></div><div className="stats-grid dashboard-stats">{cards.map(([label, value, description]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{description}</small></article>)}</div><section className="dashboard-panel"><div><p className="eyebrow">Current capacity</p><h2>{occupancy}% of spaces are booked</h2><p>{stats.availableSlots} of {stats.totalSlots} parking spaces are available for new bookings.</p></div><div className="capacity-track" aria-label={`${occupancy}% of spaces are booked`}><span style={{ width: `${occupancy}%` }} /></div></section><div className="quick-links"><Link to="/admin/slots">Manage Parking Slots</Link><Link to="/admin/bookings">View & Search Bookings</Link></div></main>;
};

export default AdminDashboard;
