const { subscriptionMiddleware } = require('./auth');

// Middleware pour vérifier si l'utilisateur a un abonnement actif
const requireSubscription = (requiredLevel = 'basic') => {
  return subscriptionMiddleware(requiredLevel);
};

// Middleware pour vérifier si l'utilisateur peut regarder des films
const canWatchMovies = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentification requise pour accéder aux films.' 
    });
  }

  // Vérifier si l'abonnement est expiré
  if (req.user.subscriptionExpires && new Date() > req.user.subscriptionExpires) {
    req.user.isSubscriptionActive = false;
    req.user.save().catch(console.error); // Sauvegarde en arrière-plan
  }

  if (!req.user.isSubscriptionActive || req.user.subscription === 'free') {
    return res.status(403).json({ 
      message: 'Abonnement requis pour regarder des films.',
      redirectTo: '/payment',
      currentSubscription: req.user.subscription,
      isSubscriptionActive: req.user.isSubscriptionActive
    });
  }

  next();
};

module.exports = {
  requireSubscription,
  canWatchMovies
};
