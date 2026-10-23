const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const appointmentRoutes = require('./routes/appointment.routes');
const bulkRoutes = require('./routes/bulk.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Task 1 & Task 2 API Routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);

// Route for Task 2 Doctor Admin
app.get('/doctors', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doctors.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ZenOnco Digital Products & Engineering Suite',
    tasks: {
      task1: 'Patient Counseling Bulk Reassignment System (/)',
      task2: 'Doctor Admin Portal Redesign (/doctors)'
    }
  });
});

// Fallback to index.html for root / other non-api paths
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
