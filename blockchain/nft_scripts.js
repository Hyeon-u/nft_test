require("dotenv").config();
const API_URL = process.env.API_URL;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);
// const contract = require("../contracts/artifacts/NFT.json"); // SAIC 테스트
const contract = require("../contracts/artifacts/TESTNFT.json"); // CANE 테스트

// console.log(JSON.stringify(contract.abi));
// console.log(contract.abi);

// const contractAddress = "0xb7b6F49A45cc4F8300984CC765d55aA673076886"; // SAIC 테스트
const contractAddress = "0x327aa8391a5ea7b15e019c2adf4e02f902e55c79"; // CANE 테스트
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

const gasLimit = 500000; // 소모되는 최대 가스량
const priorityGas = web3.utils.toHex(web3.utils.toWei("10", "gwei")); // 가스팁

async function _create_tx(object, privateKey) {
  const signPromise = await web3.eth.accounts.signTransaction(
    object,
    privateKey
  );
  return signPromise;
}

async function _send_tx(signedTx) {
  try {
    web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
      function (err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash);
          const interval = setInterval(function () {
            console.log("Attempting to get transaction receipt...");
            web3.eth.getTransactionReceipt(hash, function (err, receipt) {
              if (err) {
                clearInterval(interval);
              }
              if (receipt) {
                console.log("Trasaction Result", receipt.status);
                clearInterval(interval);
              }
            });
          }, 2000);
        } else {
          console.log(
            "Something went wrong when submitting your transaction:",
            err
          );
        }
      }
    );
  } catch (err) {
    console.log("send transaction failed:", err);
  }
}

// nft 생성(id 1부터 자동 발급)
async function mintNFT(toAddress, tokenURI) {
  try {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); //get latest nonce
    const data = await nftContract.methods
      .create(toAddress, tokenURI)
      .encodeABI();

    const txObject = {
      from: PUBLIC_KEY,
      to: contractAddress,
      nonce: nonce,
      gas: gasLimit,
      maxPriorityFeePerGas: priorityGas,
      data: data,
    };

    const signedTx = await _create_tx(txObject, PRIVATE_KEY);
    await _send_tx(signedTx);
  } catch (e) {
    console.log("NFT mint error: ", e);
  }
}

// nft 전송
async function transferNFT(fromAddress, toAddress, fromPK, tokenId) {
  try {
    const nonce = await web3.eth.getTransactionCount(fromAddress, "latest"); //get latest nonce
    const data = await nftContract.methods
      .safeTransferFrom(fromAddress, toAddress, tokenId)
      .encodeABI();

    const txObject = {
      from: fromAddress,
      to: contractAddress,
      nonce: nonce,
      gas: gasLimit,
      maxPriorityFeePerGas: priorityGas,
      data: data,
    };

    const signedTx = await _create_tx(txObject, fromPK);
    await _send_tx(signedTx);
  } catch (e) {
    console.log("NFT transfer error: ", e);
  }
}

async function sendEther(fromAddress, toAddress, fromPK, amount) {
  try {
    // 보내는 주소 확인
    if (!toAddress || toAddress.length != 42) {
      return "please check to address";
    }

    // 보내는 금액 확인
    amount = String(amount).trim();
    if (!amount) {
      return "please check amount";
    }

    // web3가 연결 안되어 있으면 web3 연결
    if (!web3) web3 = createAlchemyWeb3(API_URL);
    const nonce = await web3.eth.getTransactionCount(fromAddress, "latest"); //get latest nonce

    const txObject = {
      from: fromAddress,
      to: toAddress,
      nonce: nonce,
      value: web3.utils.toHex(web3.utils.toWei(amount, 'ether')),
      gas: 21000,
      maxPriorityFeePerGas: priorityGas
    };
    const signedTx = await _create_tx(txObject, fromPK);
    await _send_tx(signedTx);
  } catch (e) {
    console.log("Ether transfer error: ", e);
  }
}

// 해당 주소의 nft 갯수
async function balanceOf(ownerAddress) {
  try {
    const result = await nftContract.methods.balanceOf(ownerAddress).call();
    return result;
  } catch (e) {
    console.log("NFT balanceOf error: ", e);
  }
}

// nft 이름
async function name() {
  try {
    const result = await nftContract.methods.name().call();
    return result;
  } catch (e) {
    console.log("NFT name error: ", e);
  }
}

// nft 심볼
async function symbol() {
  try {
    const result = await nftContract.methods.symbol().call();
    return result;
  } catch (e) {
    console.log("NFT symbol error: ", e);
  }
}

// nftId로 소유월렛 확인
async function ownerOf(tokenId) {
  try {
    const result = await nftContract.methods.ownerOf(tokenId).call();
    return result;
  } catch (e) {
    console.log("NFT ownerOf error: ", e);
  }
}

// 해당 월렛이 갖고 있는 nftId들을 배열로 리턴
async function tokensOfOwner(ownerAddress) {
  try {
    const result = await nftContract.methods.tokensOfOwner(ownerAddress).call();
    return result;
  } catch (e) {
    console.log("NFT tokensOfOwner error: ", e);
  }
}

// 해당 nftId의 정보를 담고 있는 uri 리턴
async function tokenURI(tokenId) {
  try {
    const result = await nftContract.methods.tokenURI(tokenId).call();
    return result;
  } catch (e) {
    console.log("NFT tokenURI error: ", e);
  }
}

// 발행된 nft 갯수
async function totalSupply() {
  try {
    const result = await nftContract.methods.totalSupply().call();
    return result;
  } catch (e) {
    console.log("NFT totalSupply error: ", e);
  }
}

async function ethCreate() {
  try {
    var createAccount = web3.eth.accounts.create();
    var address = createAccount.address;
    var privateKey = createAccount.privateKey;
    var result = _getReturnResult(address, privateKey);
    return result;
  } catch (e) {
    console.log("ETH wallet Create ERROR" + e);
  }
}

function _getReturnResult(address, privateKey) {
  return {
    address: String(address).trim(),
    privateKey: String(privateKey).trim(),
  };
}

async function start() {
  let result;
  result = await sendEther("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537", "0x388d66AE970B9Bc4150774F75b5bBD3AC15be920", PRIVATE_KEY, 1)
  // let nft = await balanceOf("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537");
  // result = await name();
  // result = await ownerOf(1);
  // result = await tokensOfOwner("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537");
  // result = await tokenURI(1);
  // result = await totalSupply();
  // result = await ethCreate();
  console.log("result: ", result);
}

start();
// mintNFT(
//   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
//   "https://drive.google.com/uc?id=1qeoOwU7w24tYTGczB1IeGdkfqHBTVefu"
// );

// transferNFT(
//   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
//   "0x388d66AE970B9Bc4150774F75b5bBD3AC15be920",
//   PRIVATE_KEY,
//   1
// );

module.exports = {
  mintNFT,
  transferNFT,
  sendEther,

  name,
  symbol,
  balanceOf,
  ownerOf,
  tokensOfOwner,
  tokenURI,
  totalSupply,
  ethCreate,
};
