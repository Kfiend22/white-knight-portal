// JobHistory.js
import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { format } from 'date-fns';

const JobHistory = ({ job }) => {
  if (!job) return null;

  // Use statusHistory if available, or derive from job timestamps
  const historyEntries = job.statusHistory || [];

  // Fallback for jobs without proper statusHistory - derive from timestamps
  if (historyEntries.length === 0) {
    // Always add creation entry
    if (job.createdAt) {
      historyEntries.push({
        status: 'Created',
        timestamp: job.createdAt,
        updatedBy: 'System',
        notes: 'Job created'
      });
    }

    // Add entry for assignment if present
    if (job.assignedAt) {
      historyEntries.push({
        status: 'Assigned',
        timestamp: job.assignedAt,
        updatedBy: 'Dispatcher',
        notes: `Assigned to ${job.driver || 'driver'}`
      });
    }

    // Add entry for acceptance if present
    if (job.acceptedAt) {
      historyEntries.push({
        status: 'Accepted',
        timestamp: job.acceptedAt,
        updatedBy: job.driver || 'Driver',
        notes: 'Job accepted'
      });
    }

    // Add entry for dispatch if present
    if (job.dispatchedAt) {
      historyEntries.push({
        status: 'Dispatched',
        timestamp: job.dispatchedAt,
        updatedBy: 'System',
        notes: 'Driver dispatched'
      });
    }

    // Add entry for en route if present
    if (job.enRouteAt) {
      historyEntries.push({
        status: 'En Route',
        timestamp: job.enRouteAt,
        updatedBy: job.driver || 'Driver',
        notes: 'Driver en route to location'
      });
    }

    // Add entry for on site if present
    if (job.onSiteAt) {
      historyEntries.push({
        status: 'On Site',
        timestamp: job.onSiteAt,
        updatedBy: job.driver || 'Driver',
        notes: 'Driver arrived on site'
      });
    }

    // Add entry for completion if present
    if (job.completedAt) {
      historyEntries.push({
        status: 'Completed',
        timestamp: job.completedAt,
        updatedBy: job.driver || 'Driver',
        notes: 'Job completed'
      });
    }
  }

  // Sort history entries by timestamp (newest first)
  const sortedEntries = [...historyEntries].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
  });

  // Get dot color based on status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'created':
        return 'info.main';
      case 'pending':
        return 'info.main';
      case 'assigned':
      case 'pending acceptance':
        return 'warning.main';
      case 'accepted':
      case 'dispatched':
        return 'secondary.main';
      case 'en route':
        return 'primary.main';
      case 'on site':
        return 'primary.dark';
      case 'completed':
        return 'success.main';
      case 'canceled':
      case 'rejected':
        return 'error.main';
      default:
        return 'grey.500';
    }
  };

  return (
    <Box margin={2} sx={{ boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Job History
        </Typography>
        
        {sortedEntries.length === 0 ? (
          <Typography variant="body1">No history available for this job.</Typography>
        ) : (
          <Timeline position="alternate">
            {sortedEntries.map((entry, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="text.secondary">
                  {entry.timestamp ? (
                    format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')
                  ) : (
                    'Date unknown'
                  )}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: getStatusColor(entry.status) }} />
                  {index < sortedEntries.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {entry.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.notes || `Status changed to ${entry.status}`}
                  </Typography>
                  {entry.updatedBy && (
                    <Typography variant="caption" display="block">
                      By: {entry.updatedBy}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Paper>
    </Box>
  );
};

export default JobHistory;
