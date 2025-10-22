const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware } = require("../middlewares/auth");

// Route de test pour créer un abonnement sans Stripe
router.post("/subscribe", authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = req.user;

    // Vérifier que l'utilisateur existe
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Valider le plan d'abonnement
    const validPlans = ["basic", "premium"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Plan d'abonnement invalide" });
    }

    // Simuler un paiement réussi en mode test
    console.log(
      ` Simulation de paiement réussi pour l'utilisateur ${user.email} - Plan: ${plan}`
    );

    // Mettre à jour l'utilisateur avec les informations d'abonnement
    user.subscription = plan;
    user.isSubscriptionActive = true;

    // Calculer la date d'expiration (30 jours)
    const subscriptionExpires = new Date();
    subscriptionExpires.setMonth(subscriptionExpires.getMonth() + 1);
    user.subscriptionExpires = subscriptionExpires;

    // Marquer comme client Stripe de test
    user.stripeCustomerId = `test_customer_${user._id}`;
    user.stripeSubscriptionId = `test_subscription_${user._id}`;

    await user.save();

    res.json({
      message: `Abonnement ${plan} créé avec succès ! (Mode test)`,
      subscription: {
        id: user.stripeSubscriptionId,
        plan: user.subscription,
        status: "active",
        currentPeriodEnd: Math.floor(user.subscriptionExpires.getTime() / 1000),
        isActive: user.isSubscriptionActive,
      },
      testMode: true,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement (test):", error);
    res.status(500).json({
      message: "Erreur lors de la création de l'abonnement",
      error: error.message,
    });
  }
});

module.exports = router;
