import React, { useState } from 'react';
import { TextField, Button, Link, Typography, Container, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    const { username, password } = formData;
    const newErrors = {};
    if (!username) newErrors.username = 'Username is required.';
    if (!password) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axios.post('/api/auth/login', {
          email: formData.username,
          password: formData.password,
        });
        console.log('Login successful:', response.data);
        // Handle successful login: store token, redirect to last opened page or dashboard
      } catch (error) {
        setLoginError(error.response?.data?.message || 'Login failed. Please try again.');
        console.error('Login failed:', error.response?.data);
      }
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h4" align="center">
          White Knight Roadside Motor Club
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          Provider Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            margin="normal"
            variant="outlined"
            value={formData.username}
            onChange={handleChange}
            error={Boolean(errors.username)}
            helperText={errors.username}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            margin="normal"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
          />
          {loginError && (
            <Typography color="error" variant="body2">
              {loginError}
            </Typography>
          )}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            Login
          </Button>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Link href="/register" variant="body2">
              Register with Vendor ID
            </Link>
            <Link href="/reset-password" variant="body2">
              Forgot Password?
            </Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
