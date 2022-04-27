import React, { useEffect, useMemo, useState } from 'react';
import { Input, AutoComplete, InputNumber, Button, notification, Progress } from 'antd';
import { getTokens } from "../utils";
import styled from 'styled-components';
import Wallet from '../pages/components/Wallet';
import { GithubOutlined, SendOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import {
  commafy,
  NATIVE_TOKEN_ADDRESS,
  isAddress,
  airdrop,
} from '../utils';
const BigNumber = require('bignumber.js');
import FileSelecton from '../pages/components/FileSelection';

const { TextArea } = Input;

function BasicLayout(props) {
  const [wallet, setWallet] = useState({});
  const [tokens, setTokens] = useState();
  const [balance, setBalance] = useState(0);
  const [symbol, setSymbol] = useState('NativeCoin');
  const [totalSend, setTotalSend] = useState('0');
  const [txCount, setTxCount] = useState(0);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [tokenAddress, setTokenAddress] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [tokensInfo, setTokensInfo] = useState();
  const [inputText, setInputText] = useState('');
  const [receivers, setReceivers] = useState([]);
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState();
  const [updateBalance, setUpdateBalance] = useState(0);
  const [isNFT, setIsNFT] = useState(1);

  useEffect(() => {
    const func = async () => {
      if (!wallet || !wallet.networkId || !wallet.address || !tokens) {
        return;
      }
      // console.log('update info');

      
      let ret = tokens[isNFT.toString()][0];
      if (!ret || ret.length === 0) {
        return;
      }
      console.log("ret: ", ret)

      if (
        isAddress(tokenAddress) &&
        !tokens[isNFT.toString()][1].includes(tokenAddress)
      ) {
        console.log('set balance', commafy((new BigNumber(ret[tokenAddress].balance)).div(10 ** ret[tokenAddress].decimals)));
        setBalance(
          commafy(new BigNumber(ret[tokenAddress].balance).div(10 ** ret[tokenAddress].decimals)),
        );
        setDecimals(ret[tokenAddress].decimals);
        setSymbol(ret[tokenAddress].symbol);
      }

      let e = tokenAddress;

      if (isAddress(e)) {
        let tokensInfo = ret;
        console.log('tokensInfo: ', tokensInfo[e]);
        if (tokensInfo && tokensInfo[e]) {
          if (e === NATIVE_TOKEN_ADDRESS) {
            setBalance(commafy(new BigNumber(tokensInfo[e].balance).div(1e18)));
            setDecimals(18);
            setSymbol(nativeCoin);
          } else {
            setBalance(
              commafy(new BigNumber(tokensInfo[e].balance).div(10 ** tokensInfo[e].decimals)),
            );
            setDecimals(tokensInfo[e].decimals);
            setSymbol(tokensInfo[e].symbol);
          }
        }
      }

      // console.debug('tokens', ret);
      setTokensInfo(ret);

      let options = tokens[isNFT.toString()][1].map((v) => {
        console.log("option address: ", v)
        if (v === NATIVE_TOKEN_ADDRESS) {
          return {
            label:
              nativeCoin +
              ' (balance: ' +
              commafy(new BigNumber(ret[v].balance).div(1e18)) +
              ') \t' +
              v,
            value: v,
          };
        } else {
          return {
            label:
              ret[v].symbol +
              ' (balance: ' +
              commafy(new BigNumber(ret[v].balance).div(10 ** ret[v].decimals)) +
              ') \t' +
              v,
            value: v,
          };
        }
      });
      console.log(options)

      setTokenOptions(options);
    };
    func();
    let timer = setInterval(func, 10000);
    return () => {
      clearInterval(timer);
    };
  }, [wallet, tokenAddress, isNFT, tokens]);

  useEffect(() => {
    const func = async () => {
      if (!wallet || !wallet.networkId || !wallet.address) {
        return;
      }
      setTokenAddress("");
      setTokenOptions([]);
      setTokens();
      if (wallet.address) {
        const result = await getTokens(wallet.networkId, wallet.address);
        console.log("getTokens: ", result)
        setTokens(result);      
      }      
    };
    func();
  }, [wallet]);

  useEffect(() => {
    let lines = inputText.split('\n');
    let tmpTotal = new BigNumber(0);
    let _receivers = [];
    let _amounts = [];
    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].split(',').length === 2 &&
          isAddress(lines[i].split(',')[0]) &&
          !isNaN(lines[i].split(',')[1])
        ) {
          tmpTotal = tmpTotal.plus(new BigNumber(lines[i].split(',')[1]));
          _receivers.push(lines[i].split(',')[0].toLowerCase());
          _amounts.push(new BigNumber(lines[i].split(',')[1]));
        }
      }

      setTotalSend(!isNFT ? tmpTotal.toString() : _amounts.length);
      setReceivers(_receivers);
      setAmounts(_amounts);
      setTxCount(Math.ceil(_receivers.length / 200));
    }
  }, [inputText]);

  const onUploadCheck = (value, files) => {
    if (value) {
      var reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        setInputText(fileString);
      };
    }
  };

  const chainId = wallet.networkId;
  const nativeCoin = useMemo(() => {
    if (!chainId) {
      return '___';
    }
    switch (Number(chainId)) {
      case 1:
      case 3:
      case 4:
        return 'ETH';
      case 56:
      case 97:
        return 'BNB';
      case 137:
      case 80001:
        return 'MATIC';
    }
  }, [chainId]);

  return (
    <Background>
      <Wallet setWallet={setWallet} wallet={wallet} />
      <Head>
        <Title>Airdrop NFT</Title>

        <WalletButton
          onClick={() => {
            wallet.resetApp().then(wallet.connect);
          }}
        >
          {!wallet.connected
            ? 'Connect Wallet'
            : wallet.address.slice(0, 6) + '...' + wallet.address.slice(-6)}
        </WalletButton>

        {Number(wallet.networkId) !== 1 &&
          Number(wallet.networkId) !== 56 &&
          Number(wallet.networkId) !== 137 && <Testnet>Testnet</Testnet>}

        {/* <Menus>
        <MenuTitle>Price</MenuTitle>
        <MenuTitle>FAQ</MenuTitle>
        <MenuTitle>Contact</MenuTitle>
        </Menus> */}
      </Head>
      <H1>Welcome to Airdrop NFT</H1>
      <H2>This supports sending NFTs from wallet to multiple addresses.</H2>
      <H3>Network supported: Polygon Mainnet/Testnet </H3>
      <Body>
        <Text>
          <span>Input or select token address:</span>{' '}
          
        </Text>
        <span>
          <SAutoComplete
            value={tokenAddress}
            onChange={(e) => {
              setTokenAddress(e.toLowerCase());
              if (isAddress(e)) {
                if (tokensInfo && tokensInfo[e]) {
                  if (e === NATIVE_TOKEN_ADDRESS) {
                    setBalance(commafy(new BigNumber(tokensInfo[e].balance).div(1e18)));
                    setDecimals(18);
                    setSymbol(nativeCoin);
                  } else {
                    setBalance(
                      commafy(
                        new BigNumber(tokensInfo[e].balance).div(10 ** tokensInfo[e].decimals),
                      ),
                    );
                    setDecimals(tokensInfo[e].decimals);
                    setSymbol(tokensInfo[e].symbol);
                  }
                }
              }
            }}
            allowClear
            // autoFocus
            options={tokenOptions}
          />
        </span>
        <DecimalBox>
          Decimals:
          <span>{' ' + decimals}</span>
        </DecimalBox>
        <Text>Input or upload recipient addresses in CSV format:</Text>
        <FileSelecton
          type="file"
          id="input"
          style={{ marginLeft: '10px' }}
          buttonStyle={{
            background: '#404040b3',
            color: 'white',
          }}
          onChange={(e) => {
            let value = e.target.value;
            let files = e.target.files;
            setTimeout(() => {
              onUploadCheck(value, files);
            }, 1000);
          }}
        />
        <STextArea
          rows={12}
          placeholder={`
          You can paste multiple addresses here, such as below:
          receiver, tokenId

          0x4cF0a877e906deAd748a41Ae7da8C220e4247d9E,1
          0x5560Af0f46d00fcEa88627A9df7a4798B1B10961,2
          0xd409bc9f0Acc5A4c8a86FebB2d99BB87EF7E268d,3
          `}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
          }}
        />
        <Text>
          Your balance: {balance + ' ' + symbol}, Receipent addresses: {receivers.length}, Total
          amount: {totalSend + ' ' + symbol}{' '}
        </Text>
        <ButtonLine>
          <SButton
            type="primary"
            loading={loading}
            icon={<SendOutlined />}
            disabled={txCount === 0}
            onClick={() => {
              if (!isAddress(tokenAddress)) {
                notification.open({ message: 'Please fill token address' });
                return;
              }

              if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
                if (
                  new BigNumber(totalSend)
                    .plus(0.1)
                    .gt(new BigNumber(tokensInfo[NATIVE_TOKEN_ADDRESS].balance).div(1e18))
                ) {
                  notification.open({ message: 'Balance not enough' });
                  return;
                }
              } else {
                if (
                  new BigNumber(totalSend).gt(
                    new BigNumber(tokensInfo[tokenAddress].balance).div(
                      10 ** tokensInfo[tokenAddress].decimals,
                    ),
                  )
                ) {
                  notification.open({ message: 'Balance not enough' });
                  return;
                }

                if (
                  !new BigNumber(tokensInfo[NATIVE_TOKEN_ADDRESS].balance)
                    .div(1e18)
                    .gt(new BigNumber(0.01))
                ) {
                  notification.open({ message: 'Gas fee not enough' });
                  return;
                }
              }

              setLoading(true);
              let key = Date.now();
              let args = {
                message: 'Waiting for transaction confirm...',
                duration: 0,
                key,
              };
              notification.open(args);
              airdrop(
                wallet.networkId,
                wallet.address,
                wallet.web3,
                tokenAddress,
                decimals,
                receivers,
                amounts,
                new BigNumber(totalSend),
                setProgress,
              )
                .then((ret) => {
                  if (ret.success) {
                    args = {
                      message: 'Transactions sent success',
                      // description: JSON.stringify(ret.data, null, 2),
                      duration: 0,
                      key,
                    };
                    notification.open(args);
                    setUpdateBalance(updateBalance + 1);
                  } else {
                    args = {
                      message: 'Transactions sent failed',
                      // description: JSON.stringify(ret.data, null, 2),
                      duration: 0,
                      key,
                    };
                    notification.open(args);
                    setUpdateBalance(updateBalance + 1);
                  }
                  setLoading(false);
                })
                .catch((err) => {
                  args = {
                    message: 'Transactions sent failed',
                    // description: JSON.stringify(err, null, 2),
                    key,
                    duration: 0,
                  };
                  notification.open(args);
                  setLoading(false);
                  setUpdateBalance(updateBalance + 1);
                });
            }}
          >
            Airdrop
          </SButton>
        </ButtonLine>
        {progress !== undefined && loading && <Progress percent={progress} />}
      </Body>
    </Background>
  );
}

