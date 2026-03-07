const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ✅ PERSONAL INFO
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@(univ|esi|usthb|enp|ensta|ens|emi|ensj|enp)\.(dz|com|net)$/i, 
           'Please enter a valid Algerian university email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^(05|06|07)[0-9]{8}$/, 'Please enter a valid Algerian phone number (05/06/07)']
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // ✅ ROLES & ACADEMIC INFO
  userType: {
    type: String,
    enum: ['student', 'professor', 'admin'],
    required: true,
    default: 'student'
  },
  currentRole: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  
  university: {
    type: String,
    required: true,
    enum: ['USTHB', 'University of Algiers', 'ESI', 'ENP', 'ENST', 'ENSA', 'Other'],
    default: 'University of Algiers'
  },
  faculty: {
    type: String,
    required: true
  },
  
  // Student-specific
  academicYear: {
    type: String,
    required: function() {
      return this.userType === 'student';
    },
    enum: ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorate']
  },
  fieldOfStudy: {
    type: String,
    required: function() {
      return this.userType === 'student';
    }
  },
  
  // Professor-specific
  department: {
    type: String,
    required: function() {
      return this.userType === 'professor';
    }
  },
  position: {
    type: String,
    enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer'],
    required: function() {
      return this.userType === 'professor';
    }
  },
  
  // ✅ PROFILE & VERIFICATION
  avatar: {
    type: String,
    default: '/default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  points: {
    type: Number,
    default: 100
  },
  
  // ✅ ACTIVITY STATS
  sellerStats: {
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    positiveReviews: { type: Number, default: 0 }
  },
  
  buyerStats: {
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    successfulTransactions: { type: Number, default: 0 },
    avgRatingGiven: { type: Number, default: 0 }
  },
  
  // ✅ PREFERENCES (NEW ADDITION)
  preferences: {
    savedSearches: [{
      query: String,
      filters: Object,
      createdAt: { type: Date, default: Date.now }
    }],
    notificationPreferences: {
      messages: { type: Boolean, default: true },
      sales: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newListings: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showLastSeen: { type: Boolean, default: true }
    },
    display: {
      darkMode: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
      currency: { type: String, default: 'DA' }
    }
  },
  
  // ✅ REFERENCES
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  }],
  
  listings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  }],
  
  purchases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  }],
  
  sales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  }],
  
  // ✅ NOTIFICATIONS
  notifications: [{
    title: String,
    message: String,
    type: {
      type: String,
      enum: ['message', 'listing_sold', 'price_drop', 'new_match', 'review', 'system']
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    link: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // ✅ VERIFICATION & SECURITY
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // ✅ TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  // ✅ VIRTUAL FIELDS CONFIG
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ VIRTUAL FIELDS
UserSchema.virtual('fullRole').get(function() {
  if (this.userType === 'admin') return 'admin';
  return `${this.userType}_${this.currentRole}`;
});

UserSchema.virtual('displayName').get(function() {
  if (this.userType === 'professor') {
    return `Prof. ${this.fullName}`;
  }
  return this.fullName;
});

UserSchema.virtual('isTrustedSeller').get(function() {
  return this.sellerStats.totalSales >= 10 && 
         this.sellerStats.positiveReviews >= 5 &&
         this.rating >= 4.0;
});

UserSchema.virtual('isActiveBuyer').get(function() {
  return this.buyerStats.totalPurchases >= 3;
});

// ✅ MIDDLEWARE
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ INSTANCE METHODS
UserSchema.methods.canSwitchToSeller = function() {
  return this.isEmailVerified && this.isPhoneVerified;
};

UserSchema.methods.addNotification = function(notification) {
  this.notifications.unshift(notification);
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50);
  }
  return this.save();
};

UserSchema.methods.switchRole = function(newRole) {
  if (!['buyer', 'seller'].includes(newRole)) {
    throw new Error('Invalid role');
  }
  
  this.currentRole = newRole;
  this.lastActivity = Date.now();
  
  return this.save();
};

// ✅ PREFERENCES METHODS (NEW)
UserSchema.methods.saveSearch = function(query, filters = {}) {
  // Remove duplicates
  this.preferences.savedSearches = this.preferences.savedSearches.filter(
    search => search.query !== query || JSON.stringify(search.filters) !== JSON.stringify(filters)
  );
  
  // Add new search (max 10 saved searches)
  this.preferences.savedSearches.unshift({ query, filters });
  if (this.preferences.savedSearches.length > 10) {
    this.preferences.savedSearches = this.preferences.savedSearches.slice(0, 10);
  }
  
  return this.save();
};

UserSchema.methods.updateNotificationPrefs = function(preferences) {
  this.preferences.notificationPreferences = {
    ...this.preferences.notificationPreferences,
    ...preferences
  };
  return this.save();
};

UserSchema.methods.updatePrivacySettings = function(settings) {
  this.preferences.privacy = {
    ...this.preferences.privacy,
    ...settings
  };
  return this.save();
};

UserSchema.methods.toggleDarkMode = function() {
  this.preferences.display.darkMode = !this.preferences.display.darkMode;
  return this.save();
};

// ✅ STATIC METHODS
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByRegistration = function(regNumber) {
  return this.findOne({ registrationNumber: regNumber.toUpperCase() });
};

UserSchema.statics.getTopSellers = function(limit = 10) {
  return this.find({ 
    'sellerStats.totalSales': { $gt: 0 },
    'currentRole': 'seller'
  })
  .sort({ 'sellerStats.totalSales': -1, 'rating': -1 })
  .limit(limit);
};

module.exports = mongoose.model('User', UserSchema);