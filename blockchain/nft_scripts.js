require("dotenv").config();
const axios = require("axios");
// const API_URL = process.env.API_URL_ROPSTEN;
const API_URL = process.env.API_URL_RINKEBY;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(API_URL);
// const contract = require("../contracts/artifacts/NFT.json"); // SAIC 테스트
const contract = require("../contracts/artifacts/TESTNFT.json"); // CANE 테스트
const db = require("../db");
const companyWallet = "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537";
const companyPrivateKey =
  "448164e5f7f91a11ae190dc87830811fb514deac09c30811bf863029df1bcc19";

// console.log(contract.abi);

// const contractAddress = "0xb7b6F49A45cc4F8300984CC765d55aA673076886"; // SAIC ropsten
// const contractAddress = "0x327aa8391a5ea7b15e019c2adf4e02f902e55c79"; // CANE ropsten
const contractAddress = "0xb7b6F49A45cc4F8300984CC765d55aA673076886"; // CANE rinkeby
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

const gasLimit = 500000; // 소모되는 최대 가스량
const priorityGas = web3.utils.toHex(web3.utils.toWei("10", "gwei")); // 가스팁

const historyQuery =
  "https://api-rinkeby.etherscan.io/api?module=account&action=tokennfttx"; // 이더스캔 기본 api
let apikey = "8VMHZ3YGWR8M3EINTJUE4RC6WNUQ9XMR6C"; // 이더스캔 api키
async function _create_tx(object, privateKey) {
  const signPromise = await web3.eth.accounts.signTransaction(
    object,
    privateKey
  );
  return signPromise;
}

async function _send_tx(signedTx) {
  try {
    let tx_hash = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
      function (err, hash) {
        if (!err) {
          console.log("The hash of your transaction is: ", hash);
          return hash;
        } else {
          console.log(
            "Something went wrong when submitting your transaction:",
            err
          );
        }
      }
    );
    return tx_hash;
  } catch (err) {
    console.log("send transaction failed:", err);
  }
}

async function _check_tx(hash) {
  const interval = setInterval(function () {
    console.log("Attempting to get transaction receipt...");

    web3.eth.getTransactionReceipt(hash, function (err, receipt) {
      if (err) {
        clearInterval(interval);
      }
      if (receipt) {
        console.log(`[${hash}] Result: `, receipt);
        console.log(`[${hash}] Result: `, receipt.status);
        if (receipt.status) {
          // await db.updateStatusContents(hash, )
        }
        clearInterval(interval);
      }
    });
  }, 2000);
}

async function _check_tx_getId(address, hash) {
  let page = 1;
  let sort = "asc";
  let tokenId;

  const query =
    historyQuery +
    `&contractaddress=${contractAddress}&address=${address}&page=${page}&offset=100&sort=${sort}&apikey=${apikey}`;

  try {
    const result = await axios.get(query);
    if (result.data.status == "1") {
      let lists = result.data.result;
      lists.map((list) => {
        if (list.hash === hash) {
          tokenId = list.tokenID;
        }
      });
      return tokenId;
    } else {
      console.log("something wrong: ", result.data);
    }
  } catch (e) {
    console.log("get History Error: ", e);
  }
}

// nft 생성(지갑 주소 받고 발급)
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
    const tx_hash = await _send_tx(signedTx);

    return tx_hash;
  } catch (e) {
    console.log("NFT mint error: ", e);
  }
}

