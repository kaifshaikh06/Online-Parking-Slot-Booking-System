import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Message from '../components/Message';

const Profile = () => {
  const { user, updateUser } = useAuth(); const [form, setForm] = useState(null); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { api.get('/users/profile').then(({ data }) => setForm(data.user)).catch((err) => setError(getErrorMessage(err))); }, []);
  const submit = async (event) => { event.preventDefault(); setError(''); setSuccess(''); setSaving(true); try { const { data } = await api.put('/users/profile', { name: form.name, phone: form.phone }); setForm(data.user); updateUser(data.user); setSuccess(data.message); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); } };
  return <main className="container page"><p className="eyebrow">Account settings</p><h1>My Profile</h1><Message>{error}</Message>{!form ? <Loading /> : <form className="form-card" onSubmit={submit}><Message type="success">{success}</Message><div className="form-grid"><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label>Email<input value={form.email} disabled /></label><label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label><label>Role<input value={form.role} disabled /></label></div><button className="button" disabled={saving}>{saving ? 'Saving...' : 'Update Profile'}</button></form>}</main>;
};

export default Profile;
