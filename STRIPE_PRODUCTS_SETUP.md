# Configuration des Produits Stripe pour Netflix Clone

Ce guide vous aide à créer les produits et prix Stripe nécessaires pour votre application.

## 📋 Étapes pour créer les produits dans Stripe

### 1. Accéder au tableau de bord Stripe

1. Connectez-vous à votre compte Stripe : https://dashboard.stripe.com
2. Assurez-vous d'être en mode "Test" (bouton en haut à droite)

### 2. Créer le produit Basic (9.99€/mois)

1. Allez dans **Products** → **Add product**
2. Remplissez les informations :
   - **Name**: `Netflix Basic`
   - **Description**: `Abonnement Netflix Basic - HD, 1 écran`
   - **Pricing model**: `Recurring`
   - **Price**: `9.99` EUR
   - **Billing period**: `Monthly`

3. Cliquez sur **Save product**
4. Copiez l'**ID du prix** (format: `price_1XXXXXXXXXXXXX`)

### 3. Créer le produit Premium (15.99€/mois)

1. Allez dans **Products** → **Add product**
2. Remplissez les informations :
   - **Name**: `Netflix Premium`
   - **Description**: `Abonnement Netflix Premium - Ultra HD, 4 écrans`
   - **Pricing model**: `Recurring`
   - **Price**: `15.99` EUR
   - **Billing period**: `Monthly`

3. Cliquez sur **Save product**
4. Copiez l'**ID du prix** (format: `price_1XXXXXXXXXXXXX`)

### 4. Mettre à jour votre fichier .env

Remplacez les IDs de prix dans votre fichier `backend/.env` :

```env
# Prix des abonnements Stripe (IDs réels de votre compte)
STRIPE_BASIC_PRICE_ID=price_1SBc7MPbdMUVanRJXXXXXXXXXX
STRIPE_PREMIUM_PRICE_ID=price_1SBc7MPbdMUVanRJXXXXXXXXXX
```

## 🧪 Tester le système de paiement

### Cartes de test à utiliser

**Carte réussie (4242 4242 4242 4242)**
- Numéro : `4242 4242 4242 4242`
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quel code à 3 chiffres
- Code postal : N'importe quel code postal

**Carte 3D Secure (4000 0025 0000 3155)**
- Nécessitera une authentification supplémentaire
- Utilisez le code d'authentification : `123456`

**Carte échouée (4000 0000 0000 9995)**
- Simule un paiement refusé

### Processus de test complet

1. **Inscription utilisateur**
   - Créez un nouveau compte via `/register`
   - L'utilisateur est redirigé vers la page de paiement

2. **Sélection du plan**
   - Choisissez Basic (9.99€) ou Premium (15.99€)
   - Les détails du plan s'affichent

3. **Paiement avec Stripe**
   - Entrez les informations de carte de test
   - Le système communique avec votre backend Stripe
   - Création de l'abonnement dans Stripe

4. **Accès aux films**
   - Après paiement réussi, redirection vers `/home`
   - L'utilisateur peut maintenant regarder des films

## 🔧 Résolution des problèmes courants

### Erreur : "No such price: price_1XXXXXXXXXXXXX"
- Vérifiez que vous avez créé les produits dans Stripe
- Copiez les bons IDs de prix dans votre fichier .env
- Redémarrez le serveur backend après modification

### Erreur : "Invalid API Key provided"
- Vérifiez que vos clés Stripe sont correctes
- Assurez-vous d'utiliser les clés de test (pas les clés live)
- Vérifiez qu'il n'y a pas d'espaces dans les clés

### Erreur : "This customer has no attached payment source"
- Le système essaie de créer un abonnement sans méthode de paiement
- Vérifiez que le champ `paymentMethodId` est correctement envoyé

## 📊 Vérification dans Stripe

Après un paiement réussi, vérifiez dans votre tableau de bord Stripe :

1. **Customers** : Un nouveau client devrait être créé
2. **Subscriptions** : L'abonnement devrait être actif
3. **Payments** : Le paiement devrait être marqué comme réussi

## 🔄 Redémarrage des services

Après avoir mis à jour les IDs de prix, redémarrez vos services :

```bash
# Dans le terminal backend
cd backend
npm run dev

# Dans le terminal frontend  
cd frontend
npm run dev
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs du backend** pour les erreurs détaillées
2. **Consultez les logs Stripe** dans le tableau de bord
3. **Vérifiez la connexion à MongoDB**

Votre système de paiement Stripe est maintenant configuré avec vos vraies clés et prêt à être testé !
