const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth");
const { canWatchMovies } = require("../middlewares/subscription");
const {
  securityMiddleware,
  generateSecureToken,
  verifySecureToken,
  encryptVideoData,
  imageSecurityMiddleware,
  corruptVideoData,
} = require("../middlewares/security");
const path = require("path");
const fs = require("fs");
const Movie = require("../models/Movie");

// Helper: build initial catalog with direct URLs to Vercel assets
const FRONTEND_BASE_URL = "https://movieflex-bay.vercel.app";

async function ensureCatalogSeeded() {
  const count = await Movie.countDocuments();
  if (count > 0) return;

  // Correspondances exactes image/vidéo avec URLs directes
  const movieMappings = [
    {
      image: "Mario.jpg",
      video: "SUPER_MARIO.mp4",
      title: "SUPER MARIO",
      description: "films  - super mario",
      genre: "films ",
      year: 2023,
      rating: 5,
      duration: "59m 59s",
      isFeatured: true,
    },
    {
      image: "mentalist.jpg",
      video: "Mentalist.mp4",
      title: "Mentalist",
      description: "serie enquete police - John le row",
      genre: "serie",
      year: 2014,
      rating: 9,
      duration: "3m 58s",
      isFeatured: true,
    },
    {
      image: "roi_lion.jpg",
      video: "Mufasa___Le_Roi_Lion.mp4",
      title: "Le Roi Lion",
      description: "histoire du roi de la savane - Mufassa",
      genre: "film jenesse",
      year: 2022,
      rating: 5,
      duration: "1h 30m 58s",
      isFeatured: true,
    },
    {
      image: "Aquaman.jpg",
      video: "AQUAMAN.mp4",
      title: "Aquaman",
      description: "roi de la mer faire face a une nouvelle menace - avanture",
      genre: "film",
      year: 2024,
      rating: 9,
      duration: "2h 20m 21s",
      isFeatured: true,
    },
    {
      image: "Ralph.jpg",
      video: "RALPH_2.0.mp4",
      title: "Raplph",
      description: "au seins d'un jeux video la vie existe egalement - Ralph",
      genre: "film-jenesse",
      year: 2020,
      rating: 9,
      duration: "1h 45m 10s",
      isFeatured: true,
    },
  ];

  const docs = movieMappings.map((mapping) => ({
    title: mapping.title,
    description: mapping.description,
    genre: mapping.genre,
    year: mapping.year,
    rating: mapping.rating,
    duration: mapping.duration,
    thumbnailPath: `images/${mapping.image}`, // Champ requis pour le modèle
    videoPath: `videos/${mapping.video}`, // Champ requis pour le modèle
    thumbnailUrl: `${FRONTEND_BASE_URL}/images/${mapping.image}`, // URL directe pour l'affichage
    videoUrl: `${FRONTEND_BASE_URL}/videos/${mapping.video}`, // URL directe pour l'affichage
    isFeatured: mapping.isFeatured,
  }));

  if (docs.length > 0) {
    await Movie.insertMany(docs);
  }
}

// GET /movies - Récupérer tous les films (accessible sans abonnement pour la navigation)
router.get("/", async (req, res) => {
  try {
    await ensureCatalogSeeded();
    const { genre, featured } = req.query;

    const filter = {};
    if (genre) filter.genre = new RegExp(`^${genre}$`, "i");
    if (featured === "true") filter.isFeatured = true;

    const list = await Movie.find(filter).select("-__v -createdAt -updatedAt");
    const movies = list.map((m) => ({
      id: m._id,
      title: m.title,
      description: m.description,
      genre: m.genre,
      year: m.year,
      rating: m.rating,
      duration: m.duration,
      isFeatured: m.isFeatured,
      thumbnailUrl: m.thumbnailUrl, // Utiliser l'URL directe
    }));
    res.json({
      movies,
      total: movies.length,
      message: "Films récupérés avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des films:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des films" });
  }
});

