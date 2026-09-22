import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';

const today = new Date().toISOString().slice(0, 10);
const parkingSpaceNumbers = Array.from({ length: 20 }, (_, index) => `A-${String(index + 1).padStart(2, '0')}`);

const getDurationInHours = (startTime, endTime) => {
  if (!startTime || !endTime || endTime <= startTime) return 0;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
};

const BookSlot = () => {
  const [slots, setSlots] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ vehicleNumber: '', bookingDate: today, startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadSlots = () => api.get('/slots').then(({ data }) => setSlots(data.slots)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { loadSlots(); }, []);

  const parkingMap = useMemo(() => parkingSpaceNumbers.map((slotNumber) => slots?.find((slot) => slot.slotNumber === slotNumber) || { slotNumber, status: 'Not configured' }), [slots]);
  const duration = getDurationInHours(form.startTime, form.endTime);
  const estimatedCost = selected && duration ? selected.price * duration : 0;

  const chooseSlot = (slot) => {
    if (slot.status !== 'Available') return;
    setSelected(slot);
    setPaymentOpen(false);
    setError('');
  };

  const preparePayment = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!selected) return setError('Please select an available parking slot.');
    if (!form.startTime || !form.endTime) return setError('Start time and end time are required.');
    if (form.endTime <= form.startTime) return setError('End time must be later than start time.');
    setPaymentOpen(true);
  };

  const completeDummyPayment = async () => {
    setError('');
    setSaving(true);
    try {
      await api.post('/bookings', { ...form, parkingSlot: selected._id });
      setPaymentOpen(false);
      setSuccess('Payment completed successfully. Your parking booking is confirmed.');
      setTimeout(() => navigate('/my-bookings'), 1400);
    } catch (err) {
      setError(getErrorMessage(err));
      setPaymentOpen(false);
      setSelected(null);
      loadSlots();
    } finally {
      setSaving(false);
    }
  };

  return <main className="container page"><p className="eyebrow">Make a reservation</p><h1>Book a Parking Slot</h1><p className="page-subtitle">Select a marked parking space, then reserve it at its hourly rate.</p><Message>{error}</Message><Message type="success">{success}</Message>{!slots ? <Loading /> : <><div className="parking-legend"><span><i className="legend available" />Available</span><span><i className="legend booked" />Booked</span><span><i className="legend unavailable" />Not configured</span></div><section className="parking-map" aria-label="Parking space map">{parkingMap.map((slot) => { const isAvailable = slot.status === 'Available'; const isSelected = selected?._id === slot._id; return <button type="button" key={slot.slotNumber} className={`parking-space ${isAvailable ? 'available' : slot.status === 'Booked' ? 'booked' : 'unavailable'} ${isSelected ? 'selected' : ''}`} onClick={() => chooseSlot(slot)} disabled={!isAvailable} aria-pressed={isSelected}><span className="parking-car" aria-hidden="true">🚗</span><span className="parking-space-number">{slot.slotNumber}</span><span className="parking-rate">{isAvailable ? `₹${slot.price}/hr` : slot.status}</span><span className="parking-status">{isAvailable ? (isSelected ? 'Selected' : 'Available') : slot.status}</span></button>; })}</section>{selected && <form className="form-card booking-form" onSubmit={preparePayment}><div className="booking-form-heading"><div><p className="eyebrow">Selected space</p><h2>Booking details for {selected.slotNumber}</h2></div><div className="booking-rate"><span>Hourly rate</span><strong>₹{selected.price}/hr</strong></div></div><div className="form-grid"><label>Parking Slot<input value={`${selected.slotNumber} — ${selected.location}`} disabled /></label><label>Vehicle Number<input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} placeholder="GJ05AB1234" required /></label><label>Booking Date<input type="date" min={today} value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} required /></label><label>Start Time<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></label><label>End Time<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></label></div>{duration > 0 && <div className="booking-estimate"><span>Estimated charge for {duration} hour{duration !== 1 ? 's' : ''}</span><strong>₹{estimatedCost.toFixed(2)}</strong></div>}{paymentOpen ? <section className="dummy-payment"><div><p className="eyebrow">Dummy payment</p><h3>Confirm your payment</h3><p>This is a demonstration only. No real payment is processed.</p></div><strong>₹{estimatedCost.toFixed(2)}</strong><div className="payment-actions"><button type="button" className="button" onClick={completeDummyPayment} disabled={saving}>{saving ? 'Processing payment...' : `Pay ₹${estimatedCost.toFixed(2)}`}</button><button type="button" className="button button-outline" onClick={() => setPaymentOpen(false)} disabled={saving}>Back</button></div></section> : <button className="button">Proceed to Payment</button>}</form>}</>}</main>;
};

export default BookSlot;
