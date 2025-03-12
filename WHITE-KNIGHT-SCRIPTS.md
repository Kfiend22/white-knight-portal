# White Knight Portal Startup/Shutdown Scripts

This document describes the batch files created to manage the White Knight Portal application.

## Prerequisites

- MongoDB must be installed and accessible in your PATH (`mongod` and `mongosh` commands)
- Node.js and npm must be installed and accessible in your PATH
- The application code must be properly set up with all dependencies installed

## Files Overview

- **start-white-knight.bat** - Starts all components of the application
- **stop-white-knight.bat** - Stops all components of the application
- **connect-db.js** - Helper script for MongoDB shell to connect to the database

## Available Scripts

### `start-white-knight.bat`

This script starts all components of the White Knight Portal application in the following order:

1. **MongoDB Server** - Starts `mongod` in a blue command window
2. **MongoDB Shell** - Starts `mongosh` in a light blue command window and connects to the white-knight-portal database
3. **Backend Server** - Starts the Node.js backend in a yellow command window
4. **Frontend Server** - Starts the React frontend in a green command window

Each component is started in its own window with a distinct color for easy identification. The script checks if MongoDB is already running before attempting to start it and includes appropriate waiting periods between starting components.

### `stop-white-knight.bat`

This script stops all components of the White Knight Portal application in the following order:

1. **Frontend Server** - Stops the React frontend
2. **Backend Server** - Stops the Node.js backend
3. **MongoDB Shell** - Closes the mongosh window
4. **MongoDB Server** - Stops the MongoDB server

The script also checks for any remaining Node.js processes and gives you the option to stop them if necessary.

## Usage

1. To start the entire application:
   - Double-click on `start-white-knight.bat` or run it from a command prompt
   - Wait for all components to start
   - The main script window can be closed after startup (all services will continue running)

2. To stop the entire application:
   - Double-click on `stop-white-knight.bat` or run it from a command prompt
   - Confirm that you want to proceed
   - Answer yes/no if asked about stopping remaining Node.js processes

## Troubleshooting

If you encounter issues with the scripts:

- Ensure MongoDB is installed and in your PATH
- Check that all required dependencies are installed (`npm install` in both root and backend directories)
- Make sure no other process is using port 27017 (MongoDB), 5000 (backend), or 3000 (frontend)
- Refer to TROUBLESHOOTING.md for application-specific issues

### Common Errors

#### "... was unexpected at this time."
This error typically occurs when there's a syntax issue in the batch file. If you see this error:
- Verify that `connect-db.js` exists in the project root directory
- Check that the batch file hasn't been modified with incorrect command syntax
- Make sure there are no special characters (like &, |, <, >) that aren't properly escaped

#### MongoDB Connection Issues
If MongoDB fails to start or connect:
- Check if MongoDB is already running using Task Manager
- Verify your MongoDB installation by running `mongod --version` in a command prompt
- Make sure MongoDB's data directory exists and is writable

#### Node.js Errors
If the frontend or backend fails to start:
- Check that all dependencies are installed by running `npm install` in both directories
- Look for error messages in the respective command windows
- Verify that required environment variables are set (if applicable)

If a component fails to start or stop, you may need to manually manage it:
- For MongoDB: Use `mongod` and `mongosh` commands directly
- For backend: Navigate to backend directory and run `npm start`
- For frontend: Run `npm start` in the root directory
