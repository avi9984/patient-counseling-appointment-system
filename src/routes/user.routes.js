const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/', userController.listUsers);
router.get('/:id/workload', userController.getUserWorkload);

module.exports = router;
