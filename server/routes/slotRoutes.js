const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { createSlot, getSlots, getSlot, updateSlot, deleteSlot, getAdminStats } = require('../controllers/slotController');

const router = express.Router();
router.use(authMiddleware);
router.get('/', getSlots);
router.get('/stats', adminMiddleware, getAdminStats);
router.get('/:id', getSlot);
router.post('/', adminMiddleware, createSlot);
router.put('/:id', adminMiddleware, updateSlot);
router.delete('/:id', adminMiddleware, deleteSlot);

module.exports = router;