export default BasicLayout;

const Background = styled.div`
  background-image: url('blockchain.jpg');
  min-width: 100%;
  min-height: 100%;
  background-size: 100% 100%;
  color: white;
  padding-bottom: 40px;
`;

const ButtonLine = styled.div`
  text-align: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const Head = styled.div`
  padding: 20px;
  flex: 1;
`;

const Title = styled.span`
  color: white;
  font-size: 20px;
  font-weight: 700;
  padding: 15px;
`;

const WalletButton = styled.span`
  border-radius: 15px;
  background: #404040b3;
  color: white;
  height: 40px;
  width: 160px;
  padding: 8px;
  margin: 5px;
  float: right;
  text-align: center;
  cursor: pointer;
`;

const Menus = styled.div`
  padding-right: 20px;
  cursor: pointer;
  color: white;
`;

const MenuTitle = styled.span`
  background: none;
  font-size: 18px;
  font-weight: 500;
  // width: auto;
  // cursor: auto;
  padding-right: 20px;
  cursor: pointer;
  color: white;
`;

const Testnet = styled(WalletButton)`
  background: #d33400eb;
  font-size: 15px;
  width: auto;
  cursor: auto;
  color: white;
`;

const H1 = styled.h1`
  color: white;
  margin-top: 8vh;
  margin-left: auto;
  margin-right: auto;
  font-size: 40px;
  width: 100%;
  text-align: center;
