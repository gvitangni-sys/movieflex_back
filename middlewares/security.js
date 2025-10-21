const crypto = require("crypto");

// Clé secrète pour chiffrer/déchiffrer les URLs (à stocker dans .env en production)
const SECRET_KEY =
  process.env.SECURITY_SECRET_KEY ||
  "g9oLTAhpwsk71SKLzvnkQBZLExXYPezzCxanELae5Thm17Qh32iOG_gDeAAuqODl";

// Middleware pour vérifier les référents et empêcher l'accès direct
const securityMiddleware = (req, res, next) => {
  // Pour le streaming vidéo, vérifier uniquement le token
  if (req.path.includes("/movies/stream")) {
    const token = req.query.token;
    const movieId = req.params.id;

    // Vérifier si c'est une requête provenant de l'application
    const referer = req.headers.referer || "";
    const userAgent = req.headers["user-agent"] || "";
    const isFromApp =
      process.env.FRONTEND_URL && referer.includes(process.env.FRONTEND_URL);

    // Détecter les téléchargeurs
    const isDownloader =
      userAgent.toLowerCase().includes("internet download manager") ||
      userAgent.toLowerCase().includes("idm") ||
      userAgent.toLowerCase().includes("wget") ||
      userAgent.toLowerCase().includes("curl");

    // Si c'est depuis l'app ET token valide, autoriser l'accès SANS corruption
    if (isFromApp && token && verifySecureToken(token, movieId)) {
      console.log("Accès autorisé depuis l'application avec token valide");
      return next();
    }

    // Si téléchargeur détecté OU accès direct, corrompre la vidéo
    if (isDownloader || !isFromApp) {
      console.log(
        "Téléchargeur ou accès direct détecté, corruption de la vidéo"
      );
      const corruptedData = corruptVideoData(Buffer.from("corrupted"));
      res.setHeader("Content-Type", "video/mp4");
      return res.send(corruptedData);
    }

    // Si pas de token valide, renvoyer une erreur 403
    console.log("Token invalide ou manquant");
    return res.status(403).json({ message: "Accès non autorisé" });
  }

  // Pour les autres routes, continuer normalement
  next();
};

// Générer un token sécurisé pour les URLs
const generateSecureToken = (fileId, expiresIn = 300) => {
  // 5 minutes par défaut
  const timestamp = Date.now();
  const expires = timestamp + expiresIn * 1000;
  const data = `${fileId}|${expires}`;

  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(data);
  const signature = hmac.digest("hex");

  return Buffer.from(`${data}|${signature}`).toString("base64");
};

// Vérifier un token sécurisé
const verifySecureToken = (token, fileId) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [tokenFileId, expires, signature] = decoded.split("|");

    // Vérifier l'expiration
    if (Date.now() > parseInt(expires)) {
      console.log("Token expiré");
      return false;
    }

    // Vérifier le fileId
    if (tokenFileId !== fileId) {
      console.log("FileId ne correspond pas");
      return false;
    }

    // Vérifier la signature
    const data = `${fileId}|${expires}`;
    const hmac = crypto.createHmac("sha256", SECRET_KEY);
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return false;
  }
};

// Middleware pour chiffrer les données vidéo - DÉSACTIVÉ pour éviter problèmes audio
const encryptVideoData = (req, res, next) => {
  // Complètement désactivé - ne touche pas aux données vidéo
  next();
};

// Fonction pour corrompre les données vidéo - UTILISÉE UNIQUEMENT EN CAS D'ACCÈS NON AUTORISÉ
const corruptVideoData = (data) => {
  // Cette fonction ne devrait JAMAIS être appelée avec un token valide
  if (Buffer.isBuffer(data)) {
    const corrupted = Buffer.from(data);

    // Corrompre les headers MP4
    if (corrupted.length > 12) {
      corrupted.writeUInt32BE(0x636f7272, 4); // "corr" au lieu de "ftyp"
    }

    const moovPosition = corrupted.indexOf(Buffer.from("moov"));
    if (moovPosition !== -1) {
      corrupted.writeUInt32BE(0x636f7272, moovPosition);
    }

    const mdatPosition = corrupted.indexOf(Buffer.from("mdat"));
    if (mdatPosition !== -1) {
      corrupted.writeUInt32BE(0x636f7272, mdatPosition);
    }

    const corruptionHeader = Buffer.from([
      0x00, 0x00, 0x00, 0x08, 0x63, 0x6f, 0x72, 0x72, 0xde, 0xad, 0xbe, 0xef,
    ]);

    return Buffer.concat([corruptionHeader, corrupted]);
  }

  const fakeVideo = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x63, 0x6f, 0x72, 0x72,
    0x00, 0x00, 0x00, 0x01, 0x63, 0x6f, 0x72, 0x72, 0x6d, 0x70, 0x34, 0x32,
    0x00, 0x00, 0x00, 0x08, 0x6d, 0x6f, 0x6f, 0x76, 0x63, 0x6f, 0x72, 0x72,
    0x00, 0x00, 0x00, 0x00,
  ]);

  return fakeVideo;
};

// Middleware pour les images
const imageSecurityMiddleware = (req, res, next) => {
  if (req.path.includes("/movies/thumbnail")) {
    const token = req.query.token;
    const movieId = req.params.id;

    // Vérifier le referer pour les requêtes de l'application
    const referer = req.headers.referer || "";
    const isFromApp =
      process.env.FRONTEND_URL && referer.includes(process.env.FRONTEND_URL);

    // Si c'est depuis l'app, autoriser
    if (isFromApp) {
      return next();
    }

    // Sinon vérifier le token
    if (!token || !verifySecureToken(token, movieId)) {
      console.log("Accès image non autorisé, corruption de l'image");

      const corruptedImage = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      res.setHeader("Content-Type", "image/png");
      return res.send(corruptedImage);
    }
  }

  next();
};

module.exports = {
  securityMiddleware,
  generateSecureToken,
  verifySecureToken,
  encryptVideoData,
  imageSecurityMiddleware,
  corruptVideoData,
};
