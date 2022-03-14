require("dotenv").config();
const models = require("./models");
const Contents = require("./models/contents");
const User = require("./models/user");
// const blockchain = require("./blockchain/nft_scripts");

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// 유저 생성
async function createUser(
  userId,
  password,
  name,
  email,
  wallet_address,
  wallet_privatekey,
  role
) {
  const result = await models.User.create({
    userid: userId,
    password: password,
    name: name,
    email: email,
    wallet_address: wallet_address,
    wallet_privatekey: wallet_privatekey,
    role: role,
  });

  if (result) {
    console.log("Success");
    return result;
  } else {
    console.log("Fail");
    return null;
  }
}

// admin 생성
async function createAdmin(hash) {
  const result = await models.User.create({
    id:1,
    userid: 'admin',
    password: hash,
    name: 'admin',
    email: 'admin@admin.com',
    wallet_address: PUBLIC_KEY,
    wallet_privatekey: PRIVATE_KEY,
    role: 0,
  });

  if (result) {
    console.log("Success");
    return result;
  } else {
    console.log("Fail");
    return null;
  }
}

// ID로 유저 패스워드 수정
async function updateUserById(userId, newPassword) {
  const exist = await getUserById(userId);
  if (!exist) {
    console.log("not find user");
    return;
  }

  if (exist.password === newPassword) {
    console.log("same password");
    return;
  }

  const result = await exist.update({
    password: newPassword,
  });

  console.log("update result: ", result);
}

// ID로 유저검색
async function getUserById(userId) {
  const result = await models.User.findOne({
    where: { userid: userId },
  });
  // console.log('getUserById result: ', result);

  if (!result) {
    return null;
  } else {
    return result.dataValues;
  }
}

async function checkUserByIdAndToken(userId, token) {
  const result = await models.User.findOne({
    where: { userid: userId, token: token },
  });
  return result;
}

// 전체 유저 리스트
async function getUserList() {
  const result = await models.User.findAll();
  return result;
}

// ID로 유저삭제
async function deleteUserbyId(userId) {
  models.User.destroy({
    where: { userid: userId },
  }).then((_) => console.log("Delete Success"));
}

// 유저 토큰 업데이트
async function updateUserToken(userId, token) {
  try {
    const exist = await models.User.findOne({
      where: { userid: userId },
    });

    if (exist) {
      const result = await exist.update({
        token: token,
      });
      // console.log('result', result);
      return result;
    } else {
      console.log("Not found user");
      return null;
    }
  } catch (e) {
    console.log("updateUserToken Error: ", e);
    return e;
  }
}
// // 유저 토큰 업데이트
// async function updateUserToken(userId, token, token_exp) {
//   try {
//     const exist = await models.User.findOne({
//       where: {id: userId}
//     });

//     if (exist) {
//       const result = await exist.update({
//         token: token,
//         token_exp: token_exp
//       })
//       console.log('result', result);
//     } else {
//       console.log("Not found user");
//     }
//   } catch (e) {
//     console.log("updateMintingContents Error: ", e);
//   }
// }

// 유저 잔액 업데이트
async function updateUserBalance(userId, balance) {
  try {
    const exist = await models.User.findOne({
      where: { userid: userId },
    });

    if (exist) {
      const result = await exist.update({
        eth_balance: balance,
      });
      // console.log('result', result);
      return result;
    } else {
      console.log("Not found user");
      return null;
    }
  } catch (e) {
    console.log("updateUserBalance Error: ", e);
    return e;
  }
}

// 컨텐츠 최초 저장
async function makeContents(
  ownerId,
  name,
  description,
  jsonLocation,
  fileLocation,
  price
) {
  try {
    const result = await models.Contents.create({
      ownerid: ownerId,
      name: name,
      description: description,
      jsonlocation: jsonLocation,
      filelocation: fileLocation,
      status: "UPLOAD",
      price: price,
      buyable: true,
    });

    if (result) {
      console.log("Success");
      return result;
    } else {
      console.log("Fail");
    }
  } catch (e) {
    console.log("makeContents Error: ", e);
  }
}

// 컨텐츠 상태 업데이트
async function updateStatusContents(nftId, status) {
  try {
    const exist = await models.Contents.findOne({
      where: { mint_tx: mint_tx },
    });

    if (exist) {
      const result = await exist.update({
        nftid: nftId,
        status: status,
      });
    } else {
      console.log("Fail");
    }
  } catch (e) {
    console.log("updateStatusContents Error: ", e);
  }
}

// 컨텐츠 민팅 중
async function updateMintingContents(contents_no, mint_tx) {
  try {
    const exist = await models.Contents.findOne({
      where: { id: contents_no },
    });

    if (exist) {
      const result = await exist.update({
        mint_tx: mint_tx,
        status: "MINTING",
      });
    } else {
      console.log("Fail");
    }
  } catch (e) {
    console.log("updateStatusContents Error: ", e);
  }
}

// 컨텐츠 민팅 성공
async function updateSuccessMintingContents(mint_tx, nftId) {
  try {
    const exist = await models.Contents.findOne({
      where: { mint_tx: mint_tx },
    });

    console.log("db] exist: ", exist);

    if (exist) {
      const result = await exist.update({
        nftid: nftId,
        status: "DONE",
      });
    } else {
      console.log("Fail");
    }
  } catch (e) {
    console.log("updateStatusContents Error: ", e);
  }
}

