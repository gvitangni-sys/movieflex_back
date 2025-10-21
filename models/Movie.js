const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  genre: { type: String, index: true },
  year: { type: Number },
  rating: { type: Number, default: 0 },
  duration: { type: String, default: '' },
  // Paths are internal; never expose absolute paths to clients
  thumbnailPath: { type: String, required: true },
  videoPath: { type: String, required: true },
  // URLs for direct access in production
  thumbnailUrl: { type: String },
  videoUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
