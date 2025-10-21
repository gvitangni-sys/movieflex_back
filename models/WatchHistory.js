const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movieId: {
    type: String,
    required: true,
  },
  movieTitle: {
    type: String,
    required: true,
  },
  movieThumbnail: {
    type: String,
    default: "",
  },
  movieGenre: {
    type: String,
    default: "Général",
  },
  watchedAt: {
    type: Date,
    default: Date.now,
  },
  durationWatched: {
    type: Number, // en secondes
    default: 0,
  },
  progress: {
    type: Number, // pourcentage de 0 à 100
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index pour les requêtes fréquentes
watchHistorySchema.index({ userId: 1, watchedAt: -1 });
watchHistorySchema.index({ userId: 1, movieId: 1 });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
