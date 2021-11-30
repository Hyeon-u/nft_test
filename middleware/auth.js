const bcrypt = require("bcryptjs");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const db = require("../db");
const jwtKey = "cane123a";

function findByToken(token, cb) {
  jwt.verify(token, jwtKey, async function (err, decode) {
    try {
      if (!decode) {
        // console.log('1');
        cb(null, null);
      }
      // console.log('decode', decode)
      let result = await db.checkUserByIdAndToken(decode, token);
      // console.log('2',result);
      cb(null, result);
    } catch (e) {
      console.log("verify error: ", e);
      return cb(err);
    }
  });
}

let auth = (req, res, next) => {
  let token = req.cookies.w_auth;
  // console.log('token',token);

  if (token) {
    //console.log('token=', token);
    findByToken(token, (err, user) => {
      if (err) throw err;
      if (!user) {
        console.log("not user");
        return res.json({
          isAuth: false,
          error: true,
        });
      }
      // console.log("user");

      req.token = token;
      req.user = user;
      next();
    });
  } else {
    console.log("not logIn");
    return res.json({
      isAuth: false,
      error: true,
    });
    // next();
  }
};

module.exports = {
  auth,
};
