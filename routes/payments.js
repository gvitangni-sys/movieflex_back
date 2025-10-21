const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middlewares/auth');
const paymentService = require('../services/paymentService');

// Route pour créer un abonnement avec Stripe
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan, paymentMethodId, billingDetails } = req.body;
    const user = req.user;

    // Vérifier que l'utilisateur existe
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Valider le plan d'abonnement
    const validPlans = ['basic', 'premium'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Plan d\'abonnement invalide' });
    }

    // Obtenir l'ID de prix Stripe selon le plan
    const priceId = plan === 'basic' 
      ? process.env.STRIPE_BASIC_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ message: 'Configuration des prix non disponible' });
    }

    // Créer ou récupérer le client Stripe
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await paymentService.createCustomer(user.email, user.email);
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
    }

    // Attacher la méthode de paiement au client Stripe et la définir par défaut
    if (paymentMethodId) {
      await paymentService.attachAndSetDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
      user.stripePaymentMethodId = paymentMethodId;
    }

    // Enregistrer l'adresse de facturation si fournie
    if (billingDetails) {
      user.billingAddress = billingDetails;
    }

    // Créer l'abonnement Stripe
    const subscription = await paymentService.createSubscription(
      stripeCustomerId, 
      priceId, 
      { userId: user._id.toString(), plan }
    );

    // Mettre à jour l'utilisateur avec les informations Stripe
    user.stripeSubscriptionId = subscription.id;
    user.subscription = plan;
    user.subscriptionActive = true;
    
    // Calculer la date d'expiration (basée sur la période de facturation Stripe)
    const subscriptionExpires = new Date();
    subscriptionExpires.setMonth(subscriptionExpires.getMonth() + 1);
    user.subscriptionExpires = subscriptionExpires;

    await user.save();

    res.json({
      message: `Abonnement ${plan} créé avec succès !`,
      subscription: {
        id: subscription.id,
        plan: user.subscription,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        isActive: user.subscriptionActive
      },
      clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
      requiresAction: subscription?.status === 'incomplete'
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'abonnement',
      error: error.message 
    });
  }
});

// Route pour vérifier l'état de l'abonnement
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'abonnement est expiré
    if (user.subscriptionExpires && new Date() > user.subscriptionExpires) {
      user.isSubscriptionActive = false;
      await user.save();
    }

    res.json({
      subscription: user.subscription,
      subscriptionExpires: user.subscriptionExpires,
      isSubscriptionActive: user.subscriptionActive,
      canWatchMovies: user.subscriptionActive
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'abonnement:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'abonnement' });
  }
});

// Route pour annuler l'abonnement
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Annuler l'abonnement Stripe si présent
    if (user.stripeSubscriptionId) {
      try {
        await paymentService.cancelSubscription(user.stripeSubscriptionId);
      } catch (e) {
        console.error('Annulation Stripe échouée (continuer annulation locale):', e?.message || e);
      }
    }

    // Réinitialiser l'abonnement côté base de données
    user.subscription = 'free';
    user.subscriptionExpires = null;
    user.subscriptionActive = false;
    user.stripeSubscriptionId = null;

    await user.save();

    res.json({
      message: 'Abonnement annulé avec succès',
      subscription: {
        plan: user.subscription,
        isActive: user.subscriptionActive
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

module.exports = router;
