const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const db = require("../db");
const blockchain = require("../blockchain/nft_scripts");
const jwtKey = "cane123a";
const { auth } = require("../middleware/auth");
// const authjs = require('../middleware/auth');
// const auth = authjs.auth;

// nft 민팅
router.post("/getwallet", auth, (req, res) => {
  console.log("getwallet");
  async function getwallet() {
    try {
    //   console.log("body", req.body);
      const userId = req.body.user_id;
      const userInfo = await db.getUserById(userId);
      // console.log('user', userInfo);
      const address = userInfo.wallet_address;

      if (!address) {
        return res.json({ result: false, errMsg: "No user" });
      }

      const ethBalance = await blockchain.ethBalance(address);

      let return_balance;
      if (!ethBalance) {
        return_balance = "0";
      } else {
        return_balance = ethBalance;
      }

      await db.updateUserBalance(userId, return_balance);

      return res.json({
        result: true,
        eth_balance: return_balance,
      });
    } catch (e) {
      console.log(e);
      return res.json({ result: false, errMsg: e });
    }
  }
  getwallet(req, res);
});

module.exports = router;
