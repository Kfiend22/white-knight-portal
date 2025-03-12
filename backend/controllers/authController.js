const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @param {Boolean} rememberMe - Whether to extend token expiration
 * @returns {String} JWT token
 */
const generateToken = (user, rememberMe = false) => {
  // Get accessible pages from virtual property
  const accessiblePages = user.accessiblePages || [];
  
  // Get legacy permissions
  const legacyPermissions = user.permissions || { pages: [], actions: [] };
  
  return jwt.sign(
    { 
      user: {
        id: user._id,
        primaryRole: user.primaryRole || user.role, // Support both new and legacy schema
        secondaryRoles: user.secondaryRoles || {},
        vendorNumber: user.vendorNumber || user.vendorId, // Support both new and legacy schema
        regions: user.regions || (user.region ? [user.region] : []),
        accessiblePages: accessiblePages, // Include accessible pages from virtual property
        permissions: legacyPermissions // Include legacy permissions for backward compatibility
      }
    }, 
    process.env.JWT_SECRET || 'defaultsecret', 
    { 
      expiresIn: rememberMe ? '30d' : '24h' 
    }
  );
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object|null} Validation error or null if valid
 */
const validatePassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  
  if (password.length < 9) {
    return "Password must be at least 9 characters long";
  }
  
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }
  
  // Simple dictionary word check
  const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'secret'];
  const lowerPassword = password.toLowerCase();
  
  for (const word of commonWords) {
    if (lowerPassword.includes(word)) {
      return "Password should not contain common words";
    }
  }
  
  return null;
};

/**
 * Validate user data for registration and updates
 * @param {Object} userData - User data to validate
 * @returns {Object|null} Validation errors or null if valid
 */
