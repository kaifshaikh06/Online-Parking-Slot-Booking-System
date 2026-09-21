import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import Message from '../components/Message';
import SlotForm from '../components/SlotForm';

const EditSlot = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [slot, setSlot] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/slots/${id}`).then(({ data }) => setSlot(data.slot)).catch((err) => setError(getErrorMessage(err))); }, [id]);
  const save = async (values) => { try { await api.put(`/slots/${id}`, values); navigate('/admin/slots', { state: { success: 'Parking slot updated successfully.' } }); } catch (err) { throw getErrorMessage(err); } };
  return <main className="container page"><div className="page-heading"><div><p className="eyebrow">Admin area</p><h1>Edit Parking Slot</h1></div></div><Message>{error}</Message>{slot ? <SlotForm initialValues={{ slotNumber: slot.slotNumber, location: slot.location, vehicleType: slot.vehicleType, price: slot.price, status: slot.status }} onSubmit={save} submitLabel="Save Changes" /> : !error && <Loading />}</main>;
};

export default EditSlot;
