const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const moment = require('moment');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const db = require("../db");
const blockchain = require("../blockchain/nft_scripts");
const jwtKey = "cane123a";
const { auth } = require("../middleware/auth");
// const authjs = require('../middleware/auth');
// const auth = authjs.auth;


router.get("/auth", auth, (req, res) => {
  // console.log('auth req dataValues', req.user.dataValues);

  res.status(200).json({
    user_id: req.user.dataValues.userid,
    isAdmin: req.user.dataValues.role === 1 ? false : true,
    isAuth: true,
    email: req.user.dataValues.email,
    name: req.user.dataValues.name,
    role: req.user.dataValues.role,
    wallet_address: req.user.dataValues.wallet_address,
  });
});

router.post("/register", (req, res) => {
  async function register() {
    try {
      console.log("register", req.body);

      const userid = req.body.user_id;
      const userName = req.body.user_name;
      const password = req.body.password;
      const email = req.body.email;

      if (!userid) return res.json({ result: false, errMsg: "ID not entered" });
      if (!userName)
        return res.json({ result: false, errMsg: "UserName not entered" });
      if (!password)
        return res.json({ result: false, errMsg: "Password not entered" });
      if (!email)
        return res.json({ result: false, errMsg: "Email not entered" });

      const isExistId = await db.getUserById(userid);
      if (isExistId) {
        console.log(`[${userid}] is Already Exist`);
        return res.json({ result: false, errMsg: "Already registered" });
      }

      const wallet = await blockchain.ethCreate();
      const wallet_address = wallet.address;
      const wallet_privatekey = wallet.privateKey;

      const hash = await getPasswordHash(password, async (hash) => {
        console.log("hash:", hash);
        let role = 1;
        if (userid === "admin") {
          role = 0;
        }
        let dbResult = await db.createUser(
          userid,
          hash,
          userName,
          email,
          wallet_address,
          wallet_privatekey,
          role
        );

        if (dbResult) {
          return res.json({ result: true });
        }
      });
    } catch (e) {
      console.log("Err: ", e);
    }
  }

  register();
});



router.post("/login", (req, res) => {
  async function login() {
    // console.log("login body: ", req.body);
    const userid = req.body.user_id;
    const isExistId = await db.getUserById(userid);

    if (!isExistId) {
      // admin이 없을 경우 만든다
      if (userid === 'admin') {
        const hash = await getPasswordHash('admin', async (hash) => {
          // console.log("hash:", hash);
          let dbResult = await db.createAdmin(hash);
          // console.log('create admin: ' + dbResult);
          if (dbResult) {
            let result = await generateToken(userid);
            return res.cookie("w_auth", result.token).json({ result: true });
          }
        });
      } else {
        console.log("user not exist");
        return res.json({ result: false, errMsg: "doesn't exist ID" });
      }
    } else {
      // console.log("user", isExistId);

      const password = req.body.password;

      bcrypt.compare(password, isExistId.password, async function (err, isMatch) {
        if (err) {
          return res.json({ result: false, errMsg: "server Error" });
        }

        if (isMatch) {
          console.log("password matched");
          let result = await generateToken(userid);

          return res.cookie("w_auth", result.token).json({ result: true });
        } else {
          console.log("password not matched");
          return res.json({ result: false, errMsg: "doesn't match ID, PW" });
        }
      });
    }
  }
  login(req, res);
});

router.get("/logout", auth, async (req, res) => {
  async function logout() {
    try {
      console.log('logout req', req.user.dataValues);
      let result = await db.updateUserToken(req.user.dataValues.userid, "");
      if (result) {
        return res.send({ result: true });
      }
    } catch (e) {
      return res.json({ result: false, errMsg: e });
    }
  }
  logout(req, res);
});

async function getPasswordHash(password, cb) {
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
      console.log("make hash: ", hash);
      cb(hash);
    });
  });
}

async function generateToken(userId) {
  let result = {};
  let token = jwt.sign(userId, jwtKey);
  // let oneHour = moment().add(1, "hour").valueOf();

  result.token = token;
  // result.tokenExp = oneHour;

  // 토큰 정보 저장
  // await db.updateUserToken(userId, token, oneHour);
  await db.updateUserToken(userId, token);

  return result;
}

async function _checkExistAdmin() {
  const isExist = await db.getUserById('admin');
  if (!isExist) {
    await db.createAdmin();
    return
  }
}


module.exports = router;
