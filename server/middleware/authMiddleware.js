const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Authentication token is required.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User account no longer exists.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
