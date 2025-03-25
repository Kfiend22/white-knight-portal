const Job = require('../../models/Job');
const User = require('../../models/userModel');
const Region = require('../../models/Region');

// Helper function to check if a state is in a region
const isStateInRegion = async (state, regionIds) => {
  try {
    if (!state || !regionIds || regionIds.length === 0) {
      return false;
    }
    
    // Normalize the state (remove extra spaces, convert to lowercase)
    const normalizedState = state.trim().toLowerCase();
    
    // Find all regions that match the provided IDs
    const regions = await Region.find({ _id: { $in: regionIds } });
    
    // Check if any region contains the state
    return regions.some(region => {
      return region.states.some(regionState => {
        // Normalize the region state (remove extra spaces, convert to lowercase)
        const normalizedRegionState = regionState.state.trim().toLowerCase();
        return normalizedRegionState === normalizedState;
      });
    });
  } catch (error) {
    console.error('Error checking if state is in region:', error);
    return false;
  }
};

// Helper function to get state from a job's serviceLocation
const getJobState = (job) => {
  if (!job || !job.serviceLocation || !job.serviceLocation.state) {
    return null;
  }
  
  return job.serviceLocation.state;
};

// Helper function to update the visibleTo array for a job
const updateJobVisibility = async (job, driverId = null) => {
  try {
    // Initialize visibleTo array if it doesn't exist
    if (!job.visibleTo) {
      job.visibleTo = [];
    }
    
    // Clear the visibleTo array to start fresh
    job.visibleTo = [];
    
    // Add the job creator to visibleTo
    if (job.provider) {
      job.visibleTo.push(job.provider);
    }
    
    // Add the driver to visibleTo if provided
    if (driverId) {
      job.visibleTo.push(driverId);
    }
    
    // Get all users with primary roles OW, sOW, or SP
    const owners = await User.find({
      primaryRole: { $in: ['OW', 'sOW', 'SP'] },
      isActive: true
    });
    
    // Add all owners and SPs to visibleTo
    for (const owner of owners) {
      if (!job.visibleTo.includes(owner._id.toString())) {
        job.visibleTo.push(owner._id);
      }
    }
    
    // Get state from job location
    const jobState = getJobState(job);
    
    if (jobState) {
      // Find all regions that include this state
      const regions = await Region.find({
        'states.state': { $regex: new RegExp(`^${jobState}$`, 'i') }
      });
      
      // Get region IDs
      const regionIds = regions.map(region => region._id);
      
      // Find all RMs assigned to these regions
      const rms = await User.find({
        primaryRole: 'RM',
        regions: { $in: regionIds },
        isActive: true
      });
      
      // Add all RMs to visibleTo
      for (const rm of rms) {
        if (!job.visibleTo.includes(rm._id.toString())) {
          job.visibleTo.push(rm._id);
        }
      }
    }
    
    // Get the job creator's vendor ID
    const creator = await User.findById(job.provider);
    
    if (creator) {
      const creatorVendorId = creator.vendorId || creator.vendorNumber;
      
      // Find all dispatchers with the same vendor ID as the creator
      const dispatchers = await User.find({
        'secondaryRoles.dispatcher': true,
        $or: [
          { vendorId: creatorVendorId },
          { vendorNumber: creatorVendorId }
        ],
        isActive: true
      });
      
      // Add dispatchers with the same vendor ID as the creator to visibleTo
      for (const dispatcher of dispatchers) {
        if (!job.visibleTo.includes(dispatcher._id.toString())) {
          job.visibleTo.push(dispatcher._id);
        }
      }
      
      // Find all OW, sOW, and RM users
      const ownerUsers = await User.find({
        primaryRole: { $in: ['OW', 'sOW', 'RM'] },
        isActive: true
      });
      
      // Find dispatchers with the same vendor ID as any OW, sOW, or RM
      for (const owner of ownerUsers) {
        const ownerVendorId = owner.vendorId || owner.vendorNumber;
        
        if (ownerVendorId) {
          const matchingDispatchers = await User.find({
            'secondaryRoles.dispatcher': true,
            $or: [
              { vendorId: ownerVendorId },
              { vendorNumber: ownerVendorId }
            ],
            isActive: true
          });
          
          // Add these dispatchers to visibleTo
          for (const dispatcher of matchingDispatchers) {
            if (!job.visibleTo.includes(dispatcher._id.toString())) {
              job.visibleTo.push(dispatcher._id);
            }
          }
        }
      }
    }
    
    // Save the job with updated visibleTo array
    await job.save();
    
    console.log(`Job ${job._id} visibility updated with ${job.visibleTo.length} users`);
    return job;
  } catch (error) {
    console.error('Error updating job visibility:', error);
    return job;
  }
};

module.exports = {
  isStateInRegion,
  getJobState,
  updateJobVisibility
};
