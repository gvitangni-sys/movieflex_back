# Configuration Stripe pour Netflix Clone

Ce guide explique comment configurer Stripe pour le système de paiement du clone Netflix.

## 🚀 Configuration en mode test

### 1. Obtenir les clés Stripe de test

1. Créez un compte sur [Stripe](https://stripe.com)
2. Allez dans le [Tableau de bord Stripe](https://dashboard.stripe.com/test/apikeys)
3. Récupérez vos clés de test :
   - **Clé publique (publishable key)** : `pk_test_...`
   - **Clé secrète (secret key)** : `sk_test_...`

### 2. Configurer les variables d'environnement

Mettez à jour votre fichier `.env` dans le dossier `backend` :

```env
# Stripe Configuration (Mode Test)
STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé_publique_ici
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète_ici

# Prix des abonnements Stripe (IDs de test)
STRIPE_BASIC_PRICE_ID=price_test_basic_monthly
STRIPE_PREMIUM_PRICE_ID=price_test_premium_monthly
```

### 3. Créer les produits et prix dans Stripe

Dans le tableau de bord Stripe, créez deux produits :

#### Produit Basic (9.99€/mois)
- **Nom** : Netflix Basic
- **Type** : Service
- **Prix** : 9.99€, récurrent mensuel
- **ID du prix** : `price_test_basic_monthly`

#### Produit Premium (15.99€/mois)
- **Nom** : Netflix Premium  
- **Type** : Service
- **Prix** : 15.99€, récurrent mensuel
- **ID du prix** : `price_test_premium_monthly`

## 🔧 Configuration en production

### 1. Passer en mode production

1. Dans le tableau de bord Stripe, basculez en mode "Live"
2. Récupérez les clés de production :
   - **Clé publique** : `pk_live_...`
   - **Clé secrète** : `sk_live_...`

### 2. Mettre à jour les variables d'environnement

```env
# Stripe Configuration (Mode Production)
STRIPE_PUBLISHABLE_KEY=pk_live_votre_clé_publique_ici
STRIPE_SECRET_KEY=sk_live_votre_clé_secrète_ici

# Prix des abonnements Stripe (IDs de production)
STRIPE_BASIC_PRICE_ID=price_live_basic_monthly
STRIPE_PREMIUM_PRICE_ID=price_live_premium_monthly
```

### 3. Créer les produits en production

Créez les mêmes produits mais avec les IDs de production.

## 🧪 Cartes de test Stripe

### Cartes de test réussies
- **4242 4242 4242 4242** - Carte réussie standard
- **4000 0025 0000 3155** - Carte nécessitant une authentification 3D Secure
- **4000 0027 6000 3184** - Carte avec authentification 3D Secure réussie

### Cartes de test échouées
- **4000 0000 0000 9995** - Carte refusée
- **4000 0027 6000 0007** - Authentification 3D Secure échouée

### Autres scénarios de test
- **4000 0027 6000 0024** - Fraude détectée
- **4000 0027 6000 0032** - Carte bloquée

## 🔒 Sécurité

### Variables d'environnement
- **NE JAMAIS** commettre les clés Stripe dans le code
- Utilisez `.env` pour le développement local
- Utilisez les variables d'environnement du serveur pour la production

### Webhooks (Recommandé pour la production)

Configurez les webhooks Stripe pour gérer les événements :

```javascript
// Endpoint pour les webhooks Stripe
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Gérer les événements
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Mettre à jour l'abonnement
        break;
      case 'invoice.payment_failed':
        // Gérer l'échec de paiement
        break;
      case 'customer.subscription.deleted':
        // Gérer l'annulation d'abonnement
        break;
    }
    
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## 📱 Configuration du frontend

### Mettre à jour la clé publique

Dans `frontend/src/pages/Payment.tsx`, mettez à jour la clé Stripe :

```typescript
// Pour le développement
const stripePromise = loadStripe('pk_test_votre_clé_publique_ici');

// Pour la production
const stripePromise = loadStripe('pk_live_votre_clé_publique_ici');
```

## 🚨 Bonnes pratiques

### 1. Validation des paiements
- Toujours vérifier le statut des paiements côté serveur
- Ne pas faire confiance aux données du client

### 2. Gestion des erreurs
- Logger toutes les erreurs de paiement
- Avoir un système de retry pour les paiements échoués

### 3. Conformité PCI DSS
- Stripe est certifié PCI DSS Level 1
- Ne stockez jamais les données de carte directement
- Utilisez toujours Stripe Elements ou Payment Intents

### 4. Tests en production
- Utilisez le mode test jusqu'à ce que tout fonctionne
- Testez tous les scénarios avant de passer en production

## 🔍 Monitoring

### Métriques importantes à surveiller
- Taux de réussite des paiements
- Taux d'échec par type d'erreur
- Revenus mensuels récurrents (MRR)
- Taux de désabonnement (churn rate)

### Alertes à configurer
- Échecs de paiement répétés
- Webhooks en erreur
- Anomalies dans les revenus

## 📞 Support

- **Documentation Stripe** : https://stripe.com/docs
- **Support Stripe** : https://support.stripe.com
- **Statut des services Stripe** : https://status.stripe.com

---

**Note importante** : Ce système utilise Stripe en mode test, ce qui signifie qu'aucun vrai argent n'est échangé. Pour passer en production, vous devez obtenir les clés de production et configurer votre compte Stripe pour accepter les vrais paiements.
