const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST !== 'smtp.example.com') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }

  return null;
};

const sendPasswordResetEmail = async (to, token) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.error("****************************************************");
    console.error("ERROR: Email settings are not configured in .env file.");
    console.error("Password reset email will not be sent.");
    console.error("****************************************************");
    return;
  }
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Cabinet" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: "Réinitialisation de votre mot de passe",
    html: `<p>Vous avez demandé une réinitialisation de mot de passe.</p><p>Cliquez sur ce <a href="${resetUrl}">lien</a> pour réinitialiser votre mot de passe.</p><p>Ce lien expirera dans une heure.</p><p>Si vous n'avez pas demandé de réinitialisation, veuillez ignorer cet e-mail.</p>`,
  };

  await mailer.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };