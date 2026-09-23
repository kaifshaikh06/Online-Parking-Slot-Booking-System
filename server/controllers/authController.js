const jwt = require('jsonwebtoken');
const User = require('../models/User');

const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const phonePattern = /^\d{10}$/;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt
});

const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    if (!cleanName || !cleanEmail || !cleanPhone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }
    if (!namePattern.test(cleanName)) return res.status(400).json({ message: 'Name must contain letters only.' });
    if (!emailPattern.test(cleanEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!phonePattern.test(cleanPhone)) return res.status(400).json({ message: 'Phone number must contain exactly 10 digits.' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name: cleanName, email: cleanEmail, phone: cleanPhone, password, role: 'user' });
    return res.status(201).json({ message: 'Registration successful. Please log in.', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'An account with this email already exists.' });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    return res.json({ message: 'Login successful.', token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, publicUser };
