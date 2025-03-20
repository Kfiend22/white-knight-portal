import React, { useState } from 'react';
import EtaDialog from './EtaDialog';
import DispatchDialog from './DispatchDialog';
import RejectionDialog from './RejectionDialog';
import CancelDialog from './CancelDialog';
import GoaDialog from './GoaDialog';
import * as jobActionHandlers from '../../utils/jobActionHandlers';

/**
 * JobDialogManager handles all the job-related dialogs and their state
 */
const JobDialogManager = ({ 
  loading, 
  selectedJob, 
  setSelectedJob, 
  refreshJobs, 
  setLoading, 
  drivers, 
  trucks,
  vehicles,
  jobToReject,
  setJobToReject,
  jobToCancel,
  setJobToCancel,
  jobToMarkGOA,
  setJobToMarkGOA,
  etaDialogOpen,
  setEtaDialogOpen,
  dispatchDialogOpen,
  setDispatchDialogOpen,
  rejectDialogOpen,
  setRejectDialogOpen,
  cancelDialogOpen,
  setCancelDialogOpen,
  goaDialogOpen,
  setGoaDialogOpen
}) => {

  // Handle ETA dialog submit
  const handleEtaDialogSave = async (etaValue) => {
    await jobActionHandlers.handleEtaDialogSave(
      etaValue, 
      selectedJob, 
      setLoading, 
      refreshJobs,
      setEtaDialogOpen,
      setSelectedJob
    );
  };

  // Handle driver assignment
  const handleAssign = async (driver, truck) => {
    await jobActionHandlers.handleAssignDriverAndTruck(
      driver, 
      truck, 
      selectedJob, 
      setLoading, 
      refreshJobs,
      setDispatchDialogOpen,
      setSelectedJob
    );
  };

  // Handle job rejection
  const handleSubmitRejection = async (rejectionReason) => {
    await jobActionHandlers.handleSubmitRejection(
      jobToReject,
      rejectionReason,
      setLoading,
      refreshJobs,
      setRejectDialogOpen,
      setJobToReject
    );
  };

  // Handle job cancellation
  const handleCancelJob = async (cancellationReason) => {
    await jobActionHandlers.handleCancelJob(
      jobToCancel,
      cancellationReason,
      setLoading,
      refreshJobs,
      setCancelDialogOpen,
      setJobToCancel
    );
  };

  // Handle GOA request
  const handleGoaRequest = async (goaReason) => {
    await jobActionHandlers.handleGoaRequest(
      jobToMarkGOA,
      goaReason,
      setLoading,
      refreshJobs,
      setGoaDialogOpen,
      setJobToMarkGOA
    );
  };

  // Debug: Log props
  console.log('JobDialogManager vehicles prop:', vehicles);

  return (
    <>
      {/* ETA Dialog */}
      <EtaDialog 
        open={etaDialogOpen} 
        onClose={() => setEtaDialogOpen(false)} 
        onSave={handleEtaDialogSave}
        loading={loading}
      />
      
      {/* Dispatch Dialog */}
      <DispatchDialog 
        open={dispatchDialogOpen} 
        onClose={() => setDispatchDialogOpen(false)} 
        onAssign={handleAssign}
        loading={loading}
        drivers={drivers}
        trucks={trucks}
        vehicles={vehicles}
      />
      
      {/* Rejection Dialog */}
      <RejectionDialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)} 
        onSubmit={handleSubmitRejection}
        loading={loading}
      />
      
      {/* Cancellation Dialog */}
      <CancelDialog 
        open={cancelDialogOpen} 
        onClose={() => setCancelDialogOpen(false)} 
        onSubmit={handleCancelJob}
        loading={loading}
      />
      
      {/* GOA Dialog */}
      <GoaDialog 
        open={goaDialogOpen} 
        onClose={() => setGoaDialogOpen(false)} 
        onSubmit={handleGoaRequest}
        loading={loading}
      />
    </>
  );
};

// Export the component and dialog state hooks for use in Jobs component
export {
  JobDialogManager
};

// Export dialog opener functions
export const useJobDialogs = () => {
  const [etaDialogOpen, setEtaDialogOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [goaDialogOpen, setGoaDialogOpen] = useState(false);
  
  // State for selected job and related job-specific data
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobToReject, setJobToReject] = useState(null);
  const [jobToCancel, setJobToCancel] = useState(null);
  const [jobToMarkGOA, setJobToMarkGOA] = useState(null);
  
  return {
    etaDialogOpen, setEtaDialogOpen,
    dispatchDialogOpen, setDispatchDialogOpen,
    rejectDialogOpen, setRejectDialogOpen,
    cancelDialogOpen, setCancelDialogOpen,
    goaDialogOpen, setGoaDialogOpen,
    selectedJob, setSelectedJob,
    jobToReject, setJobToReject,
    jobToCancel, setJobToCancel,
    jobToMarkGOA, setJobToMarkGOA
  };
};
