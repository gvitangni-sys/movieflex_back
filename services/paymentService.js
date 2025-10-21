const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Créer un client Stripe
   */
  async createCustomer(email, name = '') {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          app: 'netflix-clone'
        }
      });
      return customer;
    } catch (error) {
      console.error('Erreur création client Stripe:', error);
      throw new Error('Erreur lors de la création du client');
    }
  }

  /**
   * Créer un PaymentIntent pour un paiement unique
   */
  async createPaymentIntent(amount, currency, customerId, metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convertir en centimes
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ...metadata,
          app: 'netflix-clone'
        },
        setup_future_usage: 'off_session', // Permet les paiements futurs
      });

      return paymentIntent;
    } catch (error) {
      console.error('Erreur création PaymentIntent:', error);
      throw new Error('Erreur lors de la création du paiement');
    }
  }

  /**
   * Créer un abonnement avec Stripe
   */
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          ...metadata,
          app: 'netflix-clone'
        }
      });

      return subscription;
    } catch (error) {
      console.error('Erreur création abonnement Stripe:', error);
      throw new Error('Erreur lors de la création de l\'abonnement');
    }
  }

  /**
   * Attacher une méthode de paiement au client et la définir par défaut
   */
  async attachAndSetDefaultPaymentMethod(customerId, paymentMethodId) {
    try {
      // Attacher la méthode de paiement au client
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Définir comme méthode par défaut pour la facturation
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'attachement de la méthode de paiement:', error);
      throw new Error('Impossible d\'attacher la méthode de paiement');
    }
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId) {
    try {
      const canceledSubscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return canceledSubscription;
    } catch (error) {
      console.error('Erreur annulation abonnement Stripe:', error);
      throw new Error('Erreur lors de l\'annulation de l\'abonnement');
    }
  }

  /**
   * Récupérer les informations d'un client
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Erreur récupération client Stripe:', error);
      throw new Error('Erreur lors de la récupération du client');
    }
  }

  /**
   * Récupérer les informations d'un abonnement
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Erreur récupération abonnement Stripe:', error);
      throw new Error('Erreur lors de la récupération de l\'abonnement');
    }
  }

  /**
   * Créer un setup intent pour enregistrer une carte
   */
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return setupIntent;
    } catch (error) {
      console.error('Erreur création SetupIntent:', error);
      throw new Error('Erreur lors de la configuration du paiement');
    }
  }

  /**
   * Simuler un paiement réussi (pour le mode test)
   */
  async simulateSuccessfulPayment(paymentIntentId) {
    try {
      // En mode test, Stripe permet de simuler des paiements réussis
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: 'pm_card_visa' // Méthode de paiement de test
      });

      return paymentIntent;
    } catch (error) {
      console.error('Erreur simulation paiement:', error);
      throw new Error('Erreur lors de la simulation du paiement');
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      throw new Error('Erreur lors de la vérification du paiement');
    }
  }
}

module.exports = new PaymentService();