// nft 생성(회사 월렛 발급)
async function mintCompanyNFT(tokenURI) {
  try {
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); //get latest nonce
    const data = await nftContract.methods
      .create(companyWallet, tokenURI)
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
    const tx_hash = await _send_tx(signedTx);
    console.log("1:", tx_hash);
    return tx_hash;
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

// nft 회사 월렛 에서 전송
async function companyTransferNFT(toAddress, tokenId) {
  try {
    const nonce = await web3.eth.getTransactionCount(companyWallet, "latest"); //get latest nonce
    const data = await nftContract.methods
      .safeTransferFrom(companyWallet, toAddress, tokenId)
      .encodeABI();

    const txObject = {
      from: companyWallet,
      to: contractAddress,
      nonce: nonce,
      gas: gasLimit,
      maxPriorityFeePerGas: priorityGas,
      data: data,
    };

    const signedTx = await _create_tx(txObject, companyPrivateKey);
    await _send_tx(signedTx);
  } catch (e) {
    console.log("Company NFT transfer error: ", e);
  }
}

// 이더리움 전송
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
      value: web3.utils.toHex(web3.utils.toWei(amount, "ether")),
      gas: 21000,
      maxPriorityFeePerGas: priorityGas,
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

// 이더리움 월렛 생성
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

// etherscan 에서 해당 월렛의 nft 거래내역 확인
async function getHistorybyAddress(address) {
  let page = 1;
  let offset = 100;
  let sort = "asc";

  const query =
    historyQuery +
    `&contractaddress=${contractAddress}&address=${address}&page=${page}&offset=100&sort=${sort}&apikey=${apikey}`;

  try {
    const result = await axios.get(query);
    if (result.data.status == "1") {
      const history = result.data.result;
      return history;
    } else {
      console.log("something wrong: ", result.data);
    }
  } catch (e) {
    console.log("get History Error: ", e);
  }
}

function _getReturnResult(address, privateKey) {
  return {
    address: String(address).trim(),
    privateKey: String(privateKey).trim(),
  };
}

async function check_tx() {
  try {
    const list = await db.getMintingContents();
    let length = list.length;

    if (!length) {
      console.log("MInting list length: 0");
    } else {
      console.log("MInting list length: ", list.length);
      await Promise.all(
        list.map(async (contents) => {
          let hash = contents.mint_tx;
          console.log("hash: ", hash);
          let tokenId = await _check_tx_getId(companyWallet, hash);
          console.log("tokenId: ", tokenId);
          if (tokenId) {
            await db.updateSuccessMintingContents(hash, tokenId);
          }
        })
      );
    }

    setTimeout(() => {
      try {
        check_tx();
      } catch (e) {
        console.log("check_tx error: ", e);
      }
    }, 5000);
  } catch (e) {
    console.log("check_tx error: ", e);
  }
}

async function start() {
  let result;
  // check_tx();
  // result = await _check_tx(
  //   "0x930ab99047b305b3e1694e38179446b1bb1313f297e3c35a3292bd9e2acb0c7e"
  // );
  // let hash = await mintNFT(
  //     "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
  //     "https://gateway.pinata.cloud/ipfs/QmQg1jrRKnBRVpnQXmvkYDvMN9vEFnjeWL4MtFxe6Xef6L"
  //   );
  // result = await _check_tx_getId(
  //   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
  //   "0x9b13e7f055898f56e89765ed4188af73bf830bdf5e5d3bf80526c8cd360a0165"
  // );
  // result = await sendEther("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537", "0x388d66AE970B9Bc4150774F75b5bBD3AC15be920", PRIVATE_KEY, 1)
  // let nft = await balanceOf("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537");
  // result = await name();
  // result = await ownerOf(1);
  // result = await tokensOfOwner("0x3d9FF2265576eFe225586d271bf2C28e8d6a5537");
  result = await tokenURI(12);
  // result = await totalSupply();
  // result = await ethCreate();
  // result = await getHistorybyAddress(
  //   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537"
  // );
  console.log("result: ", result);
}

// start();
// mintNFT(
//   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
//   "https://gateway.pinata.cloud/ipfs/QmQg1jrRKnBRVpnQXmvkYDvMN9vEFnjeWL4MtFxe6Xef6L"
// );

// transferNFT(
//   "0x3d9FF2265576eFe225586d271bf2C28e8d6a5537",
//   "0x388d66AE970B9Bc4150774F75b5bBD3AC15be920",
//   PRIVATE_KEY,
//   1
// );
check_tx();
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
  companyTransferNFT,

  getHistorybyAddress,
  mintCompanyNFT,
};
