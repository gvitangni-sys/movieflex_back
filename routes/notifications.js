const express = require('express');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET /notifications - Récupérer toutes les notifications de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Récupérer les notifications non expirées, triées par date de création (plus récentes d'abord)
    const notifications = await Notification.find({
      userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
});

// GET /notifications/unread-count - Récupérer le nombre de notifications non lues
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications non lues'
    });
  }
});

// PUT /notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification comme lue'
    });
  }
});

// PUT /notifications/read-all - Marquer toutes les notifications comme lues
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        userId,
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      },
      {
        $set: { isRead: true }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`
    });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de toutes les notifications comme lues'
    });
  }
});

// POST /notifications - Créer une notification (pour les tests ou l'administration)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, title, message, actionUrl, expiresInDays } = req.body;
    const userId = req.user._id;

    // Validation des données
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Le type, le titre et le message sont requis'
      });
    }

    if (!['subscription_renewal', 'system', 'promotion'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de notification invalide'
      });
    }

    let notificationData = {
      userId,
      type,
      title,
      message,
      actionUrl
    };

    // Ajouter la date d'expiration si spécifiée
    if (expiresInDays) {
      notificationData.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const notification = new Notification(notificationData);
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      notification
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification'
    });
  }
});

// DELETE /notifications/:id - Supprimer une notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notification'
    });
  }
});

module.exports = router;
