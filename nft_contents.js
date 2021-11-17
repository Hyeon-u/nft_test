const express = require("express");
const router = express.Router();
const multer = require("multer");
const util = require("./utils/utils");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const blockchain = require("./blockchain/nft_scripts");
const db = require("./db");

const pinataApiKey = "8f2b3c06ae4c56bcbfc0";
const pinataSecretApiKey =
  "ba21580c84f19baed77e58156448d9ba853edb68f4026996bdfad21fef54ba39";
const pinataPreUrl = "https://gateway.pinata.cloud/ipfs/";

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
    if (ext !== ".jpg" || ext !== ".png" || ext !== ".gif") {
      return cb(res.status(400).end("only jpg, gif, png are allowed"), false);
    }
    cb(null, true);
  },
  limit: { filesize: 1024 * 1024 * 1024 },
});

var upload = multer({ storage: storage }).single("file");

// File (image, video, gif) 을 upload
router.post("/uploadFile", (req, res) => {
  async function uploadFile() {
    try {
      console.log("contents/uploadFile:", req.body);
      upload(req, res, (err) => {
        if (err) {
          return res.json({ result: false, err });
        }

        const userId = req.body.id;
        const name = req.body.name;
        const description = req.body.description;
        const file = res.req.file;

        // 이미지 업로드
        let hash = await pinFileToIPFS(file.path);
        let imgUrl = pinataPreUrl + hash;        

        // json 파일 생성
        let hashJson = util.makeJson(name, description, imgUrl);
        let hashJsonStr = JSON.stringify(hashJson);
        const hashJsonName = hash + ".json";
        fs.writeFileSync(hashJsonName, hashJsonStr);

        // json 파일 업로드
        let jsonHash = await pinFileToIPFS(hashJsonName);
        let jsonUrl = pinataPreUrl + jsonHash;

        db.makeContents(userId, name, description, jsonUrl, imgUrl, "");

        return res;
      });
    } catch (e) {
      return res.json({ result: false, errMsg:e });
    }
  }
  uploadFile(req, res);
});

router.post("/mintnft", (req, res) => {
  console.log("mintNFT");
  async function mintNft() {
    try {
      const userId = req.body.id;
      const contents = req.body.contents;
      const contents_no = contents.no;

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
      const result = await db.updateMintingContents(contents_no,nft_hash);

      //응답
      if(result) {
        return res.json({ result: true, errMsg:e });
      }
    } catch (e) {
      return res.json({ result: false, errMsg:e });
    }
  }
  mintNft(req, res);
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
  console.log(res.data);
  let hash = res.data.IpfsHash;
  return hash;
}

router.post("/orderBuy", (req, res) => {
  console.log("buy");
  async function buy() {
    try {
      const id = req.body.id;
      const contents = req.body.contents;
      const contents_no = req.body.contents.no;

      const result = await db.changeOwner(contents_no, id);
      if (result) {
        return res.status(200).json({ result: true });
      }
    } catch (e) {
      console.log("orderby error: ", e);
    }
  }
  buy(req, res);
});

async function test() {
  const name = "mountain";
  const description = "NFT TEST Mountain";
  const file = "./uploads/mountains-g70f1472b1_1920.jpg";

  let hash = await pinFileToIPFS(file);
  console.log(hash);
  let imgUrl = pinataPreUrl + hash;

  let hashJson = util.makeJson(name, description, imgUrl);
  let hashJsonStr = JSON.stringify(hashJson);
  const hashJsonName = hash + ".json";
  fs.writeFileSync(hashJsonName, hashJsonStr);

  let jsonHash = await pinFileToIPFS(hashJsonName);
  console.log("jsonHash: ", jsonHash);
}
// pinFileToIPFS("./uploads/mountains-g70f1472b1_1920.jpg");

// test();
