const User = require('../models/User');
const { publicUser } = require('./authController');

const getProfile = async (req, res) => res.json({ user: publicUser(req.user) });

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name?.trim() || !phone?.trim()) return res.status(400).json({ message: 'Name and phone are required.' });
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone.trim())) return res.status(400).json({ message: 'Enter a valid phone number.' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), phone: phone.trim() },
      { new: true, runValidators: true }
    );
    return res.json({ message: 'Profile updated successfully.', user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
