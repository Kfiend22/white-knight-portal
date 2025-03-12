const Job = require('../models/Job');

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ provider: req.user.id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, provider: req.user.id });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      job.status = req.body.status || job.status;
      const updatedJob = await job.save();
      res.json(updatedJob);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, createJob, updateJobStatus };
