const db = require('../config/dbStore');

class UserController {
  async listUsers(req, res, next) {
    try {
      const users = db.getUsers().map(user => {
        const activeCount = db.data.appointments.filter(a => 
          (a.assigneeId === user.id || a.coachId === user.id) &&
          a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
        ).length;
        return {
          ...user,
          currentActiveLoad: activeCount
        };
      });

      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async getUserWorkload(req, res, next) {
    try {
      const user = db.getUserById(req.params.id);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      const appointments = db.data.appointments.filter(a => a.assigneeId === user.id || a.coachId === user.id);
      const activeCalls = appointments.filter(a => a.callStatus === 'IN_PROGRESS');

      res.json({
        success: true,
        data: {
          user,
          totalAppointments: appointments.length,
          activeCalls: activeCalls.length,
          breakdown: {
            consultations: appointments.filter(a => a.type === 'Consultation').length,
            deliveries: appointments.filter(a => a.type === 'Delivery').length,
            supplements: appointments.filter(a => a.type === 'Supplements').length
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
