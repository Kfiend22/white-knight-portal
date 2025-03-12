const express = require('express');
const { getJobs, createJob, updateJobStatus } = require('../controllers/jobController');
const router = express.Router();

router.get('/', getJobs);
router.post('/', createJob);
router.put('/:id', updateJobStatus);

module.exports = router;
