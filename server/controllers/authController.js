const jwt = require('jsonwebtoken');
const User = require('../models/User');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!name?.trim() || !cleanEmail || !phone?.trim() || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }
    if (!emailPattern.test(cleanEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone.trim())) return res.status(400).json({ message: 'Enter a valid phone number.' });

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await User.create({ name: name.trim(), email: cleanEmail, phone: phone.trim(), password, role: 'user' });
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
