const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const WatchHistory = require("../models/WatchHistory");
const { authMiddleware } = require("../middlewares/auth");

// Récupérer l'historique de visionnage de l'utilisateur
router.get("/", authMiddleware, async (req, res) => {
  try {
    const watchHistory = await WatchHistory.find({ userId: req.user.id })
      .sort({ watchedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      history: watchHistory,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
});

// Récupérer les statistiques de visionnage
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total regardé
    const totalWatched = await WatchHistory.countDocuments({ userId });

    // Films terminés
    const completedMovies = await WatchHistory.countDocuments({
      userId,
      completed: true,
    });

    // Temps total de visionnage
    const totalWatchTimeResult = await WatchHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$durationWatched" } } },
    ]);
    const totalWatchTime =
      totalWatchTimeResult.length > 0 ? totalWatchTimeResult[0].total : 0;

    // Activité récente (dernières 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await WatchHistory.countDocuments({
      userId,
      watchedAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalWatched,
        completedMovies,
        totalWatchTime,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
});

// Ajouter un élément à l'historique
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { movieId, progress, duration } = req.body;

    // Récupérer les infos du film depuis la base de données
    const Movie = require("../models/Movie");
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Film non trouvé",
      });
    }

    // Vérifier si l'élément existe déjà
    const existingHistory = await WatchHistory.findOne({
      userId: req.user.id,
      movieId,
    });

    if (existingHistory) {
      // Mettre à jour l'élément existant
      existingHistory.progress = progress;
      existingHistory.durationWatched = duration;
      existingHistory.completed = progress >= 95; // Considéré comme terminé à 95%
      existingHistory.watchedAt = new Date();

      await existingHistory.save();

      return res.json({
        success: true,
        message: "Historique mis à jour",
        history: existingHistory,
      });
    }

    // Créer un nouvel élément
    const watchHistory = new WatchHistory({
      userId: req.user.id,
      movieId,
      movieTitle: movie.title,
      movieThumbnail: movie.thumbnail,
      movieGenre: movie.genre,
      progress,
      durationWatched: duration,
      completed: progress >= 95,
    });

    await watchHistory.save();

    res.status(201).json({
      success: true,
      message: "Élément ajouté à l'historique",
      history: watchHistory,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout à l'historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout à l'historique",
    });
  }
});

// Supprimer un élément de l'historique
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const historyItem = await WatchHistory.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: "Élément non trouvé",
      });
    }

    await WatchHistory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Élément supprimé de l'historique",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'historique",
    });
  }
});

// Vider tout l'historique
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await WatchHistory.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      message: "Historique vidé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du vidage de l'historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du vidage de l'historique",
    });
  }
});

module.exports = router;
