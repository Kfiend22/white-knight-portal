// This temporary file contains the correct implementation of the schedule input handler
// to fix the issue with checkbox state not being preserved

/**
 * Corrected handleScheduleInputChange function for Apps.js
 * This function ensures that nested fields within the schedule object are handled correctly
 * 
 * The bug was caused by double-nesting the schedule path:
 * Original: The path was being constructed as services.schedule.schedule.fieldPath
 * Fixed: The path is now correctly constructed as services.fieldPath for non-open247 fields
 */
export const correctScheduleHandler = (applicationId, handleFieldEdit) => {
  return (fieldPath, value) => {
    // Determine the full path based on whether it's open247 or a nested schedule field
    // Don't add 'schedule.' twice in the path - this was the root cause of the bug
    const fullPath = fieldPath === 'open247' 
      ? `services.open247` 
      : `services.${fieldPath}`;
      
    // Use the main handleFieldEdit function to update state
    handleFieldEdit(applicationId, fullPath, value);
  };
};
