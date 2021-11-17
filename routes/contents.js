const express = require("express");
const router = express.Router();
const multer = require("multer");
const util = require("../utils/utils");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const blockchain = require("../blockchain/nft_scripts");
const db = require("../db");

const contractAddress = "0xb7b6f49a45cc4f8300984cc765d55aa673076886"; // 우리 nft 계약 주소
const pinataApiKey = "8f2b3c06ae4c56bcbfc0"; 
const pinataSecretApiKey =
  "ba21580c84f19baed77e58156448d9ba853edb68f4026996bdfad21fef54ba39";
const pinataPreUrl = "https://gateway.pinata.cloud/ipfs/";

let middle = (req, res, next) => {
  // let token = req.cookies.w_auth;

  //console.log('token=', token);

  // User.findByToken(token, (err, user) => {
  //   if (err) throw err;
  //   if (!user)
  //     return res.json({
  //       isAuth: false,
  //       error: true
  //     });

  //   req.token = token;
  //   req.user = user;
  //console.log('success');
  next();
  // });
};

// file upload to /uploads folder
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" || ext !== ".png" || ext !== ".gif" || ext !== ".webp") {
      return cb(res.status(400).end("only jpg, gif, png are allowed"), false);
    }
    cb(null, true);
  },
  limit: { filesize: 1024 * 1024 * 1024 },
});

// var upload = multer({ storage: storage }).single("file");
var upload = multer({ storage: storage }).single("file");

// File (image, video, gif) 을 upload
router.post("/uploadFile", upload, (req, res) => {
  async function uploadFile() {
    try {
    //   console.log("req file: ", req.file);
      console.log("uploadFile: ", req.body);
      //   return res.json({ success: true, url: res.req.file.path });

      const userId = req.body.id;
      if (userId != "admin") {
        return res.status(400).end("you are not admin");
      }
      const name = req.body.name; // 그림 제목
      const description = req.body.description; // 그림 설명
      const file = res.req.file; // 업로드 된 파일
      
      console.log("uploadImage:url:", file.path);

      // ipfs 이미지 업로드
      let result = await pinFileToIPFS(file.path);

      if(result.isDuplicate) {
        return res.json({ result: false, errMsg: "Is duplecate Img"});
      }

      let hash = result.IpfsHash;
      let imgUrl = pinataPreUrl + hash;

      // json 파일 생성
      let hashJson = util.makeJson(name, description, imgUrl);
      let hashJsonStr = JSON.stringify(hashJson);
      const hashJsonName = hash + ".json";
      fs.writeFileSync('/uploads'+hashJsonName, hashJsonStr);

      // ipfs json 파일 업로드
      let jsonHash = await pinFileToIPFS(hashJsonName);
      let jsonUrl = pinataPreUrl + jsonHash;

      let dbResult = await db.makeContents(
        userId,
        name,
        description,
        jsonUrl,
        imgUrl,
        ""
      );
      if (dbResult) {
        return res.json({ result: true, dbResult: dbResult });
      }
    } catch (e) {
      return res.json({ result: false, errMsg: e });
    }
  }
  uploadFile(req, res);
});

// nft 민팅
router.post("/mintnft", upload, (req, res) => {
  console.log("mintNFT");
  async function mintNft() {
    try {
      const userId = req.body.id;
    //   const contents = req.body.contents;
      const contents_no = req.body.contents_no;

      const address = await db.getUserById(userId).wallet_address;

      if (!address) {
        return res.json({ result: false, errMsg: "No user" });
      }

      const contentsInfo = await db.getContents(contents_no);

      if (!contentsInfo) {
        return res.json({ result: false, errMsg: "No item" });
      }

      const imgUrl = contentsInfo.filelocation;
      const name = contentsInfo.name;
      const description = contentsInfo.description;

      //nft 발급
      const nft_hash = await blockchain.mintNFT(address, jsonUrl);

      //db 업데이트
      const result = await db.updateMintingContents(contents_no, nft_hash);

      //응답
      if (result) {
        return res.json({ result: true });
      }
    } catch (e) {
      return res.json({ result: false, errMsg: e });
    }
  }
  mintNft(req, res);
});

