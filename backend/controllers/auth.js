/***********************************/
/*** Import des module nécessaires */
// const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
// const argon2 = require('argon2');
const DB = require("../db.config");
const User = DB.User;
const fs = require("fs");


/**********************************/
/*** Routage de la ressource Auth */

exports.login = async (req, res) => {
   const { email, password } = req.body;

   // Validation des données reçues
   if (!email || !password) {
      return res.status(400).json({ message: "Bad email or password" });
   }

   try {
      // Vérification si l'utilisateur existe
      let user = await User.findOne({ where: { email: email }, raw: true });
      if (user === null) {
         return res
            .status(401)
            .json({ message: "This account does not exists !" });
      }

      // Vérification du mot de passe
      //let test = await bcrypt.compare(password, user.password)
      let test = await User.checkPassword(password, user.password);
      if (!test) {
         return res.status(401).json({ message: "Wrong password" });
      }

      // Génération du token et envoi
      const secret = fs.readFileSync(__dirname + "/../../.sets/pv.pem");
      const token = jwt.sign(
         {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
         },
         secret,
         { expiresIn: process.env.JWT_DURING, algorithm: "RS256" }
      );

      return res.json({ access_token: token });
   } catch (err) {
      if (err.name == "SequelizeDatabaseError") {
         res.status(500).json({ message: "Database Error", error: err });
      }
      res.status(500).json({ message: "Login process failed", error: err });
   }
};
