import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Message from '../components/Message';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters long.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 800);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><p className="eyebrow">Create account</p><h1>Register for ParkEase</h1><Message>{error}</Message><Message type="success">{success}</Message><label>Name<input name="name" value={form.name} onChange={change} required /></label><label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label><label>Phone<input name="phone" value={form.phone} onChange={change} placeholder="9876543210" required /></label><label>Password<input name="password" type="password" value={form.password} onChange={change} minLength="6" required /></label><label>Confirm Password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={change} minLength="6" required /></label><button className="button" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button><p className="muted">Already registered? <Link to="/login">Login</Link></p></form></main>;
};

export default Register;
