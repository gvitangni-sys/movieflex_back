const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['subscription_renewal', 'system', 'promotion'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour marquer comme lu
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Méthode statique pour créer une notification de renouvellement
notificationSchema.statics.createSubscriptionRenewalNotification = async function(userId, daysUntilRenewal) {
  const notification = new this({
    userId,
    type: 'subscription_renewal',
    title: 'Renouvellement d\'abonnement',
    message: `Votre abonnement Premium se renouvelle dans ${daysUntilRenewal} jour${daysUntilRenewal > 1 ? 's' : ''}. Pensez à vérifier votre moyen de paiement.`,
    actionUrl: '/profile',
    expiresAt: new Date(Date.now() + daysUntilRenewal * 24 * 60 * 60 * 1000)
  });
  
  return await notification.save();
};

// Méthode statique pour créer une notification système
notificationSchema.statics.createSystemNotification = async function(userId, title, message) {
  const notification = new this({
    userId,
    type: 'system',
    title,
    message
  });
  
  return await notification.save();
};

// Méthode statique pour créer une notification promotionnelle
notificationSchema.statics.createPromotionNotification = async function(userId, title, message, expiresInDays = 7) {
  const notification = new this({
    userId,
    type: 'promotion',
    title,
    message,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  });
  
  return await notification.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
