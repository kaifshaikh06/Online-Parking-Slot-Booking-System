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
  const cards = [['Total Parking Slots', stats.totalSlots], ['Available Slots', stats.availableSlots], ['Booked Slots', stats.bookedSlots], ['Total Bookings', stats.totalBookings]];
  return <main className="container page"><div className="page-heading"><div><p className="eyebrow">Admin area</p><h1>Parking overview</h1></div><Link to="/admin/slots/new" className="button">Add Parking Slot</Link></div><div className="stats-grid">{cards.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="quick-links"><Link to="/admin/slots">Manage Parking Slots</Link><Link to="/admin/bookings">View & Search Bookings</Link></div></main>;
};

export default AdminDashboard;