// 컨텐츠 민팅중 인 것만 가져오기
async function getMintingContents() {
  try {
    const lists = await models.Contents.findAll({
      // include:[
      //   {
      //     model: models.User,
      //     attributes: ['wallet_address']
      //   }
      // ],
      where: { status: "MINTING" },
    });

    return lists;
  } catch (e) {
    console.log("updateStatusContents Error: ", e);
  }
}

// no로 컨텐츠 정보 가져오기
async function getContentsByNo(no) {
  try {
    const result = await models.Contents.findOne({
      where: { id: no },
    });

    return result.dataValues;
  } catch (e) {
    console.log("getContentsByNo error: ", e);
  }
}

// nftID 로 컨텐츠 정보 가져오기
async function getContentsById(tokenId) {
  try {
    const result = await models.Contents.findOne({
      where: { nftid: tokenId },
    });

    return result;
  } catch (e) {
    console.log("getContentsById error: ", e);
  }
}

// 구매 가능한 컨텐츠 목록 내용 전부 가져오기
async function getBuyableContents() {
  try {
    const result = await models.Contents.findAll({
      where: { buyable: true },
      order: [["updatedAt", "DESC"]],
    });

    return result;
  } catch (e) {
    console.log("getBuyableContents error", e);
  }
}

// 구매 가능한 컨텐츠 목록 가져오기
async function getBuyableContentsList() {
  try {
    const result = await models.Contents.findAll({
      where: { buyable: true },
      attributes: ["id", "name", "filelocation", "price", "updatedAt"],
      order: [["updatedAt", "DESC"]],
    });

    return result;
  } catch (e) {
    console.log("getBuyableContentsList error", e);
  }
}

// 컨텐츠 소유자 변경
async function changeOwner(contentsNo, newOwnerId) {
  // const nftOwnerAddress = await blockchain.ownerOf(contentsId);
  // const result = await models.User.findOne({
  //   where: { wallet_address: nftOwnerAddress },
  // });

  // if (!result || requestUserId !== result.id) {
  //   // 해당 nft의 소유자가 우리월렛이 아니거나, 요청한 사람이 아니면
  //   // 에러: 소유권 없음
  // }

  // const result = await models.Contents.findOne({
  //   where: { nftid: contentsId, ownerid: requestUserId },
  // });

  // if (!result) {
  //   // 에러: 소유권 없음
  // }

  const exist = await models.Contents.findOne({
    where: { id: contentsNo },
  });

  console.log(exist);
  if (!exist) {
    // 에러: 해당 아이템을 찾을 수 없음
  }

  let result = await exist.update({
    ownerid: newOwnerId,
    buyable: false,
  });
  console.log("result: ", result);
  return result;
}

async function setBuy(contentsNo, newOwnerId, tx_hash) {
  const exist = await models.Contents.findOne({
    where: { id: contentsNo },
  });

  console.log(exist);
  if (!exist) {
    // 에러: 해당 아이템을 찾을 수 없음
  }

  let result = await exist.update({
    ownerid: newOwnerId,
    mint_tx: tx_hash,
    status: "MINTING",
    buyable: false,
  });
  console.log("result: ", result);
  return result;
}

// 해당 유저의 컨텐츠 가져오기
async function getUserContents(userId) {
  try {
    const exist = await models.User.findOne({
      where: { userid: userId },
    });

    if (!exist) {
      //유저 없음
      return;
    }

    const result = await models.Contents.findAll({
      where: { ownerid: userId },
      order: [["updatedAt", "DESC"]],
    });

    return result;
  } catch (e) {
    console.log(e);
  }
}

async function checkUserContents(userId, nftId) {
  try {
    const exist = await models.Contents.findOne({
      where: { ownerid: userId, nftid: nftId },
    });

    if (exist) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
  }
}

async function checkUserContentsNo(userId, contents_no) {
  try {
    const exist = await models.Contents.findOne({
      where: { ownerid: userId, id: contents_no },
    });

    if (exist) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
  }
}

async function test() {
  let result = "";
  // result = await createUser("aass", "asdf", "jo", "test@a.com", "0x388d66AE970B9Bc4150774F75b5bBD3AC15be920", "970a06de7de007553dc929c6aeb058ffdaeecde9f0ea739e00a2f6d270a0c6ff")
  //   let result = await getUserById("asdf");
  //   console.log("final result: ", result);
  //   console.log("user password: ", result.password);

  // let result = await getUserList();
  //   result.map(list => {
  //       console.log("UserId: ", list.id)
  //   });

  // let result = await deleteUserbyId("asdf");

  // await updateUserById("abcd", "asdfg");
  result = await makeContents(
    "aass",
    "mountain",
    "mountain description",
    "jsonLocation",
    "fileLocation",
    "0x9b13e7f055898f56e89765ed4188af73bf830bdf5e5d3bf80526c8cd360a0165"
  );

  console.log(result);

  let list = await getMintingContents();
  console.log("list: ", list);
}

// test();

module.exports = {
  createUser,
  createAdmin,
  updateUserById,
  getUserById,
  getUserList,
  updateUserToken,
  updateUserBalance,
  deleteUserbyId,
  makeContents,
  updateStatusContents,
  changeOwner,
  getContentsByNo,
  getContentsById,
  updateMintingContents,
  updateSuccessMintingContents,
  getMintingContents,
  getBuyableContents,
  getBuyableContentsList,
  setBuy,
  getUserContents,
  checkUserContents,
  checkUserContentsNo,
  checkUserByIdAndToken,
};
