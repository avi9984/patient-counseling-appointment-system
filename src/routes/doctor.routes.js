const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');

router.get('/', doctorController.listDoctors);
router.get('/:id', doctorController.getDoctorById);
router.patch('/:id', doctorController.updateDoctor);
router.patch('/:id/toggle-status', doctorController.toggleDoctorStatus);
router.post('/', doctorController.createDoctor);

module.exports = router;