const validateUserData = (userData) => {
  const errors = {};

  if (!userData.username || userData.username.length > 28) {
    errors.username = "Username is required and must be 28 characters or less";
  }

  if (userData.password) {
    const passwordError = validatePassword(userData.password);
    if (passwordError) {
      errors.password = passwordError;
    }
  } else {
    errors.password = "Password is required";
  }

  // Validate primary role
  if (userData.primaryRole && !['OW', 'sOW', 'RM', 'SP'].includes(userData.primaryRole)) {
    errors.primaryRole = "Invalid primary role";
  }
  
  // For backward compatibility
  if (userData.role && !['OW', 'sOW', 'RM', 'SP', 'MN', 'DV', 'DP'].includes(userData.role)) {
    errors.role = "Invalid role";
  }

  // Validate name fields
  if (!userData.firstName && !userData.ownerFirstName) {
    errors.firstName = "First name is required";
  } else if ((userData.firstName && userData.firstName.length > 28) || 
             (userData.ownerFirstName && userData.ownerFirstName.length > 28)) {
    errors.firstName = "First name must be 28 characters or less";
  }

  if (!userData.lastName && !userData.ownerLastName) {
    errors.lastName = "Last name is required";
  } else if ((userData.lastName && userData.lastName.length > 28) || 
             (userData.ownerLastName && userData.ownerLastName.length > 28)) {
    errors.lastName = "Last name must be 28 characters or less";
  }

  // Validate email
  if (!userData.email) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
    errors.email = "Email is invalid";
  }

  // Validate vendor number
  if (!userData.vendorNumber && !userData.vendorId) {
    errors.vendorNumber = "Vendor number is required";
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
  const userData = req.body;
  const validationErrors = validateUserData(userData);

  if (validationErrors) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Check if user with this email or username already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Handle legacy fields for backward compatibility
    if (!userData.primaryRole && userData.role) {
      userData.primaryRole = userData.role;
    }
    
    if (!userData.firstName && userData.ownerFirstName) {
      userData.firstName = userData.ownerFirstName;
    }
    
    if (!userData.lastName && userData.ownerLastName) {
      userData.lastName = userData.ownerLastName;
    }
    
    if (!userData.vendorNumber && userData.vendorId) {
      userData.vendorNumber = userData.vendorId;
    }
    
    // Set createdBy if authenticated user is making the request
    if (req.user && req.user.id) {
      userData.createdBy = req.user.id;
      
      // Add audit log entry
      userData.auditLog = [{
        action: 'create',
        performedBy: req.user.id,
        timestamp: new Date(),
        details: { method: 'register' }
      }];
    }

    // Proceed with user creation
    const user = await User.create(userData);
    
    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      primaryRole: user.primaryRole,
      secondaryRoles: user.secondaryRoles,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Update a user
 * @route PUT /api/auth/users/:id
 * @access Private/Owner, RegionalManager
 */
const updateUser = async (req, res) => {
  const userData = req.body;
  
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the current user with full details
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(401).json({ message: 'Current user not found' });
    }
    
    // Check if current user can manage target user
    if (!currentUser.canManageUser(user)) {
      return res.status(403).json({ 
        message: 'You do not have permission to update this user'
      });
    }

    // Don't allow changing primary role to a role the current user can't create
    if (userData.primaryRole && !currentUser.canCreateRole(userData.primaryRole)) {
      return res.status(403).json({ 
        message: `You cannot change a user to ${userData.primaryRole} role`
      });
    }

    // Handle legacy fields for backward compatibility
    if (!userData.primaryRole && userData.role) {
      userData.primaryRole = userData.role;
    }
    
    if (!userData.firstName && userData.ownerFirstName) {
      userData.firstName = userData.ownerFirstName;
    }
    
    if (!userData.lastName && userData.ownerLastName) {
      userData.lastName = userData.ownerLastName;
    }
    
    if (!userData.vendorNumber && userData.vendorId) {
      userData.vendorNumber = userData.vendorId;
    }
    
    // Add audit log entry
    if (!user.auditLog) {
      user.auditLog = [];
    }
    
    user.auditLog.push({
      action: 'update',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: { 
        changedFields: Object.keys(userData)
      }
    });
    
    // Merge audit log with userData
    userData.auditLog = user.auditLog;

    // Proceed with user update
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      userData, 
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({ message: 'Account is inactive. Please contact an administrator.' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if 2FA is enabled and verified
    if (user.twoFactorAuth && user.twoFactorAuth.enabled && user.twoFactorAuth.verified) {
      // Generate temporary token for 2FA verification
      const tempToken = jwt.sign(
        { 
          tempAuth: {
            id: user._id,
            requires2FA: true
          }
        }, 
        process.env.JWT_SECRET || 'defaultsecret', 
        { expiresIn: '5m' }
      );
      
      return res.json({
        requiresTwoFactor: true,
        twoFactorMethod: user.twoFactorAuth.method,
        tempToken
      });
    }
    
    // Generate token with remember me option
    const token = generateToken(user, rememberMe);
    
    // Prepare user data for response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      primaryRole: user.primaryRole || user.role,
      secondaryRoles: user.secondaryRoles || {},
      vendorNumber: user.vendorNumber || user.vendorId,
      fullName: user.fullName || `${user.firstName || user.ownerFirstName} ${user.lastName || user.ownerLastName}`
    };
    
    // Check if first login
    if (user.isFirstLogin) {
      return res.json({
        ...userData,
        token,
        isFirstLogin: true,
        message: 'Password change required',
        // Include user object for backward compatibility
        user: userData
      });
    }
    
    // Add login to audit log
    if (user.auditLog) {
      user.auditLog.push({
        action: 'login',
        timestamp: new Date(),
        details: { 
          rememberMe,
          ip: req.ip
        }
      });
      
      await user.save();
    }
    
    // Return user data and token
    res.json({
      ...userData,
      token,
      // Include user object for backward compatibility
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Get user from database
    const user = await User.findById(req.user._id);
    
    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    // Update password
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

/**
 * Create Owner account
 * @route POST /api/auth/create-owner
 * @access Public - but should be secured by other means
 */
const createOwnerAccount = async (req, res) => {
  try {
    // Check if an Owner account already exists
    const existingOwner = await User.findOne({ 
      $or: [
        { primaryRole: 'OW' },
        { role: 'OW' }
      ]
    });
    
    if (existingOwner) {
      return res.status(400).json({ message: 'Owner account already exists' });
    }
    
    // Generate random password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Create Owner user
    const ownerUser = new User({
      vendorNumber: 'OWNER' + Date.now().toString().slice(-8),
      companyName: 'White Knight Roadside Motor Club',
      firstName: 'System',
      lastName: 'Owner',
      address: {
        country: 'US',
        street1: '123 Main St',
        city: 'Anytown',
        state: 'TX',
        zip: '12345'
      },
      primaryRole: 'OW',
      secondaryRoles: {
        admin: true
      },
      username: 'owner',
      password: tempPassword,
      email: 'owner@whiteknightmotorclub.com',
      isFirstLogin: true,
      auditLog: [{
        action: 'create',
        timestamp: new Date(),
        details: { method: 'create-owner' }
      }],
      // Legacy fields for backward compatibility
      vendorId: 'OWNER' + Date.now().toString().slice(-8),
      ownerFirstName: 'System',
      ownerLastName: 'Owner',
      facilityCountry: 'US',
      facilityAddress1: '123 Main St',
      facilityCity: 'Anytown',
      facilityState: 'TX',
      facilityZip: '12345',
      territories: {
        zipCodes: ['12345']
      },
      role: 'OW'
    });
    
    await ownerUser.save();
    
    res.status(201).json({
      message: 'Owner account created successfully',
      credentials: {
        username: ownerUser.username,
        email: ownerUser.email,
        password: tempPassword
      }
    });
  } catch (error) {
    console.error('Create owner account error:', error);
    res.status(500).json({ message: 'Server error during owner account creation' });
  }
};

/**
 * Verify 2FA code
 * @route POST /api/auth/verify-2fa
 * @access Public (with temp token)
 */
const verify2FA = async (req, res) => {
  const { code, tempToken } = req.body;
  
  if (!code || !tempToken) {
    return res.status(400).json({ message: 'Code and temporary token are required' });
  }
  
  try {
    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'defaultsecret');
    
    if (!decoded.tempAuth || !decoded.tempAuth.requires2FA) {
      return res.status(401).json({ message: 'Invalid temporary token' });
    }
    
    // Get user
    const user = await User.findById(decoded.tempAuth.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify 2FA code based on method
    let isValid = false;
    
    if (user.twoFactorAuth.method === 'app') {
      // Verify TOTP code
      // This would use a library like speakeasy to verify the code
      // For now, we'll just check if it's '123456' for testing
      isValid = code === '123456';
    } else if (user.twoFactorAuth.method === 'email' || user.twoFactorAuth.method === 'sms') {
      // Check if code matches the one stored in user.twoFactorAuth.secret
      isValid = user.twoFactorAuth.secret === code;
    }
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }
    
    // Generate full token
    const token = generateToken(user, true); // Use remember me for 2FA users
    
    // Prepare user data for response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      primaryRole: user.primaryRole || user.role,
      secondaryRoles: user.secondaryRoles || {},
      vendorNumber: user.vendorNumber || user.vendorId,
      fullName: user.fullName || `${user.firstName || user.ownerFirstName} ${user.lastName || user.ownerLastName}`
    };
    
    // Add login to audit log
    if (user.auditLog) {
      user.auditLog.push({
        action: 'login-2fa',
        timestamp: new Date(),
        details: { 
          method: user.twoFactorAuth.method,
          ip: req.ip
        }
      });
      
      await user.save();
    }
    
    // Return user data and token
    res.json({
      ...userData,
      token,
      // Include user object for backward compatibility
      user: userData
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};

/**
 * Setup 2FA
 * @route POST /api/auth/setup-2fa
 * @access Private
 */
const setup2FA = async (req, res) => {
  const { method } = req.body;
  
  if (!method || !['sms', 'email', 'app'].includes(method)) {
    return res.status(400).json({ message: 'Valid 2FA method is required' });
  }
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Setup 2FA based on method
    if (method === 'app') {
      // Generate TOTP secret
      // This would use a library like speakeasy to generate a secret
      // For now, we'll just use a placeholder
      const secret = 'TOTP_SECRET_' + crypto.randomBytes(10).toString('hex');
      
      user.twoFactorAuth = {
        enabled: false, // Will be enabled after verification
        method: 'app',
        secret,
        verified: false
      };
      
      await user.save();
      
      res.json({
        message: '2FA setup initiated',
        method: 'app',
        secret,
        qrCode: `otpauth://totp/WhiteKnightPortal:${user.username}?secret=${secret}&issuer=WhiteKnightPortal`
      });
    } else if (method === 'email') {
      // Generate and send email code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      user.twoFactorAuth = {
        enabled: false,
        method: 'email',
        secret: code,
        verified: false
      };
      
      await user.save();
      
      // In a real implementation, send the code via email
      // For now, just return it in the response
      res.json({
        message: '2FA setup initiated',
        method: 'email',
        code // In production, don't return this
      });
    } else if (method === 'sms') {
      // Generate and send SMS code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      user.twoFactorAuth = {
        enabled: false,
        method: 'sms',
        secret: code,
        verified: false
      };
      
      await user.save();
      
      // In a real implementation, send the code via SMS
      // For now, just return it in the response
      res.json({
        message: '2FA setup initiated',
        method: 'sms',
        code // In production, don't return this
      });
    }
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error during 2FA setup' });
  }
};

/**
 * Verify and enable 2FA
 * @route POST /api/auth/verify-setup-2fa
 * @access Private
 */
const verifySetup2FA = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ message: 'Verification code is required' });
  }
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorAuth || !user.twoFactorAuth.method) {
      return res.status(400).json({ message: '2FA setup not initiated' });
    }
    
    // Verify code based on method
    let isValid = false;
    
    if (user.twoFactorAuth.method === 'app') {
      // Verify TOTP code
      // This would use a library like speakeasy to verify the code
      // For now, we'll just check if it's '123456' for testing
      isValid = code === '123456';
    } else if (user.twoFactorAuth.method === 'email' || user.twoFactorAuth.method === 'sms') {
      // Check if code matches the one stored in user.twoFactorAuth.secret
      isValid = user.twoFactorAuth.secret === code;
    }
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }
    
    // Enable 2FA
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.verified = true;
    
    // Add to audit log
    if (user.auditLog) {
      user.auditLog.push({
        action: '2fa-enabled',
        timestamp: new Date(),
        details: { 
          method: user.twoFactorAuth.method
        }
      });
    }
    
    await user.save();
    
    res.json({
      message: '2FA enabled successfully',
      method: user.twoFactorAuth.method
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};

/**
 * Disable 2FA
 * @route POST /api/auth/disable-2fa
 * @access Private
 */
const disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorAuth || !user.twoFactorAuth.enabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }
    
    // Disable 2FA
    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.verified = false;
    
    // Add to audit log
    if (user.auditLog) {
      user.auditLog.push({
        action: '2fa-disabled',
        timestamp: new Date(),
        details: { 
          method: user.twoFactorAuth.method
        }
      });
    }
    
    await user.save();
    
    res.json({
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Server error during 2FA disabling' });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  updateUser, 
  changePassword,
  createOwnerAccount,
  verify2FA,
  setup2FA,
  verifySetup2FA,
  disable2FA
};
