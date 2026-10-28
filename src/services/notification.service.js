class NotificationService {
  constructor() {
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
    console.log('[NotificationService] Socket.io attached.');
  }

  notifyJobProgress(job) {
    if (this.io) {
      this.io.emit('bulk-job-progress', {
        jobId: job.id,
        status: job.status,
        totalCount: job.totalCount,
        processedCount: job.processedCount,
        failedCount: job.failedCount,
        percent: job.totalCount > 0 ? Math.round((job.processedCount / job.totalCount) * 100) : 0,
        updatedAt: job.updatedAt
      });
    }
  }

  notifyAppointmentsUpdated(sourceUserId, targetUserIds = []) {
    if (this.io) {
      this.io.emit('appointments-refresh', {
        sourceUserId,
        targetUserIds,
        timestamp: new Date().toISOString()
      });
    }
  }

  notifyUser(userId, message) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('user-notification', {
        message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
