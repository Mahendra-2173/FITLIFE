const express = require('express');
const router = express.Router();

// In-memory progress store
const progressEntries = [];
const waterLogs = [];

// GET /api/progress
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      progress: progressEntries,
      waterLogs,
    } 
  });
});

// POST /api/progress
router.post('/', (req, res) => {
  try {
    const { type, value, date, notes } = req.body;
    if (!type || value === undefined) {
      return res.status(400).json({ success: false, error: 'Type and value are required' });
    }

    const entry = {
      id: Date.now().toString(),
      type,
      value: parseFloat(value),
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    progressEntries.push(entry);
    
    // Keep last 365 days
    if (progressEntries.length > 365) progressEntries.shift();

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save progress' });
  }
});

// POST /api/progress/water
router.post('/water', (req, res) => {
  try {
    const { amount, date } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    
    const log = waterLogs.find(l => l.date === today);
    if (log) {
      log.total = parseFloat((log.total + (amount || 0.25)).toFixed(2));
      log.entries.push({ amount: amount || 0.25, time: new Date().toISOString() });
    } else {
      waterLogs.push({
        date: today,
        total: amount || 0.25,
        entries: [{ amount: amount || 0.25, time: new Date().toISOString() }],
      });
    }

    const todayLog = waterLogs.find(l => l.date === today);
    res.json({ success: true, data: todayLog });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to log water intake' });
  }
});

// GET /api/progress/water/today
router.get('/water/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const log = waterLogs.find(l => l.date === today);
  res.json({ success: true, data: log || { date: today, total: 0, entries: [] } });
});

module.exports = router;
