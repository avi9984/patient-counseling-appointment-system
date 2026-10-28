const db = require('../config/dbStore');
const notificationService = require('./notification.service');

class AppointmentService {
  async getAppointments(queryParams) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const type = queryParams.type || 'All';
    const search = queryParams.search || '';
    const assigneeId = queryParams.assigneeId || '';
    const excludeReferral = queryParams.excludeReferral === 'true' || queryParams.excludeReferral === true;
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder || 'desc';

    const allFiltered = db.getAppointments({
      type,
      search,
      assigneeId,
      excludeReferral,
      sortBy,
      sortOrder
    });

    const total = allFiltered.length;
    const startIndex = (page - 1) * limit;
    const paginated = allFiltered.slice(startIndex, startIndex + limit);

    // Global counts
    const rawAll = db.data.appointments;
    const counts = {
      all: rawAll.length,
      consultation: rawAll.filter(a => a.type?.toLowerCase() === 'consultation').length,
      delivery: rawAll.filter(a => a.type?.toLowerCase() === 'delivery').length,
      cancelled: rawAll.filter(a => a.status === 'CANCELLED').length
    };

    return {
      appointments: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts
    };
  }

  async getAppointmentById(id) {
    const appt = db.getAppointmentById(id);
    if (!appt) throw new Error(`Appointment with ID ${id} not found.`);
    return appt;
  }

  async updateAppointment(id, updates, changedBy = 'user-sonu-singh') {
    const existing = db.getAppointmentById(id);
    if (!existing) throw new Error(`Appointment with ID ${id} not found.`);

    // Check if user is being modified
    if (updates.assigneeId && updates.assigneeId !== existing.assigneeId) {
      const user = db.getUserById(updates.assigneeId);
      if (user) {
        updates.assigneeName = user.name;
      }
    }
    if (updates.coachId && updates.coachId !== existing.coachId) {
      const coach = db.getUserById(updates.coachId);
      if (coach) {
        updates.coachName = coach.name;
      }
    }
    if (updates.pcOpsId && updates.pcOpsId !== existing.pcOpsId) {
      const ops = db.getUserById(updates.pcOpsId);
      if (ops) {
        updates.pcOpsName = ops.name;
      }
    }

    const updated = db.updateAppointment(id, updates);
    await db.persist();

    // Create single audit log
    db.createAuditLog({
      appointmentId: id,
      action: 'SINGLE_UPDATE',
      fieldsChanged: Object.keys(updates),
      oldValues: { assigneeId: existing.assigneeId, coachId: existing.coachId },
      newValues: updates,
      changedBy: changedBy,
      reason: 'Manual detail drawer update'
    });
    await db.persist();

    notificationService.notifyAppointmentsUpdated(existing.assigneeId, [updates.assigneeId]);
    return updated;
  }

  async saveRevenueSplit(id, splitData, changedBy = 'user-sonu-singh') {
    const existing = db.getAppointmentById(id);
    if (!existing) throw new Error(`Appointment with ID ${id} not found.`);

    const updates = {
      revenue: splitData.totalAmount || existing.revenue || 2999,
      revenueSplit: {
        totalAmount: splitData.totalAmount || existing.revenue || 2999,
        counselorSharePct: splitData.counselorSharePct,
        counselorShareAmt: splitData.counselorShareAmt,
        coachSharePct: splitData.coachSharePct,
        coachShareAmt: splitData.coachShareAmt,
        platformSharePct: splitData.platformSharePct,
        platformShareAmt: splitData.platformShareAmt,
        notes: splitData.notes || 'Revenue split configured',
        updatedAt: new Date().toISOString()
      }
    };

    const updated = db.updateAppointment(id, updates);
    await db.persist();

    // Audit log
    db.createAuditLog({
      appointmentId: id,
      action: 'REVENUE_SPLIT_ADDED',
      fieldsChanged: ['revenue', 'revenueSplit'],
      oldValues: { revenue: existing.revenue, revenueSplit: existing.revenueSplit },
      newValues: updates,
      changedBy: changedBy,
      reason: splitData.notes || 'Added revenue split'
    });
    await db.persist();

    notificationService.notifyAppointmentsUpdated(existing.assigneeId);
    return updated;
  }
}

module.exports = new AppointmentService();
