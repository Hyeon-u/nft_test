const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const db = require("../db");
const blockchain = require("../blockchain/nft_scripts");

router.post("/register", (req, res) => {
  async function register() {
    try {
      console.log("register", req.body);

      const id = req.body.id;
      const userName = req.body.userName;
      const password = req.body.password;
      const email = req.body.email;

      const isExistId = await db.getUserById(id);
      if (isExistId) {
        return res.json({ result: false, errMsg: "already registered" });
      }

      const wallet = await blockchain.ethCreate();
      const wallet_address = wallet.address;
      const wallet_privatekey = wallet.privateKey;

      const hash = await getPasswordHash(password);
      let dbResult = await db.createUser(
        id,
        hash,
        userName,
        email,
        wallet_address,
        wallet_privatekey
      );

      if (dbResult) {
        return res.json({ result: true });
      }
    } catch (e) {
      console.log("Err: ", e);
    }
  }

  register();
});

router.post("/login", (req, res) => {
  const id = req.body.id;
  const isExistId = db.getUserById(id);
  if (!isExistId) {
    return res.json({ result: false, errMsg: "doesn't exist ID" });
  }

  const password = req.body.password;

  bcrypt.compare(password, isExistId.password, function (err, isMatch) {
    if (err) {
      return res.json({ result: false, errMsg: "server Error" });
    }

    if (isMatch) {
      return res.json({ result: true });
    } else {
      return res.json({ result: false, errMsg: "doesn't match ID, PW" });
    }
  });
});



async function getPasswordHash(password) {
  bcrypt.genSalt(saltRounds, function (err, salt) {
    if (err) {
      console.log("bcrypt error: ", err);
      return;
    }
    bcrypt.hash(password, salt, function (err, hash) {
      if (err) {
        console.log("bcrypt hash error: ", err);
        return;
      }
      return hash;
    });
  });
}

module.exports = router;
