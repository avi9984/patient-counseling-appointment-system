const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulkReassign.controller');

// Preview endpoint
router.post('/preview', bulkController.previewReassignment);

// Execute Bulk Reassign
router.post('/reassign', bulkController.executeBulkReassign);

// Check Job status
router.get('/jobs/:jobId', bulkController.getJobStatus);

// List recent jobs
router.get('/jobs', bulkController.listRecentJobs);

// Rollback / Undo
router.post('/jobs/:jobId/undo', bulkController.undoJob);

module.exports = router;
