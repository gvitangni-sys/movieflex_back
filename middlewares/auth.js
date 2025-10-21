const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Accès refusé. Token manquant ou invalide.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token invalide. Utilisateur non trouvé.' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré.' 
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de l\'authentification.' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur a un abonnement actif
const subscriptionMiddleware = (requiredSubscription = 'basic') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentification requise.' 
      });
    }

    // Définir l'ordre des abonnements (free < basic < premium)
    const subscriptionLevels = {
      'free': 0,
      'basic': 1,
      'premium': 2
    };

    const userLevel = subscriptionLevels[req.user.subscription] || 0;
    const requiredLevel = subscriptionLevels[requiredSubscription] || 0;

    if (userLevel < requiredLevel || !req.user.isSubscriptionActive()) {
      return res.status(403).json({ 
        message: `Abonnement ${requiredSubscription} requis pour accéder à cette fonctionnalité.`,
        requiredSubscription,
        currentSubscription: req.user.subscription,
        isSubscriptionActive: req.user.isSubscriptionActive()
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'email est vérifié
const emailVerifiedMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentification requise.' 
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Veuillez vérifier votre adresse email avant de continuer.' 
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  subscriptionMiddleware,
  emailVerifiedMiddleware
};
