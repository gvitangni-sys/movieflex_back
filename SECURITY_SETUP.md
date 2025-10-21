# Système de Sécurité - Protection des Vidéos et Images

## 🛡️ Vue d'ensemble

Ce système de sécurité empêche le téléchargement non autorisé des vidéos et images en dehors de l'application. Les fichiers deviennent corrompus lorsqu'ils sont téléchargés via des outils comme IDM, wget, curl, etc.

## 🔒 Fonctionnalités de Sécurité Implémentées

### 1. **Tokens HMAC Sécurisés**
- Génération de tokens avec HMAC-SHA256
- Expiration automatique (5 minutes par défaut)
- Vérification de signature pour prévenir la falsification
- Base64 encoding pour transmission sécurisée

### 2. **Détection des Téléchargeurs**
- Blocage des user-agents connus :
  - Internet Download Manager (IDM)
  - wget, curl
  - Python requests, axios
  - Postman
  - Autres outils de téléchargement

### 3. **Vérification des Référents**
- Autorise uniquement les requêtes provenant de domaines autorisés
- Bloque les accès directs sans référent valide
- Domaines autorisés : localhost:8080, localhost:5000, votre-domaine.com

### 4. **Corruption des Fichiers**
- **Vidéos** : Corruption du header MP4 + ajout de données aléatoires
- **Images** : Remplacement par une image 1x1 pixel corrompue
- Les fichiers téléchargés deviennent illisibles

## 🔧 Configuration

### Variables d'Environnement

```env
# Clé secrète pour la sécurité (à changer en production)
SECURITY_SECRET_KEY=votre-cle-secrete-super-securisee-ici
```

### Middlewares Disponibles

```javascript
const {
  securityMiddleware,        // Vérification générale de sécurité
  generateSecureToken,       // Génération de tokens
  verifySecureToken,         // Vérification de tokens
  encryptVideoData,          // Corruption des vidéos
  imageSecurityMiddleware    // Protection des images
} = require('./middlewares/security');
```

## 🚀 Utilisation

### Routes Protégées

```javascript
// Streaming vidéo sécurisé
router.get('/stream/:id', securityMiddleware, encryptVideoData, async (req, res) => {
  // Vérification automatique du token
  // Corruption si token invalide
});

// Images sécurisées
router.get('/thumbnail/:id', imageSecurityMiddleware, async (req, res) => {
  // Corruption si accès non autorisé
});
```

### Génération de Tokens

```javascript
// Générer un token sécurisé (expire dans 5 minutes)
const token = generateSecureToken(movieId, 300);

// URL sécurisée
const secureUrl = `/movies/stream/${movieId}?token=${token}`;
```

## 🧪 Tests de Sécurité

### Test de Corruption Vidéo
1. Essayez de télécharger une vidéo avec IDM
2. Le fichier téléchargé sera corrompu
3. Impossible de lire la vidéo hors de l'application

### Test de Corruption Image
1. Essayez de télécharger une image directement
2. L'image sera remplacée par un PNG 1x1 corrompu

### Test d'Accès Direct
1. Essayez d'accéder à l'URL sans token
2. Accès refusé ou fichier corrompu

## 🔍 Détection et Logs

Le système loggue automatiquement :
- Tentatives d'accès avec des téléchargeurs bloqués
- Accès directs sans token
- Tokens expirés ou invalides
- Corruption de fichiers

## ⚠️ Notes Importantes

### En Production
1. **Changez la clé secrète** dans `.env`
2. **Ajoutez votre domaine** dans la liste des domaines autorisés
3. **Testez exhaustivement** toutes les fonctionnalités

### Limitations
- La sécurité repose sur la détection des user-agents
- Les téléchargeurs sophistiqués peuvent contourner certaines protections
- Recommandé : Utiliser un CDN avec protection DRM pour une sécurité maximale

## 🛠️ Dépannage

### Problèmes Courants

**Les vidéos ne jouent pas :**
- Vérifiez que les tokens sont générés correctement
- Vérifiez l'expiration des tokens
- Vérifiez la clé secrète

**Accès refusés :**
- Vérifiez les domaines autorisés
- Vérifiez les headers Referer
- Vérifiez les user-agents bloqués

### Debug
Activez les logs détaillés dans `middlewares/security.js` pour voir :
- Les user-agents détectés
- Les tokens vérifiés
- Les corruptions effectuées

## 📈 Améliorations Futures

- [ ] Implémenter DRM (Digital Rights Management)
- [ ] Ajouter Watermarking des vidéos
- [ ] Intégrer un CDN sécurisé
- [ ] Ajouter rate limiting
- [ ] Implémenter géoblocage

---

**⚠️ Attention** : Ce système fournit une protection de base. Pour un contenu de haute valeur, envisagez des solutions DRM professionnelles.
