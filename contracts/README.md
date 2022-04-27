# Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

```
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat flatten contracts/JungelTycoon.sol > flatten/JungelTycoonFlatten.sol
npx hardhat help
npx hardhat run scripts/deploy.js --network rinkeby
npx hardhat verify --constructor-args arguments.js --network rinkeby [address]
```