`;

const H2 = styled.div`
  color: #c3c3c3;
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
  font-size: 20px;
  width: 100%;
  text-align: center;
`;

const H3 = styled(H2)`
  margin-top: 5px;
  font-size: 16px;
`;

const Body = styled.div`
  background: #000c14b8;
  box-shadow: rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 14%) 0px 4px 8px,
    rgb(0 0 0 / 14%) 0px 16px 24px, rgb(0 0 0 / 10%) 0px 24px 32px;
  width: 800px;
  height: 640px;
  margin-top: 20px;
  border-radius: 20px;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
  margin-bottom: 40px;
  color: white;
`;

const Text = styled.div`
  font-size: 16px;
  margin: 10px;
`;
const NFTCheckbox = styled(Checkbox)`
  font-size: 14px;
  margin-right: 15px;
  color: white;
  float: right;
`;

const SAutoComplete = styled(AutoComplete)`
  width: 80%;
  margin: 10px;

  div {
    border-radius: 15px !important;
    background: transparent !important;
    color: white !important;
    border: 1px solid #c3c3c3 !important;
  }
`;

const DecimalBox = styled.span`
  margin: 10px;
  padding: 10px;
`;

const STextArea = styled(TextArea)`
  margin: 10px;
  width: 97%;
  color: white !important;
`;

const SButton = styled(Button)`
  margin-top: 20px;
`;
