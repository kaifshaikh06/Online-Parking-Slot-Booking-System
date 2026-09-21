import { useState } from 'react';
import Message from './Message';

const SlotForm = ({ initialValues, onSubmit, submitLabel }) => {
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
      setError('Price cannot be negative.');
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
    <div className="form-grid">
      <label>Slot Number<input name="slotNumber" value={values.slotNumber} onChange={changeValue} placeholder="A-01" required /></label>
      <label>Location<input name="location" value={values.location} onChange={changeValue} placeholder="Ground Floor" required /></label>
      <label>Vehicle Type<select name="vehicleType" value={values.vehicleType} onChange={changeValue}><option>Car</option><option>Bike</option><option>SUV</option></select></label>
      <label>Price (₹)<input name="price" type="number" min="0" step="0.01" value={values.price} onChange={changeValue} required /></label>
      <label>Status<select name="status" value={values.status} onChange={changeValue}><option>Available</option><option>Booked</option></select></label>
    </div>
    <button className="button" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
  </form>;
};

export default SlotForm;
