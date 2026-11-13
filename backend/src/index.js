const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/body-analysis', require('./routes/bodyAnalysis'));
app.use('/api/workout', require('./routes/workout'));
app.use('/api/nutrition', require('./routes/nutrition'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/coach', require('./routes/coach'));
app.use('/api/progress', require('./routes/progress'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve compiled static frontend build in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log('📦 Serving production frontend build from:', frontendDist);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// DB + Server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const startServer = async () => {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.warn('⚠️  MongoDB connection failed, running without DB:', err.message);
    }
  } else {
    console.warn('⚠️  MONGODB_URI not set. Running without database (in-memory only).');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitLife AI Backend running on http://localhost:${PORT}`);
  });
};

startServer();
