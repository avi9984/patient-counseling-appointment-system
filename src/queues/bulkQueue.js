const bulkService = require('../services/bulkReassignment.service');
const notificationService = require('../services/notification.service');
const db = require('../config/dbStore');

class BulkJobQueueWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.chunkSize = 50; // process 50 appointments per tick
  }

  enqueue(jobTask) {
    this.queue.push(jobTask);
    console.log(`[Queue] Task enqueued for Job ID: ${jobTask.jobId}. Total pending in queue: ${this.queue.length}`);
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const currentTask = this.queue.shift();
    const { jobId, payload, targetUsers, requestedBy } = currentTask;

    console.log(`[Worker] Starting execution for Job ID: ${jobId}`);

    try {
      // Find all target appointments
      const preview = await bulkService.getPreview(payload);
      const allAppointments = preview.sampleAppointments; // or full matched IDs
      
      // Let's get all matching appointment IDs
      const all = db.data.appointments;
      const matchedIds = all.filter(a => {
        const isAssigned = (a.assigneeId === payload.sourceUserId || a.coachId === payload.sourceUserId || a.pcOpsId === payload.sourceUserId);
        if (!isAssigned) return false;
        if (payload.filters?.statuses?.length > 0 && !payload.filters.statuses.includes(a.status)) return false;
        if (payload.filters?.excludeActiveCalls && a.callStatus === 'IN_PROGRESS') return false;
        if (payload.filters?.types?.length > 0 && !payload.filters.types.includes(a.type)) return false;
        if (payload.filters?.selectedAppointmentIds?.length > 0 && !payload.filters.selectedAppointmentIds.includes(a.id)) return false;
        return true;
      }).map(a => a.id);

      console.log(`[Worker] Processing ${matchedIds.length} appointments in chunks of ${this.chunkSize}...`);

      // Chunk processing loop
      for (let i = 0; i < matchedIds.length; i += this.chunkSize) {
        const chunk = matchedIds.slice(i, i + this.chunkSize);
        await bulkService.processBatchChunk(
          jobId,
          chunk,
          targetUsers,
          payload.fieldsToReassign || ['assignee', 'coach', 'pcOps'],
          payload.reason,
          requestedBy
        );

        // Small yield to simulate async non-blocking execution & allow UI smooth animation
        await new Promise(res => setTimeout(res, 200));
      }

      console.log(`[Worker] Successfully completed Job ID: ${jobId}`);
      notificationService.notifyAppointmentsUpdated(
        payload.sourceUserId,
        targetUsers.map(u => u.id)
      );
    } catch (err) {
      console.error(`[Worker] Error processing Job ID ${jobId}:`, err);
      db.updateBulkJob(jobId, {
        status: 'FAILED',
        errorLog: { message: err.message, stack: err.stack }
      });
      await db.persist();
      const failedJob = db.getBulkJobById(jobId);
      if (failedJob) {
        notificationService.notifyJobProgress(failedJob);
      }
    } finally {
      this.isProcessing = false;
      // Continue next job in queue if any
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }
}

const bulkQueueWorker = new BulkJobQueueWorker();
module.exports = bulkQueueWorker;
