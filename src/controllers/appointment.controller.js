const appointmentService = require('../services/appointment.service');

class AppointmentController {
  async listAppointments(req, res, next) {
    try {
      const data = await appointmentService.getAppointments(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAppointmentById(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      res.json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }

  async updateAppointment(req, res, next) {
    try {
      const updated = await appointmentService.updateAppointment(
        req.params.id,
        req.body,
        req.headers['x-user-id'] || 'user-sonu-singh'
      );
      res.json({ success: true, data: updated, message: 'Appointment updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async saveRevenueSplit(req, res, next) {
    try {
      const updated = await appointmentService.saveRevenueSplit(
        req.params.id,
        req.body,
        req.headers['x-user-id'] || 'user-sonu-singh'
      );
      res.json({ success: true, data: updated, message: 'Revenue split saved successfully!' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AppointmentController();
