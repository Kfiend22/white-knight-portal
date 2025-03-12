# White Knight Portal

<p align="center">
  <!-- You can add a logo image here if available -->
  <!-- <img src="public/images/logo.png" alt="White Knight Portal Logo" width="200"/> -->
</p>

## Overview

White Knight Portal is a comprehensive management system for roadside assistance and towing services. It provides a centralized platform for managing jobs, drivers, customers, and service providers. The portal enables efficient dispatch operations, real-time location tracking, and streamlined communication between all stakeholders in the roadside assistance workflow.

## Features

- **Job Management**
  - Create and track jobs with detailed information
  - Real-time status updates
  - Location tracking and mapping
  - Service categorization and classification
  - Scheduled and ASAP service options

- **User Management**
  - Role-based access control (Owner, Sub-Owner, Regional Manager, Service Provider)
  - Secondary roles (Admin, Dispatcher, Answering Service, Driver)
  - User activation/deactivation
  - Two-factor authentication

- **Customer Management**
  - Customer information tracking
  - Vehicle details management
  - Service history

- **Location Services**
  - Customer location request via SMS
  - Service and dropoff location tracking
  - Multiple location types support

- **Regional Management**
  - Geographic territory management
  - Region-based service provider assignment

- **Payment Processing**
  - Multiple payment types
  - Payment tracking and reporting

- **Performance Tracking**
  - Service metrics and analytics
  - Driver performance monitoring

## Technologies Used

### Frontend
- React.js
- Material UI
- React Router
- Axios for API requests
- Chart.js for data visualization
- Socket.io for real-time updates

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Environment Setup
1. Clone the repository
   ```
   git clone https://github.com/your-organization/white-knight-portal.git
   cd white-knight-portal
   ```

2. Create environment files
   - Create `.env` in the root directory
   - Create `backend/.env` for backend configuration

   Example `.env` content:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

   Example `backend/.env` content:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/white-knight-portal
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

### Installation Steps

1. Install frontend dependencies
   ```
   npm install
   ```

2. Install backend dependencies
   ```
   cd backend
   npm install
   cd ..
   ```

3. Start the development servers

   For Windows:
   ```
   start-app.bat
   ```

   For Unix/Linux/Mac:
   ```
   ./start-app.sh
   ```

   Or manually:
   ```
   # Start backend server
   cd backend
   npm start

   # In a new terminal, start frontend server
   npm start
   ```

## Usage

### Login
- Access the application at `http://localhost:3000`
- Login with your credentials
- First-time users may need to change their password

### Dashboard
- View and manage jobs
- Create new jobs
- Track job status
- Assign drivers and trucks

### User Management
- Create and manage users
- Assign roles and permissions
- Activate/deactivate users
- Manage two-factor authentication

### Job Creation
1. Click the "+" button on the Dashboard
2. Fill in required information:
   - Customer details
   - Vehicle information
   - Service location
   - Service type
   - Class type
3. Optionally add:
   - Dropoff location
   - Notes
   - Driver assignment
4. Submit the job

### Location Request
1. Enter customer phone number
2. Click "Request Location"
3. Customer receives SMS with location request
4. Upon approval, location is automatically updated in the job

## Project Structure

```
white-knight-portal/
├── backend/                 # Backend server code
│   ├── config/              # Configuration files
│   ├── controllers/         # API controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── server.js            # Main server file
├── public/                  # Static files
│   ├── csvs/                # CSV data files
│   └── images/              # Image assets
├── src/                     # Frontend React code
│   ├── components/          # Reusable components
│   ├── dashboard/           # Dashboard components
│   ├── pages/               # Page components
│   ├── settings/            # Settings components
│   ├── SideMenu/            # Side menu components
│   ├── App.js               # Main App component
│   └── index.js             # Entry point
└── package.json             # Project dependencies
```

## User Roles and Permissions

### Primary Roles

- **Owner (OW)**: Full access to all features and data
- **Sub-Owner (sOW)**: Access to most features, limited by region
- **Regional Manager (RM)**: Access to regional data and operations
- **Service Provider (SP)**: Access to service-related features

### Secondary Roles

- **Admin**: Administrative privileges within primary role scope
- **Dispatcher**: Job assignment and management
- **Answering Service**: Customer service and job creation
- **Driver**: Job execution and status updates

### Permission Matrix

| Feature               | OW  | sOW | RM  | SP  | Admin | Dispatcher | Answering Service | Driver |
|-----------------------|-----|-----|-----|-----|-------|------------|-------------------|--------|
| Dashboard             | ✓   | ✓   | ✓   | ✓   | ✓     | ✓          | ✓                 | ✓      |
| User Management       | ✓   | ✓   | ✓   | ✓*  | ✓     | ✗          | ✗                 | ✗      |
| Region Management     | ✓   | ✗   | ✗   | ✗   | ✓**   | ✗          | ✗                 | ✗      |
| Settings              | ✓   | ✓   | ✓   | ✓   | ✓     | ✗          | ✗                 | ✗      |
| Payments              | ✓   | ✓   | ✓   | ✓   | ✓     | ✗          | ✗                 | ✗      |
| Performance           | ✓   | ✓   | ✓   | ✓   | ✓     | ✓          | ✓                 | ✗      |
| Submissions           | ✓   | ✓   | ✓   | ✗   | ✓**   | ✗          | ✗                 | ✗      |

*SP can only manage users with the same vendor number and secondary roles
**Admin permissions depend on primary role

## API Documentation

### Authentication

- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `GET /api/auth/profile`: Get user profile

### Users

- `GET /api/v1/users`: Get all users
- `POST /api/v1/users`: Create a new user
- `GET /api/v1/users/:id`: Get user by ID
- `PUT /api/v1/users/:id`: Update user
- `DELETE /api/v1/users/:id`: Delete user

### Jobs

- `GET /api/jobs`: Get all jobs
- `POST /api/jobs`: Create a new job
- `GET /api/jobs/:id`: Get job by ID
- `PUT /api/jobs/:id`: Update job
- `DELETE /api/jobs/:id`: Delete job

### Regions

- `GET /api/regions`: Get all regions
- `POST /api/regions`: Create a new region
- `GET /api/regions/:id`: Get region by ID
- `PUT /api/regions/:id`: Update region
- `DELETE /api/regions/:id`: Delete region

### Location

- `POST /api/location/request`: Request customer location
- `GET /api/location/:requestId`: Get location request status

## Troubleshooting

For common issues and solutions, please refer to the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file.

## Development

### Running Tests

```
npm test
```

### Building for Production

```
npm run build
```

This creates a production-ready build in the `build` folder.

## License

[Specify your license here]

## Contact

For support or inquiries, please contact [your contact information].
