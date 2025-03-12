// File: backend/models/userModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Contact and address information
  phone: {
    type: String,
    default: '',
    required: true
  },
  address: {
    street1: {
      type: String,
      default: '',
      required: true
    },
    street2: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: '',
      required: true
    },
    state: {
      type: String,
      default: '',
      required: true
    },
    zip: {
      type: String,
      default: '',
      required: true
    },
    country: {
      type: String,
      default: 'US',
      required: true
    }
  },
  
  // Company information (for backward compatibility)
  companyName: {
    type: String,
    default: '',
    required: true
  },
  
  // Role system
  primaryRole: {
    type: String,
    enum: ['OW', 'sOW', 'RM', 'SP', 'N/A'],
    required: true
  },
  secondaryRoles: {
    admin: { 
      type: Boolean, 
      default: false 
    },
    dispatcher: { 
      type: Boolean, 
      default: false 
    },
    answeringService: { 
      type: Boolean, 
      default: false 
    },
    driver: { 
      type: Boolean, 
      default: false 
    }
  },
  
  // Vendor assignment
  vendorNumber: {
    type: String,
    required: true
  },
  
  // Region assignments (for RM)
  regions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  }],
  
  // Parent-child relationship
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status flags
  isActive: {
    type: Boolean,
    default: true
  },
  isOnDuty: {
    type: Boolean,
    default: false
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  
  // 2FA options
  twoFactorAuth: {
    enabled: { 
      type: Boolean, 
      default: false 
    },
    method: { 
      type: String, 
      enum: ['sms', 'email', 'app'], 
      default: 'app' 
    },
    secret: String,
    verified: { 
      type: Boolean, 
      default: false 
    }
  },
  
  // Legacy fields for backward compatibility
  vendorId: {
    type: String,
    required: true
    // No uniqueness constraint to allow multiple users to share the same vendor ID
  },
  ownerFirstName: String,
  ownerLastName: String,
  facilityCountry: String,
  facilityAddress1: String,
  facilityAddress2: String,
  facilityCity: String,
  facilityState: String,
  facilityZip: String,
  territories: {
    zipCodes: {
      type: [String],
      default: []
    }
  },
  role: String, // Legacy role field
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },
  permissions: {
    pages: {
      type: [String],
      default: []
    },
    actions: {
      type: [String],
      default: []
    }
  },
  
  // Audit information
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: Object
  }]
}, {
  timestamps: true
});

// Virtual for accessible pages based on roles
userSchema.virtual('accessiblePages').get(function() {
  const pages = new Set(['Dashboard']); // Everyone can access Dashboard
  
  // Add pages based on primary role
  if (this.primaryRole === 'OW' || this.primaryRole === 'sOW') {
    pages.add('Submissions');
    pages.add('Regions');
    pages.add('Settings');
    pages.add('Payments');
    pages.add('Users');
    pages.add('Performance');
  } else if (this.primaryRole === 'RM') {
    pages.add('Settings');
    pages.add('Payments');
    pages.add('Users');
    pages.add('Performance');
    // RMs can't access Regions
  } else if (this.primaryRole === 'SP') {
    pages.add('Settings');
    pages.add('Payments');
    pages.add('Users');
    pages.add('Performance');
    // SPs can't access Submissions and Regions
  }
  
  // Add pages based on secondary roles
  if (this.secondaryRoles.admin) {
    // Admin permissions depend on primary role
    if (this.primaryRole === 'SP') {
      // SP Admins can't access Submissions and Regions
    } else if (this.primaryRole === 'RM') {
      // RM Admins can't access Regions
    }
  }
  
  if (this.secondaryRoles.dispatcher || this.secondaryRoles.answeringService) {
    pages.add('Performance');
    // Dispatchers and Answering Service can't access Payments and Users
  }
  
  // Driver can only access Dashboard (already added)
  
  return Array.from(pages);
});

// Method to check if user can create a role
userSchema.methods.canCreateRole = function(primaryRole) {
  const roleHierarchy = {
    'OW': ['OW', 'sOW', 'RM', 'SP'],
    'sOW': ['RM', 'SP'],
    'RM': ['SP'],
    'SP': []
  };
  
  return roleHierarchy[this.primaryRole]?.includes(primaryRole) || false;
};

// Method to check if user can manage another user
userSchema.methods.canManageUser = function(user) {
  // OW can manage everyone except other OWs they didn't create
  if (this.primaryRole === 'OW') {
    if (user.primaryRole === 'OW' && user.createdBy && !user.createdBy.equals(this._id)) {
      return false;
    }
    return true;
  }
  
  // sOW can manage everyone under them except OW or other sOWs
  if (this.primaryRole === 'sOW') {
    if (user.primaryRole === 'OW' || 
        (user.primaryRole === 'sOW' && user.createdBy && !user.createdBy.equals(this._id))) {
      return false;
    }
    return true;
  }
  
  // RM can only manage users in their region(s) except OW or sOW
  if (this.primaryRole === 'RM') {
    if (user.primaryRole === 'OW' || user.primaryRole === 'sOW') {
      return false;
    }
    
    // Check if user is in RM's region
    const userRegions = user.regions ? user.regions.map(r => r.toString()) : [];
    const rmRegions = this.regions ? this.regions.map(r => r.toString()) : [];
    
    // If either user has no regions or RM has no regions, they can't manage
    if (userRegions.length === 0 || rmRegions.length === 0) {
      return false;
    }
    
    return userRegions.some(r => rmRegions.includes(r));
  }
  
  // SP can only manage its own vendor's users with secondary roles
  if (this.primaryRole === 'SP') {
    // Check if user has the same vendor number
    const sameVendor = (user.vendorNumber === this.vendorNumber) || 
                       (user.vendorId === this.vendorNumber) || 
                       (user.vendorNumber === this.vendorId);
    
    // Check if user has secondary roles
    const hasSecondaryRoles = user.secondaryRoles && 
                             Object.values(user.secondaryRoles).some(v => v === true);
    
    return sameVendor && user.primaryRole === 'SP' && hasSecondaryRoles;
  }
  
  return false;
};

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-assign region based on address state/province
userSchema.pre('save', async function(next) {
  // Skip if no address or if user is OW/sOW (they don't need region assignment)
  if (!this.address?.state || ['OW', 'sOW'].includes(this.primaryRole)) {
    return next();
  }
  
  try {
    // Find region that includes this state/province
    const Region = mongoose.model('Region');
    const region = await Region.findOne({
      'states.state': this.address.state,
      'states.country': this.address.country || 'US'
    });
    
    if (region && !this.regions.includes(region._id)) {
      this.regions.push(region._id);
    }
    
    next();
  } catch (error) {
    // If Region model isn't loaded yet or other error, just continue
    next();
  }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Add audit entry
userSchema.methods.addAuditLog = function(action, performedBy, details = {}) {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    details
  });
};

// Helper to get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Helper to check if user has a specific secondary role
userSchema.methods.hasSecondaryRole = function(role) {
  return this.secondaryRoles[role] === true;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
