# 🧪 Tests de Sécurité - Guide Rapide

## ✅ Système de Sécurité Activé

Le serveur backend fonctionne avec la sécurité complète activée. Voici comment tester la protection :

## 🔒 Tests à Effectuer

### Test 1 : Accès Direct aux Vidéos
```bash
# Essayez d'accéder directement à une vidéo sans token
curl -I "http://localhost:5000/movies/stream/VIDEO_ID"

# Résultat attendu : 401 Unauthorized ou vidéo corrompue
```

### Test 2 : Téléchargement avec IDM
1. Installez Internet Download Manager
2. Essayez de télécharger une vidéo depuis l'application
3. **Résultat** : Le fichier téléchargé sera corrompu et illisible

### Test 3 : Accès Direct aux Images
```bash
# Essayez d'accéder directement à une image sans token
curl -I "http://localhost:5000/movies/thumbnail/IMAGE_ID"

# Résultat attendu : Image corrompue (PNG 1x1 pixel)
```

### Test 4 : Utilisation de wget/curl
```bash
# Essayez de télécharger avec wget
wget "http://localhost:5000/movies/stream/VIDEO_ID"

# Résultat attendu : Accès bloqué ou fichier corrompu
```

## 🎯 Fonctionnement dans l'Application

### Flux Sécurisé :
1. **Utilisateur connecté** → Accède à la page Watch
2. **Frontend** → Appelle `/movies/:id/watch` avec token JWT
3. **Backend** → Génère token HMAC sécurisé (valide 5 min)
4. **Video Player** → Utilise URL avec token HMAC
5. **Streaming** → Token vérifié, vidéo délivrée

### Protection des Images :
1. **Frontend** → Affiche images via URLs publiques
2. **Backend** → Vérifie token dans query string
3. **Sans token** → Image corrompue délivrée
4. **Avec token valide** → Image réelle délivrée

## 🔍 Monitoring des Logs

Le système loggue automatiquement :
- ✅ Tentatives d'accès avec téléchargeurs bloqués
- ✅ Accès directs sans token
- ✅ Tokens expirés ou invalides
- ✅ Corruption de fichiers effectuée

## 🚨 Messages de Sécurité Attendu

Dans les logs du serveur, vous devriez voir :
```
Token invalide pour le streaming, corruption de la vidéo
Token invalide pour l'image, corruption de l'image
Téléchargeur bloqué détecté: [user-agent]
Accès direct détecté sans token
```

## 📊 Vérification Finale

### ✅ Fonctionne dans l'app :
- Lecture des vidéos
- Affichage des images
- Navigation normale

### ❌ Ne fonctionne PAS hors de l'app :
- Téléchargement des vidéos (fichiers corrompus)
- Téléchargement des images (images corrompues)
- Accès directs sans authentification

---

**🎉 Félicitations ! Votre système de sécurité est maintenant opérationnel.**

Vos vidéos Kendji Girac sont protégées contre le téléchargement non autorisé !
