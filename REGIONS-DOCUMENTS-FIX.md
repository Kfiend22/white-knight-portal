# Regions Page and Document Links Fix

This document explains the issues with the Regions page and document links in the Submissions page, and the fixes that have been implemented.

## Issues Identified

1. **Missing Sidebar on Regions Page**
   - The Regions page didn't include the SideMenu component
   - This made it inconsistent with other pages like Dashboard and Submissions

2. **Blank Page When Clicking Document Links**
   - Document links in the Submissions page were pointing to incorrect paths
   - The links didn't account for the backend server URL in development mode
   - There was no error handling for missing or inaccessible documents

## Changes Made

### 1. Added SideMenu to Regions Page

Updated the Regions page component in `src/pages/Regions.js`:
- Added import for the SideMenu component
- Added the SideMenu component to the page layout
- Wrapped the content in a fragment to maintain proper structure

Before:
```jsx
const Regions = () => {
  return (
    <Container maxWidth="lg">
      {/* content */}
    </Container>
  );
};
```

After:
```jsx
const Regions = () => {
  return (
    <>
      <SideMenu />
      <Container maxWidth="lg">
        {/* content */}
      </Container>
    </>
  );
};
```

### 2. Fixed Document Links in Submissions Page

Updated the DocumentViewer component in `src/components/Submissions/Apps.js`:
- Added a function to generate the correct document URL based on environment
- Added error handling for document loading failures
- Added logging to help diagnose issues with document links

Key improvements:
```jsx
// Function to create the full document URL
const getDocumentUrl = (path) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:5000';
  return `${baseUrl}/uploads/applications/${path}`;
};
```

- Added error state to show a helpful message when documents can't be loaded
- Added console logging to track document opening attempts

## Testing the Changes

To test these changes:

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. In a new terminal, start the frontend:
   ```
   npm start
   ```

3. Log in with your credentials

4. Navigate to the Regions page and verify that the sidebar is visible

5. Navigate to the Submissions page, expand an application, and click on document links

6. Verify that the documents open correctly in a new tab

## Troubleshooting

If you still encounter issues with document links:

1. Check the browser console for error messages
2. Verify that the backend server is running on port 5000
3. Make sure the document files exist in the correct location on the server
4. Check the network tab in browser dev tools to see the actual URL being requested
5. Verify that the server is correctly serving static files from the uploads directory

## Technical Details

### Document URL Structure

The document URLs are now constructed as:

- In production: `/uploads/applications/{filename}`
- In development: `http://localhost:5000/uploads/applications/{filename}`

This ensures that the browser can correctly locate the files in both environments.

### Error Handling

The document links now include error handling to show a helpful message when a document can't be loaded:

```jsx
{documentErrors.w9 ? (
  <Typography color="error">
    Error loading document. File may be missing or inaccessible.
  </Typography>
) : (
  <Link 
    href={getDocumentUrl(application.w9Path)}
    target="_blank"
    rel="noopener noreferrer"
    onError={() => handleDocumentError('w9')}
  >
    View Document
  </Link>
)}
