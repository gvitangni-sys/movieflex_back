# Netflix Clone - Backend API

Backend complet pour le clone Netflix, développé avec Node.js, Express et MongoDB.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Gestion des utilisateurs** avec validation d'email
- **Système d'abonnement** (free, basic, premium)
- **Réinitialisation de mot de passe** sécurisée
- **API RESTful** complète
- **Sécurité renforcée** avec bcrypt et middleware d'authentification

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- MongoDB (local ou cloud)
- npm ou yarn

## ⚙️ Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   Modifier le fichier `.env` avec vos configurations.

4. **Démarrer MongoDB**
   - Local: `mongod`
   - Ou utiliser MongoDB Atlas (cloud)

5. **Démarrer l'application**
   ```bash
   # Mode développement
   npm run dev

   # Mode production
   npm start
   ```

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Application
PORT=5000
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/netflix-clone

# Sécurité JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (mock en développement)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📡 API Endpoints

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "message": "Compte créé avec succès. Veuillez procéder au paiement pour activer votre abonnement.",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "subscription": "free",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isSubscriptionActive": true
  },
  "token": "jwt_token",
  "redirectTo": "/payment"
}
```

#### POST /auth/login
Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "subscription": "premium",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isSubscriptionActive": true
  },
  "token": "jwt_token"
}
```

#### POST /auth/forgot-password
Demande de réinitialisation de mot de passe.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Réponse:**
```json
{
  "message": "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé"
}
```

#### POST /auth/reset-password
Réinitialisation du mot de passe.

**Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Réponse:**
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

#### POST /auth/verify-email
Vérification de l'adresse email.

**Body:**
```json
{
  "token": "verification_token"
}
```

**Réponse:**
```json
{
  "message": "Email vérifié avec succès"
}
```

#### GET /auth/me
Récupération du profil utilisateur (authentification requise).

**Headers:**
```
Authorization: Bearer jwt_token
```

**Réponse:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "subscription": "premium",
    "subscriptionExpires": "2024-12-31T23:59:59.000Z",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isSubscriptionActive": true
  }
}
```

## 🔐 Sécurité

- **Mots de passe** hashés avec bcrypt
- **Tokens JWT** pour l'authentification
- **Validation d'email** obligatoire
- **CORS** configuré pour le frontend
- **Middleware d'authentification** sur les routes protégées

## 🧪 Tests

Pour tester l'API, vous pouvez utiliser:

1. **Postman** ou **Insomnia**
2. **curl** en ligne de commande
3. **Tests automatisés** (à implémenter)

### Exemple avec curl

**Inscription:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Connexion:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Profil utilisateur:**
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗃️ Structure du projet

```
backend/
├── models/
│   └── User.js              # Modèle utilisateur MongoDB
├── routes/
│   └── auth.js              # Routes d'authentification
├── middlewares/
│   └── auth.js              # Middlewares d'authentification
├── services/
│   └── emailService.js      # Service d'envoi d'emails
├── server.js                # Point d'entrée de l'application
├── package.json
├── .env                     # Variables d'environnement
└── README.md
```

## 🚨 Gestion des erreurs

L'API retourne des codes HTTP appropriés:

- **200** : Succès
- **201** : Création réussie
- **400** : Données invalides
- **401** : Non authentifié
- **403** : Accès refusé
- **404** : Ressource non trouvée
- **500** : Erreur serveur

## 🔄 Développement

### Scripts disponibles

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement avec nodemon
npm test           # Exécuter les tests (à implémenter)
```

### Mode développement

En mode développement, les emails sont simulés et les liens sont affichés dans la console.

## 📧 Configuration email

Pour la configuration email en production:

1. Configurer les variables d'environnement email
2. Utiliser un service comme Gmail, SendGrid, ou Mailgun
3. Tester l'envoi d'emails

## 🎯 Prochaines étapes

- [ ] Implémenter les tests unitaires
- [ ] Ajouter la gestion des films/séries
- [ ] Implémenter le système de paiement
- [ ] Ajouter la gestion des profils utilisateurs
- [ ] Implémenter les logs d'activité
- [ ] Ajouter la documentation Swagger/OpenAPI

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
