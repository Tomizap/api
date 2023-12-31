const express = require("express");
const router = express.Router();
const routes = require("./routes/index.js");

router.use((req, res, next) => {
  req.response = {
    ok: false,
    message: "",
    user: {},
    data: [],
  };
  next();
});

// Utilisez vos routes
router.use(routes);

// // Middleware d'erreur pour gérer toutes les erreurs
// router.use((err, req, res, next) => {
//   console.error(err.stack); // Log l'erreur à la console

//   // Vous pouvez personnaliser la réponse en fonction de l'erreur
//   // Par exemple, vous pouvez vérifier si err a un certain statut ou un certain type
//   const statusCode = err.statusCode || 500; // Utilisez le code d'état de l'erreur ou 500 par défaut
//   const errorMessage = err.message || "Erreur interne du serveur";

//   res.status(statusCode).json({
//     ok: false,
//     statusCode: statusCode,
//     message: errorMessage,
//   });
// });

module.exports = router;
