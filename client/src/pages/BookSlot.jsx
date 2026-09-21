import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';

const today = new Date().toISOString().slice(0, 10);
const BookSlot = () => {
  const [slots, setSlots] = useState(null); const [selected, setSelected] = useState(null); const [form, setForm] = useState({ vehicleNumber: '', bookingDate: today, startTime: '', endTime: '' }); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [saving, setSaving] = useState(false); const navigate = useNavigate();
  const loadSlots = () => api.get('/slots?status=Available').then(({ data }) => setSlots(data.slots)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { loadSlots(); }, []);
  const submit = async (event) => { event.preventDefault(); setError(''); setSuccess(''); if (!selected) return setError('Please select an available parking slot.'); if (form.endTime <= form.startTime) return setError('End time must be later than start time.'); setSaving(true); try { const { data } = await api.post('/bookings', { ...form, parkingSlot: selected._id }); setSuccess(data.message); setTimeout(() => navigate('/my-bookings'), 700); } catch (err) { setError(getErrorMessage(err)); loadSlots(); } finally { setSaving(false); } };
  return <main className="container page"><p className="eyebrow">Make a reservation</p><h1>Book a Parking Slot</h1><Message>{error}</Message><Message type="success">{success}</Message>{!slots ? <Loading /> : slots.length === 0 ? <p className="empty-state">No parking slots available.</p> : <><div className="slot-grid">{slots.map((slot) => <article className={`slot-card ${selected?._id === slot._id ? 'selected' : ''}`} key={slot._id}><h2>{slot.slotNumber}</h2><p>{slot.location}</p><p>{slot.vehicleType} · ₹{slot.price}</p><button className="button button-small" onClick={() => setSelected(slot)}>{selected?._id === slot._id ? 'Selected' : 'Book'}</button></article>)}</div>{selected && <form className="form-card booking-form" onSubmit={submit}><h2>Booking details for {selected.slotNumber}</h2><div className="form-grid"><label>Parking Slot<input value={`${selected.slotNumber} — ${selected.location}`} disabled /></label><label>Vehicle Number<input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} placeholder="GJ05AB1234" required /></label><label>Booking Date<input type="date" min={today} value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} required /></label><label>Start Time<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label><label>End Time<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label></div><button className="button" disabled={saving}>{saving ? 'Booking...' : 'Confirm Booking'}</button></form>}</>}</main>;
};

export default BookSlot;
