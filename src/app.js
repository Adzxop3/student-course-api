const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const studentRoutes = require("./routes/students");
const courseRoutes = require("./routes/courses");
const swaggerDefinition = require("../swaggerDef");
// const swaggerStaticJson = require('../swagger.json'); // Option 1: Garder l'ancien JSON statique
const storage = require("./services/storage");

const app = express();
app.use(express.json());

// --- Configuration Swagger Dynamique (JSDoc) ---
// C'est la configuration cible de votre projet
const options = {
  swaggerDefinition,
  // Chemin vers les fichiers d'API (contrôleurs) pour la génération JSDoc
  apis: ["./src/controllers/*.js", "./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

// /api-docs utilise maintenant la spécification générée dynamiquement
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Pour comparaison, voici l'ancienne version statique :
// app.use('/api-docs-static', swaggerUi.serve, swaggerUi.setup(swaggerStaticJson));

// --- Routes de l'API ---
app.use("/students", studentRoutes);
app.use("/courses", courseRoutes);

// --- Gestion des erreurs ---

// Middleware pour 404 - Page non trouvée
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Middleware de gestion des erreurs (doit avoir 4 arguments)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Démarrage du serveur ---
// Ce bloc ne s'exécute que si le fichier est lancé directement (ex: node src/app.js)
// Il ne s'exécutera pas lors des tests (ex: jest)
if (require.main === module) {
  const port = process.env.PORT || 3000;

  // Le 'seed' ne devrait être appelé qu'au démarrage principal,
  // et non à chaque import.
  storage.seed();
  console.log("Storage seeded with initial data.");

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
  });
}

module.exports = app;
