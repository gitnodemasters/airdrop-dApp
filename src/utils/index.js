const { aggregate } = require('@makerdao/multicall');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
import Moralis from 'moralis/node';
const abi = require('../assets/AirdropNFT.json').abi;
const abiNFT = require('../assets/ERC721.json').abi;

export const TX_LIMIT = 200;
export const AIRDROP_SC_ADDRESS = {
  137: '0x2F124c09750688f33286eD7FDDf2Eb6515E0e8d0',
  80001: '0xc9324C0C4D91CBfFf025C491d7684d2028d58043',
};

export const NATIVE_TOKEN_ADDRESS = '0x000000000000000000000000000000000000beef';

export const airdrop_origin = async (
  chainId,
  from,
  web3,
  tokenAddress,
  decimals,
  receivers,
  tokenIds,
  totalAmount,
  setProgress,
) => {
  console.log(
    'airdrop input',
    chainId,
    from,
    web3,
    tokenAddress,
    decimals,
    receivers,
    tokenIds,
    totalAmount,
  );
  if (!from || !web3 || !chainId || !tokenAddress || !receivers || !tokenIds || !totalAmount) {
    return { success: false, data: 'Params error' };
  }

  let waitArray = [];

  setProgress(0);
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) {
    waitArray.push(await approve(AIRDROP_SC_ADDRESS[chainId], tokenAddress, from, web3));
  }
  const sc = new web3.eth.Contract(abi, AIRDROP_SC_ADDRESS[chainId]);

  for (let i = 0; i < Math.ceil(receivers.length / TX_LIMIT); i++) {
    let subRecivers = receivers.slice(i * TX_LIMIT, (i + 1) * TX_LIMIT);
    let subtokenIds = tokenIds.slice(i * TX_LIMIT, (i + 1) * TX_LIMIT);
    subtokenIds = subtokenIds.map((v) => {
      return '0x' + new BigNumber(v).multipliedBy(10 ** decimals).toString(16);
    });

    let gas = 210000 + 80000 * subRecivers.length;
    if (gas > 8e6) {
      gas = 8e6;
    }

    let data = await sc.methods.airdrop(tokenAddress, subRecivers, true, subtokenIds).encodeABI();

    const params = {
      to: AIRDROP_SC_ADDRESS[chainId],
      data,
      value: 0,
      gasPrice: '0x2540BE400',
      from,
    };

    if (!window.injectWeb3) {
      params.gas = '0x' + gas.toString(16);
      params.gasPrice = undefined;
    } else {
      params.gasLimit = '0xF4240';
    }

    waitArray.push(web3.eth.sendTransaction(params));
    setProgress((((i + 1) * 100) / Math.ceil(receivers.length / TX_LIMIT)).toFixed(0));
  }

  let txID = await Promise.all(waitArray);
  txID = txID.map((v) => {
    if (v.transactionHash) {
      return {
        txHash: v.transactionHash,
        status: v.status,
      };
    } else {
      return v;
    }
  });

  return { success: true, data: txID };
};

const approveNFT = async (scAddr, tokenAddr, owner, web3) => {
  console.log('approve called', scAddr, tokenAddr, owner);
  if (!tokenAddr || !web3) {
    return { success: false, data: 'approve input params error' };
  }
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    let token = new web3.eth.Contract(abiNFT, tokenAddr);
    let isApproved = await token.methods.isApprovedForAll(owner, scAddr).call();
    if (isApproved) {
      console.log('approved already');
      return { success: true };
    }
    const data = await token.methods.setApprovalForAll(scAddr, true).encodeABI();
    const params = {
      to: tokenAddr,
      data,
      value: 0,
      gasPrice: '0x2540BE4000',
      from: owner,
    };
    if (!window.injectWeb3) {
      params.gas = '0x' + web3.utils.toBN(210000).toString('hex');
      params.gasPrice = '0x' + web3.utils.toBN(3).toString('hex');
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
};

export const airdrop = async (
  chainId,
  from,
  web3,
  tokenAddress,
  decimals,
  receivers,
  tokenIds,
  totalAmount,
  setProgress,
) => {
  console.log(
    'airdrop input',
    chainId,
    from,
    web3,
    tokenAddress,
    decimals,
    receivers,
    tokenIds,
    totalAmount,
  );
  if (!from || !web3 || !chainId || !tokenAddress || !receivers || !tokenIds || !totalAmount) {
    return { success: false, data: 'Params error' };
  }

  let waitArray = [];

  setProgress(0);
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS) {
    waitArray.push(await approve(AIRDROP_SC_ADDRESS[chainId], tokenAddress, from, web3));
  }
  const sc = new web3.eth.Contract(abi, AIRDROP_SC_ADDRESS[chainId]);

  for (let i = 0; i < Math.ceil(receivers.length / TX_LIMIT); i++) {
    let subRecivers = receivers.slice(i * TX_LIMIT, (i + 1) * TX_LIMIT);
    let subtokenIds = tokenIds.slice(i * TX_LIMIT, (i + 1) * TX_LIMIT);
    subtokenIds = subtokenIds.map((v) => {
      return '0x' + new BigNumber(v).multipliedBy(10 ** decimals).toString(16);
    });
    let gas;
    try {
      gas = await sc.methods
        .airdrop(tokenAddress, subRecivers, true, subtokenIds)
        .estimateGas({ from: from });
      if (gas > 30000) {
        gas = 30000;
      }
    } catch (error) {
      gas = 30000;
    }
    console.log('airdrop gas: ', gas, subRecivers, subtokenIds);
    waitArray.push(
      await sc.methods.airdrop(tokenAddress, subRecivers, true, subtokenIds).send({
        from: from,
        gasPrice: gas * 10 ** 6,
      }),
    );
    setProgress((((i + 1) * 100) / Math.ceil(receivers.length / TX_LIMIT)).toFixed(0));
  }

  let txID = await Promise.all(waitArray);
  txID = txID.map((v) => {
    if (v.transactionHash) {
      return {
        txHash: v.transactionHash,
        status: v.status,
      };
    } else {
      return v;
    }
  });

  return { success: true, data: txID };
};

