require("dotenv").config();

const app = require("./src/app");
const { initDatabase, closeDatabase } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Connexion à la base de données
    await initDatabase();
    console.log("Base de données connectée.");

    // Démarrage du serveur
    server = app.listen(PORT, () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur http://localhost:${PORT}/api`);
    });
  } catch (error) {
    const message = error?.message || "Erreur inconnue";

    console.error("❌ Impossible de démarrer le serveur :", message);

    const isAuthError =
      /password authentication failed/i.test(message) ||
      /authentification par mot de passe échouée/i.test(message);

    if (isAuthError) {
      console.error(
        "⚠ Vérifiez DATABASE_URL dans backend/.env (utilisateur, mot de passe, port)."
      );
    }

    process.exit(1);
  }
};

/* ----------------------------- SHUTDOWN PROPRE ----------------------------- */

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} reçu. Arrêt du serveur...`);

  if (server) {
    server.close(async () => {
      console.log("Serveur HTTP fermé.");

      try {
        await closeDatabase();
        console.log("Connexion à la base de données fermée.");
        process.exit(0);
      } catch (err) {
        console.error("Erreur lors de la fermeture de la base :", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

/* ----------------------------- EVENTS ----------------------------- */

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

/* ----------------------------- START ----------------------------- */

startServer();