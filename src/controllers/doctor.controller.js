const db = require('../config/dbStore');

class DoctorController {
  async listDoctors(req, res, next) {
    try {
      const search = req.query.search || '';
      const status = req.query.status || 'ALL';
      const city = req.query.city || 'ALL';

      const doctors = db.getDoctors({ search, status, city });
      const topReferrers = db.getTopReferrers();

      res.json({
        success: true,
        data: {
          doctors,
          topReferrers,
          stats: {
            totalDoctors: db.data.doctors.length,
            activeDoctors: db.data.doctors.filter(d => d.status === 'active').length,
            totalReferrals: db.data.doctors.reduce((sum, d) => sum + (d.patientsReferred || 0), 0),
            citiesCount: new Set(db.data.doctors.map(d => d.city)).size
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getDoctorById(req, res, next) {
    try {
      const doctor = db.getDoctorById(req.params.id);
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
      res.json({ success: true, data: doctor });
    } catch (err) {
      next(err);
    }
  }

  async updateDoctor(req, res, next) {
    try {
      const updated = db.updateDoctor(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Doctor not found' });
      await db.persist();
      res.json({ success: true, data: updated, message: 'Doctor details updated successfully!' });
    } catch (err) {
      next(err);
    }
  }

  async toggleDoctorStatus(req, res, next) {
    try {
      const doctor = db.getDoctorById(req.params.id);
      if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
      const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
      const updated = db.updateDoctor(req.params.id, { status: newStatus });
      await db.persist();
      res.json({ success: true, data: updated, message: `Doctor is now ${newStatus}` });
    } catch (err) {
      next(err);
    }
  }

  async createDoctor(req, res, next) {
    try {
      const created = db.createDoctor(req.body);
      await db.persist();
      res.status(201).json({ success: true, data: created, message: 'Doctor onboarded successfully!' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorController();
