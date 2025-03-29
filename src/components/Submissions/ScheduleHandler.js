// This file contains the fixed scheduler handler for the ScheduleInput component
import React from 'react';
import ScheduleInput from '../ScheduleInput';

/**
 * Generates the ScheduleInput component with fixed path handling
 * @param {Object} application - The application data
 * @param {Object} editingFields - The editing fields state
 * @param {string} applicationId - The application ID
 * @param {Function} handleFieldEdit - The field edit handler
 * @param {Function} deepMerge - The deep merge utility function
 * @returns {JSX.Element} - The ScheduleInput component with correct handlers
 */
export const generateScheduleInput = (application, editingFields, applicationId, handleFieldEdit, deepMerge) => {
  // Combine schedule data and open247 status correctly
  const mergedSchedule = deepMerge(application.services?.schedule ?? {}, editingFields[applicationId]?.services?.schedule ?? {});
  const currentOpen247 = editingFields[applicationId]?.services?.open247 ?? application.services?.open247 ?? false;
  
  const scheduleDataPropValue = {
    ...mergedSchedule, // Spread the nested schedule details
    open247: currentOpen247 // Add open247 at the top level of the prop
  };
  
  console.log(`Apps.js - Passing scheduleData for App ${applicationId}:`, JSON.stringify(scheduleDataPropValue, null, 2));

  // Define the onChange handler to correctly route paths
  const handleScheduleInputChange = (fieldPath, value) => {
    // Determine the full path based on whether it's open247 or a nested schedule field
    // Fix: Don't add 'schedule.' twice in the path - this was the root of the bug
    const fullPath = fieldPath === 'open247' 
      ? `services.open247` 
      : `services.${fieldPath}`;
    
    handleFieldEdit(applicationId, fullPath, value);
  };

  return (
    <ScheduleInput
      key={JSON.stringify(scheduleDataPropValue)}
      scheduleData={scheduleDataPropValue}
      onChange={handleScheduleInputChange}
    />
  );
};
