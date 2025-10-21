const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  subscription: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionExpires: {
    type: Date,
    default: null
  },
  subscriptionActive: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Informations Stripe
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  stripePaymentMethodId: {
    type: String,
    default: null
  },
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  // Liste des favoris (IDs des films)
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }]
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour générer un token de réinitialisation
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // 1 heure
  return this.resetPasswordToken;
};

// Méthode pour générer un token de vérification d'email
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  return this.emailVerificationToken;
};

// Méthode pour vérifier si l'abonnement est actif
userSchema.methods.isSubscriptionActive = function() {
  if (this.subscription === 'free') return true;
  if (!this.subscriptionExpires) return false;
  return this.subscriptionExpires > new Date();
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    subscription: this.subscription,
    subscriptionExpires: this.subscriptionExpires,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    isSubscriptionActive: this.isSubscriptionActive()
  };
};

module.exports = mongoose.model('User', userSchema);
