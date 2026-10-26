const bulkService = require('../services/bulkReassignment.service');
const bulkQueue = require('../queues/bulkQueue');
const db = require('../config/dbStore');

class BulkReassignController {
  async previewReassignment(req, res, next) {
    try {
      const preview = await bulkService.getPreview(req.body);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  async executeBulkReassign(req, res, next) {
    try {
      const requesterId = req.headers['x-user-id'] || 'user-sonu-singh';
      const { job, preview, targetUsers } = await bulkService.createReassignmentJob(req.body, requesterId);

      // Add to async queue worker
      bulkQueue.enqueue({
        jobId: job.id,
        payload: req.body,
        targetUsers,
        requestedBy: requesterId
      });

      res.status(202).json({
        success: true,
        message: `Bulk reassignment initiated for ${job.totalCount} appointments.`,
        data: {
          jobId: job.id,
          totalCount: job.totalCount,
          status: 'PENDING',
          strategy: job.distributionStrategy
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getJobStatus(req, res, next) {
    try {
      const job = db.getBulkJobById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      const logs = db.getAuditLogsByJobId(req.params.jobId);
      res.json({
        success: true,
        data: {
          ...job,
          percent: job.totalCount > 0 ? Math.round((job.processedCount / job.totalCount) * 100) : 0,
          sampleAuditLogs: logs.slice(0, 5)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async listRecentJobs(req, res, next) {
    try {
      const jobs = db.data.bulkJobs.slice(0, 20);
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  async undoJob(req, res, next) {
    try {
      const requesterId = req.headers['x-user-id'] || 'user-sonu-singh';
      const result = await bulkService.rollbackJob(req.params.jobId, requesterId);
      res.json({
        success: true,
        message: `Successfully reverted ${result.revertedCount} appointments.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BulkReassignController();
