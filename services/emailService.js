const nodemailer = require("nodemailer");

// Configuration du transporteur email
const createTransporter = () => {
  // En production, configuration réelle
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const emailService = {
  // Envoyer un email de vérification
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@netflix-clone.com",
      to: user.email,
      subject: "Vérification de votre adresse email - Netflix Clone",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e50914;">Bienvenue sur Netflix Clone!</h2>
          <p>Bonjour,</p>
          <p>Merci de vous être inscrit sur Netflix Clone. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #e50914; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Vérifier mon email
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>Ce lien expirera dans 24 heures.</p>
          <p>Cordialement,<br>L'équipe Netflix Clone</p>
        </div>
      `,
    };

    try {
      const transporter = createTransporter();
      const result = await transporter.sendMail(mailOptions);

      console.log("📧 Email de vérification envoyé");

      return result;
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de l'email de vérification:",
        error
      );
      throw new Error("Impossible d'envoyer l'email de vérification");
    }
  },

  // Envoyer un email de réinitialisation de mot de passe
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@netflix-clone.com",
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - Netflix Clone",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e50914;">Réinitialisation de mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e50914; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe Netflix Clone</p>
        </div>
      `,
    };

    try {
      const transporter = createTransporter();
      const result = await transporter.sendMail(mailOptions);

      console.log("📧 Email de réinitialisation envoyé");

      return result;
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de l'email de réinitialisation:",
        error
      );
      throw new Error("Impossible d'envoyer l'email de réinitialisation");
    }
  },

  // Envoyer un email de bienvenue après vérification
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@netflix-clone.com",
      to: user.email,
      subject: "Bienvenue sur Netflix Clone!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e50914;">Bienvenue sur Netflix Clone!</h2>
          <p>Bonjour,</p>
          <p>Votre compte a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de Netflix Clone.</p>
          <p>Votre abonnement actuel: <strong>${user.subscription}</strong></p>
          <p>Pour accéder à plus de contenu, n'hésitez pas à mettre à niveau votre abonnement.</p>
          <p>Cordialement,<br>L'équipe Netflix Clone</p>
        </div>
      `,
    };

    try {
      const transporter = createTransporter();
      const result = await transporter.sendMail(mailOptions);

      console.log("📧 Email de bienvenue envoyé");

      return result;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
      // Ne pas bloquer le processus si l'email de bienvenue échoue
    }
  },
};

module.exports = emailService;