// nft 구입
router.post("/orderBuy", upload, (req, res) => {
  console.log("buy");
  async function buy() {
    try {
      console.log(req.body);
      const id = req.body.id;
      const contents_no = req.body.contents_no;
      const contentsInfo = await db.getContentsByNo(contents_no);

      const isBuyable = contentsInfo.buyable; // 구매 가능한 컨텐츠 인가
      if(!isBuyable) {
        return res.status(400).json({ result: false, errMsg: "This item is not for sale" });
      }

      let jsonUrl = contentsInfo.jsonlocation;
      let num_no = Number(contents_no);
      let hash = await blockchain.mintCompanyNFT(jsonUrl);
    //   console.log("hash: ", hash.transactionHash);

      //   const result = await db.changeOwner(num_no, id);
      const result = await db.setBuy(num_no, id, hash.transactionHash);
      if (result) {
        return res.status(200).json({ result: true });
      }
    } catch (e) {
      console.log("orderby error: ", e);
    }
  }
  buy(req, res);
});

// nft 전송(회사 월렛에서 외부 월렛)
router.post("/ctransfernft", upload, (req, res) => {
  console.log("transfernft");
  async function transferNft() {
    try {
      const userId = req.body.id;
      const contents_no = req.body.no;
      const toAddress = req.body.address;

      const result = await db.getContentsByNo(contents_no);
      if (userId !== result.ownerid) {
        return res.status(200).json({ result: false, errMsg: "Wrong User" });
      }

      await blockchain.companyTransferNFT(toAddress, result.nftid);
    } catch (e) {
      console.log("transfernft error: ", e);
    }
  }
  transferNft(req, res);
});

// 판매중인 nft 목록 가져오기
router.get("/getnftlist", (req, res) => {
  console.log("getnftlist");
  async function getNftList() {
    try {
      const result = await db.getBuyableContents();
      return res.status(200).json({ result: true, list: result });
    } catch (e) {
      console.log("getnftlist error: ", e);
    }
  }
  getNftList(req, res);
});

// contents 정보 가져오기 (NFT가 발급 안되어 있을 수 있으므로 contents_no 사용)
router.get("/getContentsInfo", (req, res) => {
    console.log("getContentsInfo");
    async function getContentsInfo() {
      try {
          const contents_no = req.query.contents_no;
        const result = await db.getContentsByNo(contents_no);

        if(!result) {
            return res.status(200).json({ result: false, errMsg:'Wrong contents number' });
        }

        const contentsInfo = {
            no = result.no,
        title = result.name,
        description = result.description,
        image = result.filelocation,
        contractAddress = contractAddress
        }

        return res.status(200).json({ result: true, info: contentsInfo });
      } catch (e) {
        console.log("getContentsInfo error: ", e);
      }
    }
    getContentsInfo(req, res);
  });

// userId로 그 유저의 컨텐츠 목록 가져오기
router.post("/getusercontents", upload, (req, res) => {
  async function getUserContents() {
    try {
      console.log("body: ", req.body);
      const id = req.body.id;
      const isExistId = await db.getUserById(id);
      if (!isExistId) {
        return res.json({ result: false, errMsg: "doesn't exist ID" });
      }

      const result = await db.getUserContents(id);
      return res.json({ result: true, list: result });
    } catch (e) {
      console.log(e);
    }
  }
  getUserContents(req, res);
});

// userId와 nftId로 그 유저의 소유권 확인 하기
router.post("/checkUserContents", upload, (req, res) => {
  async function checkUserContents() {
    try {
      console.log("body: ", req.body);
      const userId = req.body.id;
      const nftId = req.body.tokenId;
      const isRight = await db.checkUserContents(userId, nftId);
      console.log(`'${userId}' has Right? : `, isRight);
      if (!isRight) {
        return res.json({ result: false, errMsg: "You do not have permission" });
      }

      return res.json({ result: true });
    } catch (e) {
      console.log(e);
    }
  }
  checkUserContents(req, res);
});

async function pinFileToIPFS(fileName) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fs.createReadStream(fileName));
  const res = await axios.post(url, data, {
    maxContentLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });

  const result = res.data;
  console.log('IPFS result: ', result);

  return result;
}

async function test() {
//   const name = "mountain";
//   const description = "NFT TEST Mountain";
//   const file = "./uploads/mountains-g70f1472b1_1920.jpg";

//   let hash = await pinFileToIPFS(file);
//   console.log(hash);
//   let imgUrl = pinataPreUrl + hash;

//   let hashJson = util.makeJson(name, description, imgUrl);
//   let hashJsonStr = JSON.stringify(hashJson);
//   const hashJsonName = hash + ".json";
//   fs.writeFileSync(hashJsonName, hashJsonStr);

//   let jsonHash = await pinFileToIPFS(hashJsonName);
//   console.log("jsonHash: ", jsonHash);
}


// pinFileToIPFS("./uploads/mountains-g70f1472b1_1920.jpg");

// test();
module.exports = router;
