/**
 * Utility functions for authentication
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }
  
  try {
    // Get the payload part of the JWT (second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    
    // Check if expiration time is in the past
    return exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Verify token validity by making a lightweight API call
 * @returns {Promise<boolean>} - Promise resolving to true if token is valid, false otherwise
 */
export const verifyToken = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  // First check if token is expired based on its payload
  if (isTokenExpired(token)) {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
  
  try {
    // Make a lightweight API call to verify token on the server
    const response = await fetch('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

/**
 * Log out the user by clearing localStorage and redirecting to login
 */
export const logout = () => {
  // Clear authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};
