import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';
import StatusBadge from '../components/StatusBadge';

const ManageSlots = () => {
  const location = useLocation();
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.success || '');
  const loadSlots = () => api.get('/slots').then(({ data }) => setSlots(data.slots)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { loadSlots(); }, []);
  const remove = async (slot) => {
    if (!window.confirm(`Delete parking slot ${slot.slotNumber}? This cannot be undone.`)) return;
    setError(''); setSuccess('');
    try { const { data } = await api.delete(`/slots/${slot._id}`); setSuccess(data.message); loadSlots(); } catch (err) { setError(getErrorMessage(err)); }
  };
  return <main className="container page"><div className="page-heading"><div><p className="eyebrow">Admin area</p><h1>Manage Parking Slots</h1></div><Link className="button" to="/admin/slots/new">Add Slot</Link></div><Message>{error}</Message><Message type="success">{success}</Message>{!slots ? <Loading /> : slots.length === 0 ? <p className="empty-state">No parking slots found. Add your first slot.</p> : <div className="table-wrap"><table><thead><tr><th>Slot Number</th><th>Location</th><th>Vehicle Type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{slots.map((slot) => <tr key={slot._id}><td>{slot.slotNumber}</td><td>{slot.location}</td><td>{slot.vehicleType}</td><td>₹{slot.price}</td><td><StatusBadge status={slot.status} /></td><td className="actions"><Link className="button button-small button-outline" to={`/admin/slots/${slot._id}/edit`}>Edit</Link><button className="button button-small button-danger" onClick={() => remove(slot)}>Delete</button></td></tr>)}</tbody></table></div>}</main>;
};

export default ManageSlots;
