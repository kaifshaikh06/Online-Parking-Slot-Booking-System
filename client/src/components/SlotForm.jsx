import { useState } from 'react';
import Message from './Message';

const SlotForm = ({ initialValues, onSubmit, submitLabel, reservationLocked = false }) => {
  const slotNumbers = Array.from({ length: 20 }, (_, index) => `A-${String(index + 1).padStart(2, '0')}`);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changeValue = (event) => setValues({ ...values, [event.target.name]: event.target.value });
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!values.slotNumber.trim() || !values.location.trim() || !values.vehicleType.trim() || values.price === '') {
      setError('Please complete all fields.');
      return;
    }
    if (Number(values.price) < 0) {
      setError('Hourly rate cannot be negative.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  return <form className="form-card" onSubmit={handleSubmit}>
    <Message>{error}</Message>
    {reservationLocked && <p className="form-note">This space has a current or upcoming reservation. To correct a parking-space mistake, you may change only the slot number until the reservation ends.</p>}
    <div className="form-grid">
      <label>Slot Number<select name="slotNumber" value={values.slotNumber} onChange={changeValue} required><option value="">Select a slot</option>{slotNumbers.map((slotNumber) => <option key={slotNumber}>{slotNumber}</option>)}</select></label>
      <label>Location<input value="Level A" disabled /></label>
      <label>Vehicle Type<select name="vehicleType" value={values.vehicleType} onChange={changeValue} disabled={reservationLocked}><option>Sedan</option><option>SUV</option><option>Coupe</option><option>Muscle</option><option>Hatchback</option><option>Convertible</option></select></label>
      <label>Hourly Rate (₹)<input name="price" type="number" min="0" step="0.01" value={values.price} onChange={changeValue} placeholder="50" disabled={reservationLocked} required /></label>
      <label>Status<select name="status" value={values.status} onChange={changeValue} disabled={reservationLocked}><option>Available</option><option>Booked</option></select></label>
    </div>
    <button className="button" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
  </form>;
};

export default SlotForm;