// GET /movies/:id - Récupérer un film spécifique (accessible sans abonnement pour les détails)
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select("-__v");

    if (!movie) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    const safe = {
      id: movie._id,
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      year: movie.year,
      rating: movie.rating,
      duration: movie.duration,
      isFeatured: movie.isFeatured,
      thumbnailUrl: movie.thumbnailUrl, // Utiliser l'URL directe
    };
    res.json({ movie: safe, message: "Film récupéré avec succès" });
  } catch (error) {
    console.error("Erreur lors de la récupération du film:", error);
    res.status(500).json({ message: "Erreur lors de la récupération du film" });
  }
});

// GET /movies/:id/watch - Regarder un film (nécessite un abonnement)
router.get("/:id/watch", authMiddleware, canWatchMovies, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    // En production, utiliser l'URL directe vers Vercel
    if (process.env.NODE_ENV === "production") {
      res.json({
        movie: {
          id: movie._id,
          title: movie.title,
          duration: movie.duration,
        },
        streamingUrl: movie.videoUrl, // URL directe vers Vercel
        message: "Lecture du film autorisée",
      });
    } else {
      // En développement, utiliser le streaming local
      const token = generateSecureToken(movie._id.toString(), 300); // 5 minutes
      res.json({
        movie: {
          id: movie._id,
          title: movie.title,
          duration: movie.duration,
        },
        streamingUrl: `/movies/stream/${movie._id}?token=${token}`,
        message: "Lecture du film autorisée",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la lecture du film:", error);
    res.status(500).json({ message: "Erreur lors de la lecture du film" });
  }
});

// Streaming de test avec sécurité complète
router.get(
  "/test-stream/:id",
  authMiddleware,
  canWatchMovies,
  securityMiddleware,
  encryptVideoData,
  async (req, res) => {
    try {
      const { id } = req.params;
      const movie = await Movie.findById(id);
      if (!movie) return res.status(404).end();

      console.log("Test streaming sécurisé pour film:", movie.title);
      console.log("Chemin vidéo:", movie.videoPath);

      const abs = path.join(PUBLIC_DIR, movie.videoPath);
      console.log("Chemin absolu:", abs);
      console.log("Fichier existe:", fs.existsSync(abs));

      if (!fs.existsSync(abs)) {
        console.log("Fichier vidéo non trouvé, utilisation du sample");
        const samplePath = path.join(PUBLIC_DIR, "videos", "sample.mp4");
        if (fs.existsSync(samplePath)) {
          const stat = fs.statSync(samplePath);
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Content-Length", stat.size);
          fs.createReadStream(samplePath).pipe(res);
          return;
        } else {
          return res.status(404).json({ message: "Aucune vidéo disponible" });
        }
      }

      const stat = fs.statSync(abs);
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(abs, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": stat.size,
          "Content-Type": "video/mp4",
        });
        fs.createReadStream(abs).pipe(res);
      }
    } catch (err) {
      console.error("Erreur streaming test:", err);
      res.status(500).json({ message: "Erreur streaming" });
    }
  }
);

// Streaming sécurisé avec tokens HMAC - CORRECTION AUDIO
router.get("/stream/:id", securityMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Vérifier le token
    if (!token || !verifySecureToken(token, id)) {
      console.log("Token invalide pour le streaming");
      // Retourner une erreur 403 au lieu de corrompre les données
      return res.status(403).json({
        message: "Accès non autorisé",
        error: "Token invalide ou expiré",
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    // Empêcher indexation et affichage d'URL dans logs
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", 'inline; filename="video.mp4"');

    const abs = path.join(PUBLIC_DIR, movie.videoPath);
    const streamPath = fs.existsSync(abs)
      ? abs
      : path.join(PUBLIC_DIR, "videos", "sample.mp4");

    if (!fs.existsSync(streamPath)) {
      return res.status(404).json({ message: "Vidéo non disponible" });
    }

    // Streaming avec support range pour l'audio/vidéo
    const stat = fs.statSync(streamPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      });

      const file = fs.createReadStream(streamPath, { start, end });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      });

      fs.createReadStream(streamPath).pipe(res);
    }
  } catch (err) {
    console.error("Erreur streaming:", err);
    res.status(500).json({ message: "Erreur lors du streaming" });
  }
});

