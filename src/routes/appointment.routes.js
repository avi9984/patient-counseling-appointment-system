const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');

router.get('/', appointmentController.listAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.patch('/:id', appointmentController.updateAppointment);
router.post('/:id/revenue-split', appointmentController.saveRevenueSplit);

module.exports = router;
