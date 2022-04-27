const { aggregate } = require('@makerdao/multicall');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
import Moralis from "moralis/node";
const abi = require('../assets/AirdropNFT.json').abi;

export const AIRDROP_SC_ADDRESS = {
  '137': '0xb0698bc964b3d0826f6dfd66aa48ffde09da509c',
  '80001': '0x88bb4a2194130689a3502b2f0457916170d64947'
}

export const NATIVE_TOKEN_ADDRESS = '0x000000000000000000000000000000000000beef';

export const airdrop = async (chainId, from, web3, tokenAddress, decimals, receivers, amounts, totalAmount, setProgress) => {
  console.log('airdrop input', chainId, from, web3, tokenAddress, decimals, receivers, amounts, totalAmount);
  if (!from || !web3 || !chainId || !tokenAddress || !receivers || !amounts || !totalAmount) {
    return { success: false, data: 'Params error' };
  }

  let waitArray = [];

  setProgress(0);
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) {
    waitArray.push(await approveNFT(AIRDROP_SC_ADDRESS[chainId], tokenAddress, from, web3));
  }
  const sc = new web3.eth.Contract(abi, AIRDROP_SC_ADDRESS[chainId]);
  const feeNFT = await sc.methods.feeNFT().call({from: from});
  console.log('airdrop NFT', feeNFT, AIRDROP_SC_ADDRESS[chainId]);
  
  for (let i = 0; i < Math.ceil(receivers.length / 200); i++) {
    let subRecivers = receivers.slice(i * 200, (i + 1) * 200);
    let subAmounts = amounts.slice(i * 200, (i + 1) * 200);
    subAmounts = subAmounts.map(v => {
      return '0x' + (new BigNumber(v).multipliedBy(10 ** decimals)).toString(16);
    });

    let value = new BigNumber(feeNFT * subRecivers.length);
    if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
      subAmounts.forEach(v=>{
        value = value.plus(new BigNumber(v));
      })
    }

    let gas = 210000 + 80000 * subRecivers.length;
    if (gas > 8e6) {
      gas = 8e6;
    }
  
    let data = await sc.methods.airdropNFT(tokenAddress, subRecivers, subAmounts).encodeABI();
  
    const params = {
      to: AIRDROP_SC_ADDRESS[chainId],
      data,
      value: '0x' + value.toString(16),
      gasPrice: "0x2540BE400",
      from
    };
  
    if (!window.injectWeb3) {
      params.gas = '0x' + gas.toString(16);
      params.gasPrice = undefined;
    } else {
      params.gasLimit = '0xF4240';
    }
  
    waitArray.push(web3.eth.sendTransaction(params));
    setProgress(((i + 1) * 100 /Math.ceil(receivers.length / 200)).toFixed(0));
  }
  
  let txID = await Promise.all(waitArray);
  txID = txID.map(v=>{
    if (v.transactionHash) {
      return {
        txHash: v.transactionHash,
        status: v.status
      };
    } else {
      return v;
    }
  });

  return { success: true, data: txID };
}

const approveNFT = async (scAddr, tokenAddr, owner, web3) => {
  console.log('approve called', scAddr, tokenAddr, owner);
  if (!tokenAddr || !web3) {
    return { success: false, data: "approve input params error" };
  }
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    const abi = [
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "mint",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "bytes", name: "_data", type: "bytes" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "bool", name: "approved", type: "bool" },
        ],
        name: "setApprovalForAll",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "from", type: "address" },
          { indexed: true, internalType: "address", name: "to", type: "address" },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "approved",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "operator",
            type: "address",
          },
          { indexed: false, internalType: "bool", name: "approved", type: "bool" },
        ],
        name: "ApprovalForAll",
        type: "event",
      },
      {
        constant: true,
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getApproved",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "operator", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
        name: "supportsInterface",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];
    
    let token = new web3.eth.Contract(abi, tokenAddr);
    let isApproved = await token.methods.isApprovedForAll(owner, scAddr).call();
    if (isApproved) {
      return { success: true };
    }
    const data = await token.methods.setApprovalForAll(scAddr, true).encodeABI();
    const params = {
      to: tokenAddr,
      data,
      value: 0,
      gasPrice: "0x2540BE400",
      from: owner
    };
    if (!window.injectWeb3) {
      params.gas = '0x' + web3.utils.toBN(20000).toString('hex');
      params.gasPrice = undefined;
    } else {
      params.gasLimit = '0xF4240';
    }
    let txID = await web3.eth.sendTransaction(params);
    if (!txID || !txID.status) {
      return { success: false, data: 'Approve NFT failed:' + txID.transactionHash };
    }
    return { success: true, data: txID.transactionHash };
  }
  return { success: true };
}


export function commafy(num) {
  if (!num) {
    return '--';
  }

  num = num.toString();

  if (!num.includes('.')) {
    num += '.0';
  } else {
    if (num.indexOf('.') > 3) {
      num = Number(num).toFixed(1);
    } else if (num.length > 5) {
      num = Number(num).toFixed(4);
    }
  }

  return num.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
    return $1 + ",";
  });
}

export const isAddress = function (address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    // check if it has the basic requirements of an address
    return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address.toLowerCase())) {
    // If it's all small caps or all all caps, return true
    return true;
  }

  return false;
}

const initMoralis = () => {
  // const serverUrl = process.env.REACT_APP_MORALIS_SERVER_URL;
  // const appId = process.env.REACT_APP_MORALIS_APP_ID;
  const serverUrl = "https://tygcsvvvfuf2.usemoralis.com:2053/server";
  const appId = "QGSLvuqMX76hwIAM1OYeed7ZeKE1dm0rF79YSIUB";
  console.log(serverUrl, appId)
  return Moralis.start({ serverUrl, appId });
};

export const getTokens = async(networkId, account) => {
  try {
    let chainId = "eth"
    switch (Number(networkId)) {
      case 1:
        chainId = "eth";
        break;
      case 3:
        chainId = "ropsten";
        break;
      case 4:
        chainId = "rinkeby";
        break;
      case 56:
        chainId = "bsc";
        break;
      case 97:
        chainId = "bsc testnet";
        break;
      case 137:
        chainId = "polygon";
        break;
      case 80001:
        chainId = "mumbai";
        break;
    }

    initMoralis();
    const options = {
      chain: chainId,
      address: account,
    };
    const nativeBalance = await Moralis.Web3API.account.getNativeBalance(options);
    let NFTs = await Moralis.Web3API.account.getNFTs(options);
    console.log(NFTs)
    let nftAddresses = [...new Set(NFTs.result.map(item => item.token_address))]; // [ 'A', 'B']
    let nfts = {};
    if (NFTs.result.length > 0) {
      nftAddresses.map (address => {
        let balance = 0, symbol = "", temp = {};
        NFTs.result.map(item => {
          if (address == item.token_address) {
            balance += Number(item.amount);
            symbol = item.symbol;
          }
        })
        nfts[`${address}`] = {symbol, balance, decimals: 0,  token_address: address};
        // nfts.push(temp)
      })      
    }
    nfts[`${NATIVE_TOKEN_ADDRESS}`] = {balance: nativeBalance.balance};
    
    return { '1': [nfts, nftAddresses] };
  } catch (error) {
    console.log(error);
    
  }  
}