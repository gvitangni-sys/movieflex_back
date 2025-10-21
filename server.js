const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // En développement, autoriser toutes les origines
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // En production, vérifier l'origine
      const allowedOrigins = [
        'https://netflix-alpha-sable.vercel.app',
        'https://netflix-clone-wj56.onrender.com',
        process.env.FRONTEND_URL
      ].filter(Boolean); // Supprimer les valeurs null/undefined
      
      // Nettoyer les URLs pour enlever les barres obliques finales
      const cleanAllowedOrigins = allowedOrigins.map(url => 
        url ? url.replace(/\/$/, '') : url
      );
      
      if (!origin || cleanAllowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        console.log('CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Sécurité globale
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
});

// Referrer whitelist (éviter hotlinking de flux)
const allowedReferrers = [
  'https://netflix-alpha-sable.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url ? url.replace(/\/$/, '') : url);

app.use((req, res, next) => {
  const isMedia =
    req.path.startsWith("/movies/stream") ||
    req.path.startsWith("/movies/thumbnail");
  if (!isMedia) return next();
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  const ref = req.get("referer") || req.get("origin") || "";
  if (!ref) return res.status(403).end();
  const cleanRef = ref.replace(/\/$/, '');
  const ok = allowedReferrers.some((a) => cleanRef.startsWith(a));
  if (!ok) return res.status(403).end();
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/payments", require("./routes/payments"));
app.use("/test-payments", require("./routes/testPayments"));
app.use("/movies", require("./routes/movies"));
app.use("/notifications", require("./routes/notifications"));
app.use("/watch-history", require("./routes/watchHistoryRoutes"));

// Route de test
app.get("/", (req, res) => {
  res.json({
    message: "API Netflix Clone Backend",
    version: "1.0.0",
    status: "running",
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Environnement: ${process.env.NODE_ENV}`);
});
