const db = require('../config/dbStore');
const notificationService = require('./notification.service');
const { DISTRIBUTION_STRATEGY, JOB_STATUS } = require('../config/constants');

class BulkReassignmentService {
  /**
   * Preview eligible appointments before running reassignment
   */
  async getPreview(criteria) {
    const { sourceUserId, filters = {} } = criteria;
    const all = db.data.appointments;

    // Filter appointments matching source user as assignee or coach
    let eligible = all.filter(a => {
      const isAssigned = (a.assigneeId === sourceUserId || a.coachId === sourceUserId || a.pcOpsId === sourceUserId);
      if (!isAssigned) return false;

      // Status filter
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(a.status)) return false;
      }

      // Exclude active calls
      if (filters.excludeActiveCalls && a.callStatus === 'IN_PROGRESS') {
        return false;
      }

      // Type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(a.type)) return false;
      }

      // Specific IDs filter (if user selected checkboxes in UI)
      if (filters.selectedAppointmentIds && filters.selectedAppointmentIds.length > 0) {
        if (!filters.selectedAppointmentIds.includes(a.id)) return false;
      }

      return true;
    });

    const activeCallsCount = all.filter(a => 
      (a.assigneeId === sourceUserId || a.coachId === sourceUserId) && a.callStatus === 'IN_PROGRESS'
    ).length;

    return {
      totalEligible: eligible.length,
      activeCallsExcluded: activeCallsCount,
      sampleAppointments: eligible.slice(0, 15),
      breakdown: {
        byStatus: eligible.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {}),
        byType: eligible.reduce((acc, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  /**
   * Create Bulk Reassignment Job
   */
  async createReassignmentJob(payload, requestedBy = 'system') {
    const preview = await this.getPreview(payload);
    if (preview.totalEligible === 0) {
      throw new Error('No eligible appointments found matching the specified filters.');
    }

    const sourceUser = db.getUserById(payload.sourceUserId);
    if (!sourceUser) {
      throw new Error(`Source user not found with ID: ${payload.sourceUserId}`);
    }

    // Determine target users
    let targetUsers = [];
    if (payload.distributionStrategy === DISTRIBUTION_STRATEGY.DIRECT) {
      const target = db.getUserById(payload.targetUserId);
      if (!target) throw new Error(`Target user not found with ID: ${payload.targetUserId}`);
      targetUsers.push(target);
    } else {
      // Team / Department members
      targetUsers = db.getUsers().filter(u => 
        u.id !== payload.sourceUserId && 
        (payload.targetTeamIds ? payload.targetTeamIds.includes(u.id) : true)
      );
      if (targetUsers.length === 0) {
        throw new Error('No target team members available for distributed assignment.');
      }
    }

    // Create Job Record
    const job = db.createBulkJob({
      sourceUserId: payload.sourceUserId,
      sourceUserName: sourceUser.name,
      targetUserId: payload.targetUserId || null,
      targetUserName: payload.targetUserId ? db.getUserById(payload.targetUserId)?.name : 'Multiple (Team)',
      distributionStrategy: payload.distributionStrategy || DISTRIBUTION_STRATEGY.DIRECT,
      fieldsToReassign: payload.fieldsToReassign || ['assignee', 'coach', 'pcOps'],
      filterCriteria: payload.filters || {},
      reason: payload.reason || 'Department transfer / reassignment',
      totalCount: preview.totalEligible,
      createdBy: requestedBy
    });

    await db.persist();
    return { job, preview, targetUsers };
  }

  /**
   * Process a batch chunk of appointments
   */
  async processBatchChunk(jobId, appointmentIds, targetUsers, fieldsToReassign, reason, requestedBy) {
    // Acquire row locks to prevent race conditions
    const locksAcquired = db.tryLockRows(appointmentIds);
    if (!locksAcquired) {
      console.warn(`[BulkJob ${jobId}] Some appointments are currently locked. Retrying in next turn...`);
    }

    let processedCount = 0;
    let failedCount = 0;
    const auditEntries = [];

    try {
      await db.runInTransaction(async (dbStore) => {
        let userIndex = 0;

        for (const apptId of appointmentIds) {
          const appt = dbStore.getAppointmentById(apptId);
          if (!appt) {
            failedCount++;
            continue;
          }

          // Pick target user based on distribution
          const target = targetUsers[userIndex % targetUsers.length];
          userIndex++;

          const updates = {};
          const auditOldValues = {};

          if (fieldsToReassign.includes('assignee')) {
            auditOldValues.assigneeId = appt.assigneeId;
            updates.assigneeId = target.id;
            updates.assigneeName = target.name;
          }
          if (fieldsToReassign.includes('coach')) {
            auditOldValues.coachId = appt.coachId;
            updates.coachId = target.id;
            updates.coachName = target.name;
          }
          if (fieldsToReassign.includes('pcOps')) {
            auditOldValues.pcOpsId = appt.pcOpsId;
            updates.pcOpsId = target.id;
            updates.pcOpsName = target.name;
          }

          const updated = dbStore.updateAppointment(apptId, updates);
          if (updated) {
            processedCount++;
            // Create Audit Trail Entry
            const log = dbStore.createAuditLog({
              appointmentId: apptId,
              bulkJobId: jobId,
              action: 'BULK_REASSIGNMENT',
              fieldsChanged: Object.keys(updates),
              oldValues: auditOldValues,
              newValues: updates,
              changedBy: requestedBy,
              reason: reason
            });
            auditEntries.push(log);
          } else {
            failedCount++;
          }
        }

        // Update Job progress
        const job = dbStore.getBulkJobById(jobId);
        if (job) {
          const newProcessed = (job.processedCount || 0) + processedCount;
          const newFailed = (job.failedCount || 0) + failedCount;
          const isComplete = (newProcessed + newFailed) >= job.totalCount;

          dbStore.updateBulkJob(jobId, {
            processedCount: newProcessed,
            failedCount: newFailed,
            status: isComplete ? JOB_STATUS.COMPLETED : JOB_STATUS.PROCESSING,
            completedAt: isComplete ? new Date().toISOString() : null
          });
        }
      });

      // Notify clients
      const currentJob = db.getBulkJobById(jobId);
      if (currentJob) {
        notificationService.notifyJobProgress(currentJob);
      }

      return { processedCount, failedCount };
    } finally {
      // Release locks
      db.unlockRows(appointmentIds);
    }
  }

  /**
   * Rollback / Undo a previous bulk reassignment job
   */
  async rollbackJob(jobId, requestedBy) {
    const job = db.getBulkJobById(jobId);
    if (!job) throw new Error(`Bulk job not found with ID: ${jobId}`);
    if (job.status === JOB_STATUS.REVERTED) throw new Error('This job has already been reverted.');

    const auditLogs = db.getAuditLogsByJobId(jobId);
    if (auditLogs.length === 0) throw new Error('No audit logs found for this job.');

    let revertedCount = 0;

    await db.runInTransaction(async (dbStore) => {
      for (const log of auditLogs) {
        const appt = dbStore.getAppointmentById(log.appointmentId);
        if (!appt) continue;

        const rollbackUpdates = {};
        if (log.oldValues.assigneeId) {
          const oldAssignee = dbStore.getUserById(log.oldValues.assigneeId);
          rollbackUpdates.assigneeId = log.oldValues.assigneeId;
          rollbackUpdates.assigneeName = oldAssignee ? oldAssignee.name : 'Unknown';
        }
        if (log.oldValues.coachId) {
          const oldCoach = dbStore.getUserById(log.oldValues.coachId);
          rollbackUpdates.coachId = log.oldValues.coachId;
          rollbackUpdates.coachName = oldCoach ? oldCoach.name : 'Unknown';
        }
        if (log.oldValues.pcOpsId) {
          const oldOps = dbStore.getUserById(log.oldValues.pcOpsId);
          rollbackUpdates.pcOpsId = log.oldValues.pcOpsId;
          rollbackUpdates.pcOpsName = oldOps ? oldOps.name : 'Unknown';
        }

        dbStore.updateAppointment(log.appointmentId, rollbackUpdates);
        revertedCount++;
      }

      dbStore.updateBulkJob(jobId, {
        status: JOB_STATUS.REVERTED,
        revertedAt: new Date().toISOString(),
        revertedBy: requestedBy
      });
    });

    notificationService.notifyAppointmentsUpdated(job.sourceUserId);
    return { revertedCount, jobId };
  }
}

module.exports = new BulkReassignmentService();
