# Profile Update Fix

## Problem

When trying to save changes from the Edit Profile dialog box, the application was encountering a 500 Internal Server Error. The error occurred even when no changes were made to the profile.

## Root Cause

After investigating the issue, I found three problems:

1. **Validation Errors**: The user model schema has several required fields that weren't being properly handled during the profile update process:
   - The `phone` field is required, but the EditProfileDialog.js was updating `phoneNumber` instead.
   - The `address` fields (street1, city, state, zip) are required, but weren't being updated.
   - The `companyName` field is required, but was only being updated for SP users.

2. **Content-Type Header Conflict**: When sending a `FormData` object (which is necessary for file uploads), the `Content-Type` header was being explicitly set to `application/json`. This conflicts with the browser's need to set the `Content-Type` to `multipart/form-data` with the appropriate boundary for `FormData` objects.

3. **Incorrect `mkdirp` Import**: The `mkdirp` package was being imported incorrectly in `userProfileController.js`. Since version 1.0.0, `mkdirp` uses named exports instead of a default export, causing a "mkdirp is not a function" error when trying to upload profile pictures.

## Solution

I made the following changes:

1. In `backend/controllers/userProfileController.js`:
   - Update both `phoneNumber` and the legacy `phone` field to maintain compatibility.
   - Remove the code that sets default values for the `address` object and `companyName` for all users.
   - Only initialize the `address` object for SP users when address-related fields are being updated.
   - Correct the `mkdirp` import to use the named export: `const { mkdirp } = require('mkdirp');`

2. In `src/SideMenu/EditProfileDialog.js`:
   - Modified the fetch call to not include the `Content-Type` header when sending a `FormData` object, allowing the browser to automatically set it to `multipart/form-data` with the appropriate boundary.

These changes ensure that:
- The Edit Profile dialog works correctly without unintentionally modifying unrelated fields
- Data consistency is maintained for SP users who might update their company address through other means
- The `FormData` object is properly sent to the server with the correct `Content-Type` header
- Profile picture uploads work correctly with the proper directory creation

## Testing

### Using the Web Interface

1. Log in to the application.
2. Click on your profile to open the Edit Profile dialog.
3. Make some changes or just click Save without making any changes.
4. The profile should now save successfully without any errors.

### Using the Test Script

I've created a test script that can be used to verify the fix:

```bash
# Install required dependencies
npm install axios form-data

# Run the test script
node test-profile-update.js
```

The script will:
1. Prompt you for your JWT token
2. Fetch your current profile
3. Attempt to update the profile with the same data
4. Display the response

If the fix is working correctly, you should see a successful response with your updated profile data.

### Using the Profile Update Test Page

You can also use the profile update test page at `/profile-update-test.html` to test the fix:

1. Open the page in your browser
2. Enter your JWT token (or it will be automatically loaded from localStorage)
3. Click "Fetch Current Profile" to load your profile data
4. Click "Update Profile" to test updating the profile
5. You should see a successful response

## Technical Details

### Changes in `backend/controllers/userProfileController.js`:

1. Corrected the `mkdirp` import:
   ```javascript
   // Before
   const mkdirp = require('mkdirp');
   
   // After
   const { mkdirp } = require('mkdirp');
   ```

2. When updating `phoneNumber`, also update the legacy `phone` field:
   ```javascript
   if (req.body.phoneNumber) {
     user.phoneNumber = req.body.phoneNumber;
     // Also update the legacy phone field to maintain compatibility
     user.phone = req.body.phoneNumber;
   }
   ```

3. Removed the code that sets default values for the `address` object for all users:
   ```javascript
   // Removed this code
   if (!user.address) {
     user.address = {
       street1: user.companyAddress || '',
       street2: user.companyAddress2 || '',
       city: user.city || '',
       state: user.state || '',
       zip: user.zip || '',
       country: 'US'
     };
   }
   ```

4. Removed the code that sets a default value for `companyName`:
   ```javascript
   // Removed this code
   if (!user.companyName) {
     user.companyName = user.firstName + ' ' + user.lastName;
   }
   ```

5. Added code to initialize the `address` object only for SP users when address-related fields are being updated:
   ```javascript
   // Update SP-specific fields if user is an SP
   if (user.primaryRole === 'SP') {
     if (req.body.companyName) user.companyName = req.body.companyName;
     if (req.body.position) user.position = req.body.position;
     
     // Ensure address object exists before updating its fields
     if (!user.address) {
       user.address = {
         street1: '',
         street2: '',
         city: '',
         state: '',
         zip: '',
         country: 'US'
       };
     }
     
     if (req.body.companyAddress) {
       user.companyAddress = req.body.companyAddress;
       user.address.street1 = req.body.companyAddress;
     }
     // Similar updates for other address fields
   }
   ```

### Changes in `src/SideMenu/EditProfileDialog.js`:

1. Modified the fetch call to not include the `Content-Type` header:
   ```javascript
   // Send the updated profile data to the backend
   fetch('/api/v1/users/profile', {
     method: 'PUT',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`,
       // Do not set Content-Type when sending FormData
       // The browser will automatically set it to 'multipart/form-data' with the appropriate boundary
     },
     body: formData,
   })
   ```

This change ensures that the browser can automatically set the correct `Content-Type` header with the appropriate boundary for the `FormData` object, which is necessary for file uploads to work correctly.
