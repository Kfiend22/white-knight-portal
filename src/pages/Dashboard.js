import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PropTypes from 'prop-types';

// JobList component to render job details
const JobList = ({ jobs }) => (
  <List>
    {jobs.map((job) => (
      <Accordion key={job.id}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel${job.id}-content`}
          id={`panel${job.id}-header`}
        >
          <Typography>{job.title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{job.details}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </List>
);

JobList.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      details: PropTypes.string.isRequired,
    })
  ).isRequired,
};

// Main Dashboard component
const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const activeJobs = [
    { id: 1, title: 'Job #1', details: 'Details for Job #1' },
    { id: 2, title: 'Job #2', details: 'Details for Job #2' },
  ];

  const completedJobs = [
    { id: 3, title: 'Job #3', details: 'Details for Job #3' },
  ];

  const canceledJobs = [
    { id: 4, title: 'Job #4', details: 'Details for Job #4' },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Dashboard</Typography>
        <Fab color="primary" aria-label="add">
          <AddIcon />
        </Fab>
      </Box>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="job status tabs">
        <Tab label="Active Jobs" />
        <Tab label="Completed Jobs" />
        <Tab label="Canceled Jobs" />
      </Tabs>
      <Box mt={2}>
        {tabValue === 0 && <JobList jobs={activeJobs} />}
        {tabValue === 1 && <JobList jobs={completedJobs} />}
        {tabValue === 2 && <JobList jobs={canceledJobs} />}
      </Box>
    </Container>
  );
};

export default Dashboard;