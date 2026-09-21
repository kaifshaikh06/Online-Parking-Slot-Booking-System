import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';
import StatusBadge from '../components/StatusBadge';

const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const BookingRows = ({ bookings }) => <div className="table-wrap"><table><thead><tr><th>Booking ID</th><th>User</th><th>Slot Number</th><th>Vehicle Number</th><th>Booking Date</th><th>Start</th><th>End</th><th>Status</th><th>Created Date</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking._id}><td className="id-cell">{booking._id}</td><td>{booking.user?.name || 'Deleted user'}<small>{booking.user?.email}</small></td><td>{booking.parkingSlot?.slotNumber || 'Deleted slot'}</td><td>{booking.vehicleNumber}</td><td>{date(booking.bookingDate)}</td><td>{booking.startTime}</td><td>{booking.endTime}</td><td><StatusBadge status={booking.status} /></td><td>{date(booking.createdAt)}</td></tr>)}</tbody></table></div>;

const SearchBookings = () => {
  const [bookings, setBookings] = useState(null); const [query, setQuery] = useState({ slotNumber: '', vehicleNumber: '' }); const [error, setError] = useState(''); const [searched, setSearched] = useState(false);
  const loadAll = () => api.get('/bookings').then(({ data }) => setBookings(data.bookings)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { loadAll(); }, []);
  const search = async (event) => { event.preventDefault(); setError(''); setSearched(true); try { const { data } = await api.get('/bookings/search', { params: query }); setBookings(data.bookings); } catch (err) { setError(getErrorMessage(err)); } };
  const clear = () => { setQuery({ slotNumber: '', vehicleNumber: '' }); setSearched(false); loadAll(); };
  return <main className="container page"><div className="page-heading"><div><p className="eyebrow">Admin area</p><h1>Bookings & Search</h1></div></div><form className="search-form" onSubmit={search}><label>Slot Number<input value={query.slotNumber} onChange={(e) => setQuery({ ...query, slotNumber: e.target.value })} placeholder="A-01" /></label><label>Vehicle Number<input value={query.vehicleNumber} onChange={(e) => setQuery({ ...query, vehicleNumber: e.target.value })} placeholder="GJ05AB1234" /></label><button className="button">Search</button>{searched && <button type="button" className="button button-outline" onClick={clear}>Show All</button>}</form><Message>{error}</Message>{!bookings ? <Loading /> : bookings.length === 0 ? <p className="empty-state">No bookings found.</p> : <BookingRows bookings={bookings} />}</main>;
};

export default SearchBookings;
