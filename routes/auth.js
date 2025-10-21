const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /auth/register - Inscription d'un nouvel utilisateur
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        message: 'L\'email et le mot de passe sont requis'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      email: email.toLowerCase(),
      password
    });

    // Générer le token de vérification d'email
    const verificationToken = user.generateEmailVerificationToken();
    
    // Sauvegarder l'utilisateur
    await user.save();

    // Générer le token JWT
    const token = generateToken(user._id);

    // Envoyer l'email de vérification (en arrière-plan, ne pas bloquer la réponse)
    emailService.sendVerificationEmail(user, verificationToken)
      .catch(error => {
        console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      });

    // Réponse avec indication de redirection vers la page de paiement
    res.status(201).json({
      message: 'Compte créé avec succès. Veuillez procéder au paiement pour activer votre abonnement.',
      user: user.getPublicProfile(),
      token,
      redirectTo: '/payment'
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Données invalides',
        errors
      });
    }

    res.status(500).json({
      message: 'Erreur lors de la création du compte'
    });
  }
});

// POST /auth/login - Connexion d'un utilisateur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        message: 'L\'email et le mot de passe sont requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[LOGIN] utilisateur introuvable pour email:', email.toLowerCase());
      }
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[LOGIN] mot de passe invalide pour email:', email.toLowerCase());
      }
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken(user._id);

    res.json({
      message: 'Connexion réussie',
      user: user.getPublicProfile(),
      token
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la connexion'
    });
  }
});

// POST /auth/forgot-password - Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'L\'email est requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return res.json({
        message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé'
      });
    }

    // Générer le token de réinitialisation
    const resetToken = user.generateResetToken();
    await user.save();

    // Envoyer l'email de réinitialisation
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé'
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// POST /auth/reset-password - Réinitialisation du mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Le token et le nouveau mot de passe sont requis'
      });
    }

    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

// POST /auth/verify-email - Vérification de l'email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Le token de vérification est requis'
      });
    }

    // Trouver l'utilisateur avec le token de vérification
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: 'Token de vérification invalide'
      });
    }

    // Marquer l'email comme vérifié
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Envoyer l'email de bienvenue
    emailService.sendWelcomeEmail(user)
      .catch(error => {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      });

    res.json({
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
});

// GET /auth/me - Récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// PUT /auth/profile - Mettre à jour le profil (email et/ou mot de passe)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mise à jour de l'email si fourni
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // nécessite une re-vérification si on change l'email
      const verificationToken = user.generateEmailVerificationToken();
      // envoyer email en arrière-plan
      emailService.sendVerificationEmail(user, verificationToken).catch(console.error);
    }

    // Mise à jour du mot de passe si demandé
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Mot de passe actuel requis' });
      }
      const valid = await user.comparePassword(currentPassword);
      if (!valid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }
      user.password = newPassword; // sera hashé par le pre-save
    }

    await user.save();

    return res.json({
      message: 'Profil mis à jour avec succès',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// GET /auth/favorites - Récupérer la liste des favoris de l'utilisateur
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des favoris' });
  }
});

// POST /auth/favorites/:movieId - Ajouter un film aux favoris
router.post('/favorites/:movieId', authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si le film existe déjà dans les favoris
    if (user.favorites.includes(movieId)) {
      return res.status(400).json({ message: 'Ce film est déjà dans vos favoris' });
    }

    // Ajouter le film aux favoris
    user.favorites.push(movieId);
    await user.save();

    res.json({
      message: 'Film ajouté aux favoris avec succès',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout aux favoris' });
  }
});

// DELETE /auth/favorites/:movieId - Retirer un film des favoris
router.delete('/favorites/:movieId', authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si le film est dans les favoris
    if (!user.favorites.includes(movieId)) {
      return res.status(400).json({ message: 'Ce film n\'est pas dans vos favoris' });
    }

    // Retirer le film des favoris
    user.favorites = user.favorites.filter(id => id.toString() !== movieId);
    await user.save();

    res.json({
      message: 'Film retiré des favoris avec succès',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Erreur lors du retrait des favoris:', error);
    res.status(500).json({ message: 'Erreur lors du retrait des favoris' });
  }
});

module.exports = router;
