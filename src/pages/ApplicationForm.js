// ApplicationForm.js
import React, { useState } from 'react';
import { Container, Grid, Box } from '@mui/material';
import Header from '../components/Header/Header';
import HeroSection from '../components/Header/herosection';
import ApplicationFormComponent from '../components/ApplicationForm/appformcomp';

const ApplicationFormPage = () => {
  const [formData, setFormData] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // If your form includes file uploads
      const submissionData = new FormData();
      // Append all form fields to submissionData
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: submissionData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to submit application');
    }
  };

  return (
    <Container maxWidth={false}>
      {/* Header with Logo */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {/* Left Column - Text Content */}
        <Grid item xs={12} md={6}>
          <Box>
            <h2>Welcome to Our Application</h2>
            <p>
              Thank you for your interest in joining our network. Please fill out the application form on the right to get started.
            </p>
            {/* Add more text content as needed */}
          </Box>
        </Grid>

        {/* Right Column - Application Form */}
        <Grid item xs={12} md={6}>
          <ApplicationFormComponent
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
          />
        </Grid>
      </Grid>

      {/* Success and Error Messages */}
      {showSuccessMessage && <p>Application submitted successfully!</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </Container>
  );
};

export default ApplicationFormPage;