// Vignette pour l'application (avec token automatique)
router.get("/thumbnail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Vérifier si c'est une requête provenant de l'application
    const referer = req.headers.referer || "";
    const isFromApp =
      process.env.FRONTEND_URL && referer.includes(process.env.FRONTEND_URL);

    // Si c'est une requête de l'application, autoriser l'accès
    if (isFromApp) {
      const movie = await Movie.findById(id);
      if (!movie) return res.status(404).end();

      const abs = path.join(PUBLIC_DIR, movie.thumbnailPath);
      if (!fs.existsSync(abs)) return res.status(404).end();

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");

      const ext = path.extname(abs).toLowerCase();
      const type =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Disposition", 'inline; filename="thumb"' + ext);

      fs.createReadStream(abs).pipe(res);
      return;
    }

    // Si c'est un accès direct ou téléchargement, vérifier le token
    if (!token || !verifySecureToken(token, id)) {
      console.log("Accès non autorisé à l'image, corruption de l'image");

      // Créer une image corrompue (1x1 pixel noir)
      const corruptedImage = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a, // PNG header corrompu
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x48,
        0x44,
        0x52, // IHDR chunk corrompu
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x01, // 1x1 pixel
        0x08,
        0x02,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // Corrupted
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x45,
        0x4e,
        0x44, // IEND
        0xae,
        0x42,
        0x60,
        0x82, // PNG end
      ]);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store");
      return res.send(corruptedImage);
    }

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).end();

    const abs = path.join(PUBLIC_DIR, movie.thumbnailPath);
    if (!fs.existsSync(abs)) return res.status(404).end();

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const ext = path.extname(abs).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", 'inline; filename="thumb"' + ext);

    fs.createReadStream(abs).pipe(res);
  } catch (err) {
    console.error("Erreur vignette:", err);
    res.status(500).end();
  }
});

// Endpoint pour générer des URLs sécurisées pour les images
router.get("/:id/secure-thumbnail", authMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    // Générer un token sécurisé pour l'image (valide 10 minutes)
    const token = generateSecureToken(movie._id.toString(), 600);

    res.json({
      secureThumbnailUrl: `/movies/thumbnail/${movie._id}?token=${token}`,
      message: "URL sécurisée générée",
    });
  } catch (error) {
    console.error("Erreur génération URL sécurisée:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la génération de l'URL sécurisée" });
  }
});

// GET /movies/genres - Récupérer tous les genres disponibles
router.get("/genres/list", async (req, res) => {
  try {
    await ensureCatalogSeeded();
    const movies = await Movie.find({}).select("genre");
    const genres = [...new Set(movies.map((movie) => movie.genre))];

    res.json({
      genres,
      total: genres.length,
      message: "Genres récupérés avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des genres:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des genres" });
  }
});

// POST /movies/search - Rechercher des films
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        message: "La requête de recherche doit contenir au moins 2 caractères",
      });
    }

    const searchTerm = query.toLowerCase().trim();
    const movies = await Movie.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { genre: { $regex: searchTerm, $options: "i" } },
      ],
    }).select("-__v -createdAt -updatedAt");

    const searchResults = movies.map((m) => ({
      id: m._id,
      title: m.title,
      description: m.description,
      genre: m.genre,
      year: m.year,
      rating: m.rating,
      duration: m.duration,
      isFeatured: m.isFeatured,
      thumbnailUrl: m.thumbnailUrl, // Utiliser l'URL directe
    }));

    res.json({
      results: searchResults,
      total: searchResults.length,
      query: searchTerm,
      message:
        searchResults.length === 0
          ? "Aucun résultat trouvé"
          : "Recherche effectuée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({ message: "Erreur lors de la recherche" });
  }
});

// POST /movies/reset - Réinitialiser le catalogue (pour développement)
router.post("/reset", async (req, res) => {
  try {
    await Movie.deleteMany({});
    await ensureCatalogSeeded();

    res.json({
      message: "Catalogue réinitialisé avec succès",
      movies: await Movie.countDocuments(),
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

module.exports = router;
