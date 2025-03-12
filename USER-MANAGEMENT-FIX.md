# User Management UI Fix

This document describes the changes made to fix issues with the Users tab in the Settings page.

## Issues Fixed

1. **Checkbox State Issues**:
   - User privileges (secondary roles) that were set to true in the database were not showing as checked in the UI
   - This was due to inconsistent data mapping between the backend and frontend

2. **Missing Address and Phone Data**:
   - In the edit menu, address and phone fields were not being populated with data from the database
   - The backend was sending incomplete data to the frontend

3. **Data Structure Mismatch**:
   - The `settingsController.js` was using an older data structure that didn't match the current user model
   - It was mapping fields like `ownerFirstName` instead of using the current `firstName` field

## Changes Made

### Backend Changes

1. **Updated `getSettings` in `settingsController.js`**:
   - Now includes address and phone data in the response
   - Properly maps both new and legacy field names
   - Includes all secondary roles in the response
   - Adds proper fallbacks for missing data

2. **Updated `updateSettings` in `settingsController.js`**:
   - Now properly handles address information
   - Updates both new and legacy fields for backward compatibility
   - Properly handles secondary roles
   - Adds audit log entries for tracking changes

3. **Updated `createUser` in `settingsController.js`**:
   - Now creates users with proper address information
   - Sets both new and legacy fields for backward compatibility
   - Properly handles secondary roles
   - Returns complete user data in the response

### Frontend Changes

The frontend was already properly set up to handle the data, but it wasn't receiving all the necessary information from the backend. With the backend changes, the frontend now:

1. Correctly displays checked checkboxes for user privileges
2. Properly populates address and phone fields in the edit dialog
3. Maintains consistency between the user list and edit dialog

## Testing

To verify the fix:

1. Go to the Settings page and select the Users tab
2. Check that user privileges (Admin, Dispatcher, Driver, Answering Service) are correctly checked based on the user's roles
3. Click the edit button for a user and verify that:
   - Address fields (Street 1, Street 2, City, State, ZIP, Country) are populated with the user's address data
   - Phone number is correctly displayed
   - Secondary roles are correctly checked
4. Make changes to a user and save them
5. Verify that the changes are reflected in the user list

## Technical Details

The fix maintains backward compatibility with both the new and legacy data structures:

- For new fields: `firstName`, `lastName`, `address.street1`, etc.
- For legacy fields: `ownerFirstName`, `ownerLastName`, `facilityAddress1`, etc.

This ensures that the application works correctly regardless of which data structure is used in the database.