const approve = async (scAddr, tokenAddr, owner, web3) => {
  try {
    console.log('approve called', scAddr, tokenAddr, owner);
    if (!tokenAddr || !web3) {
      return { status: false, data: 'approve input params error' };
    }
    if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
      let token = new web3.eth.Contract(abiNFT, tokenAddr);
      let isApproved = await token.methods.isApprovedForAll(owner, scAddr).call();
      if (isApproved) {
        console.log('approved already');
        return { status: true };
      }
      let gas = await token.methods.setApprovalForAll(scAddr, true).estimateGas({ from: owner });
      console.log('gas: ', gas);
      await token.methods
        .setApprovalForAll(scAddr, true)
        .send({
          from: owner,
          gasPrice: gas * 10 ** 6,
        })
        .on('transactionHash', (hash) => {
          return { status: true, data: hash };
        });
    }
  } catch (e) {
    console.log(e);
    return { status: false };
  }
};

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
    return $1 + ',';
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
};

export const initMoralis = () => {
  // const serverUrl = process.env.REACT_APP_MORALIS_SERVER_URL;
  // const appId = process.env.REACT_APP_MORALIS_APP_ID;
  const serverUrl = 'https://tygcsvvvfuf2.usemoralis.com:2053/server';
  const appId = 'QGSLvuqMX76hwIAM1OYeed7ZeKE1dm0rF79YSIUB';
  console.log(serverUrl, appId);
  return Moralis.start({ serverUrl, appId });
};

export const getTokens = async (networkId, account) => {
  try {
    let chainId = 'eth';
    switch (Number(networkId)) {
      case 1:
        chainId = 'eth';
        break;
      case 3:
        chainId = 'ropsten';
        break;
      case 4:
        chainId = 'rinkeby';
        break;
      case 56:
        chainId = 'bsc';
        break;
      case 97:
        chainId = 'bsc testnet';
        break;
      case 137:
        chainId = 'polygon';
        break;
      case 80001:
        chainId = 'mumbai';
        break;
    }

    // initMoralis();
    const options = {
      chain: chainId,
      address: account,
    };
    const nativeBalance = await Moralis.Web3API.account.getNativeBalance(options);
    let NFTs = await Moralis.Web3API.account.getNFTs(options);
    // console.log(NFTs)
    let nftAddresses = [...new Set(NFTs.result.map((item) => item.token_address))]; // [ 'A', 'B']
    let nfts = {};
    if (NFTs.result.length > 0) {
      nftAddresses.map((address) => {
        let balance = 0,
          symbol = '',
          temp = {};
        NFTs.result.map((item) => {
          if (address == item.token_address) {
            balance += Number(item.amount);
            symbol = item.symbol;
          }
        });
        nfts[`${address}`] = { symbol, balance, decimals: 0, token_address: address };
        // nfts.push(temp)
      });
    }
    nfts[`${NATIVE_TOKEN_ADDRESS}`] = { balance: nativeBalance.balance };

    return { 1: [nfts, nftAddresses] };
  } catch (error) {
    console.log(error);
  }
};

export const getNFTContractHolders = async (networkId, contractAddress) => {
  try {
    let chainId = 'eth';
    switch (Number(networkId)) {
      case 1:
        chainId = 'eth';
        break;
      case 3:
        chainId = 'ropsten';
        break;
      case 4:
        chainId = 'rinkeby';
        break;
      case 56:
        chainId = 'bsc';
        break;
      case 97:
        chainId = 'bsc testnet';
        break;
      case 137:
        chainId = 'polygon';
        break;
      case 80001:
        chainId = 'mumbai';
        break;
    }
    // initMoralis();
    let cursor = null;
    let group1 = [], group2 = [];
    do {
      const response = await Moralis.Web3API.token.getNFTOwners({
        address: contractAddress,
        chain: chainId,
        limit: 500,
        cursor: cursor,
      });

      for (const owner of response.result) {
        if (Number(owner.token_id) > 51 && Number(owner.token_id) < 1057) {
          group1.push(owner.owner_of);
        }
        if (Number(owner.token_id) > 2768 && Number(owner.token_id) < 2858) {
          group2.push(owner.owner_of);
        }
      }
      cursor = response.cursor;
    } while (cursor != '' && cursor != null);
    const group_1 = [...new Set(group1)];
    const group_2 = [...new Set(group2)];
    
    const counts = {};
    for (const num of group1) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    let group_f = []
    for (const v of group_1) {
      for (let i = 0; i < counts[v] - 1; i++) {
        group_f.push(v)
      }
    }

    const counts2 = {};
    for (const num of group2) {
      counts2[num] = counts2[num] ? counts2[num] + 1 : 1;
    }
    let group_f2 = []
    for (const v of group_2) {
      for (let i = 0; i < counts2[v] - 1; i++) {
        group_f2.push(v)
      }
    }

    return { group1: group_f, group2: group_f2 };
  } catch (error) {
    console.log(error);
  }
};
